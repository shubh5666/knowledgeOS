const fs = require("fs");
const prisma = require("../config/database");
const { extractText, resolveFilePath } = require("../utils/pdfParser");
const ai = require("../config/gemini");
const qdrant = require("../config/qdrant");

/**
 * Splits text into meaningful semantic chunks with overlap.
 * Small documents (e.g. marksheets/certificates <= 1500 chars) are kept intact
 * so all associated fields remain in the same retrieval context.
 */
const chunkText = (text, chunkSize = 800, overlap = 150) => {
    if (!text || typeof text !== "string") return [];
    const trimmed = text.trim();
    if (trimmed.length === 0) return [];

    if (trimmed.length <= 1500) {
        return [trimmed];
    }

    const chunks = [];
    let start = 0;
    while (start < trimmed.length) {
        let end = start + chunkSize;
        if (end >= trimmed.length) {
            chunks.push(trimmed.slice(start).trim());
            break;
        }

        // Break on paragraph newline or sentence end when feasible
        let boundary = trimmed.lastIndexOf("\n", end);
        if (boundary <= start || boundary < end - 200) {
            boundary = trimmed.lastIndexOf(". ", end);
        }
        if (boundary > start && boundary >= end - 250) {
            end = boundary + 1;
        }

        const chunk = trimmed.slice(start, end).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        start = Math.max(start + 1, end - overlap);
    }

    return chunks;
};

const generateEmbedding = async (text) => {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: {
            outputDimensionality: 768,
        },
    });
    return response.embeddings[0].values;
};

const upload = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file provided for upload",
            });
        }

        const document = await prisma.document.create({
            data: {
                title: file.originalname,
                fileName: file.filename,
                fileType: file.mimetype,
                filePath: file.path,
                workspaceId,
            },
        });

        // Universal extraction: handles both text PDFs and scanned/image PDFs via OCR
        const text = await extractText(file.path, file.mimetype);
        const chunks = chunkText(text);

        for (let i = 0; i < chunks.length; i++) {
            await prisma.documentChunk.create({
                data: {
                    content: chunks[i],
                    chunkIndex: i,
                    documentId: document.id,
                },
            });
        }

        res.status(201).json({
            success: true,
            data: document,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const processDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        let chunks = await prisma.documentChunk.findMany({
            where: { documentId },
            orderBy: { chunkIndex: "asc" },
        });

        // Self-healing: if chunks are missing or empty, extract and chunk text
        const hasValidText = chunks.some((c) => c.content && c.content.trim().length > 10);
        if (chunks.length === 0 || !hasValidText) {
            const document = await prisma.document.findUnique({ where: { id: documentId } });
            if (document) {
                const resolved = resolveFilePath(document.filePath);
                if (fs.existsSync(resolved)) {
                    await prisma.documentChunk.deleteMany({ where: { documentId } });
                    const extracted = await extractText(resolved, document.fileType);
                    const newChunks = chunkText(extracted);
                    for (let i = 0; i < newChunks.length; i++) {
                        await prisma.documentChunk.create({
                            data: {
                                content: newChunks[i],
                                chunkIndex: i,
                                documentId: document.id,
                            },
                        });
                    }
                    chunks = await prisma.documentChunk.findMany({
                        where: { documentId },
                        orderBy: { chunkIndex: "asc" },
                    });
                }
            }
        }

        // Vectorize and index points into Qdrant if available
        try {
            const embeddings = await Promise.all(
                chunks.map((chunk) => generateEmbedding(chunk.content))
            );

            const points = chunks.map((chunk, index) => ({
                id: chunk.id,
                vector: embeddings[index],
                payload: {
                    documentId: chunk.documentId,
                    chunkIndex: chunk.chunkIndex,
                    content: chunk.content,
                },
            }));

            await qdrant.upsert("document_chunks", {
                wait: true,
                points,
            });
        } catch (qdrantErr) {
            console.warn("⚠️ Qdrant indexing skipped (offline fallback active):", qdrantErr.message);
        }

        await prisma.document.update({
            where: { id: documentId },
            data: { status: "PROCESSED" },
        });

        res.status(200).json({
            success: true,
            message: "Document processed successfully",
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const getAllDocuments = async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            where: { workspaceId: req.params.workspaceId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: documents,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteDocumentInternal = async (documentId) => {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
    });

    if (!document) {
        throw new Error("Document not found");
    }

    const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
    });

    // Delete vectors in Qdrant if online
    for (const chunk of chunks) {
        try {
            await qdrant.delete("document_chunks", {
                points: [chunk.id],
            });
        } catch (error) {
            // Gracefully ignore if Qdrant is offline
        }
    }

    // Delete database records
    await prisma.documentChunk.deleteMany({ where: { documentId } });
    await prisma.chat.deleteMany({ where: { documentId } });
    await prisma.document.delete({ where: { id: documentId } });

    // Remove file from disk
    const resolved = resolveFilePath(document.filePath);
    if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
    }
};

const removeDocument = async (req, res) => {
    try {
        await deleteDocumentInternal(req.params.documentId);

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    chunkText,
    generateEmbedding,
    upload,
    processDocument,
    getAllDocuments,
    removeDocument,
    deleteDocumentInternal,
};

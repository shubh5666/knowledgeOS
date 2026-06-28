const fs = require("fs");
const prisma = require("../config/database");
const { extractText } = require("../utils/pdfParser");
const ai = require("../config/gemini");
const qdrant = require("../config/qdrant");

const chunkText = (text) => {
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
};

const generateEmbedding = async (text) => {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: {
            outputDimensionality: 768,
        }
    });
    return response.embeddings[0].values;
};

const upload = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const file = req.file;

        const document = await prisma.document.create({
            data: {
                title: file.originalname,
                fileName: file.filename,
                fileType: file.mimetype,
                filePath: file.path,
                workspaceId,
            },
        });

        const text = await extractText(file.path);
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
        const chunks = await prisma.documentChunk.findMany({
            where: { documentId },
            orderBy: { chunkIndex: "asc" },
        });

        // Optimize: Generate embeddings in parallel and batch-upsert points to Qdrant
        const embeddings = await Promise.all(
            chunks.map(chunk => generateEmbedding(chunk.content))
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

    // Delete vectors in Qdrant
    for (const chunk of chunks) {
        try {
            await qdrant.delete("document_chunks", {
                points: [chunk.id],
            });
        } catch (error) {
            console.error("Warning: Failed to delete vector point from Qdrant:", error.message);
        }
    }

    // Delete references in Prisma
    await prisma.documentChunk.deleteMany({ where: { documentId } });
    await prisma.chat.deleteMany({ where: { documentId } });
    await prisma.document.delete({ where: { id: documentId } });

    // Unlink the file from disk
    if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
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
    upload,
    processDocument,
    getAllDocuments,
    removeDocument,
    deleteDocumentInternal,
};
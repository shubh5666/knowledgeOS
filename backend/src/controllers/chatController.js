const fs = require("fs");
const prisma = require("../config/database");
const qdrant = require("../config/qdrant");
const ai = require("../config/gemini");
const { extractText, resolveFilePath } = require("../utils/pdfParser");
const { chunkText, generateEmbedding } = require("./documentController");

/**
 * Generates an answer from Gemini with fallback model support
 * to prevent 503 spikes from failing user requests.
 */
const generateAnswerWithFallbacks = async (prompt) => {
    const candidateModels = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
    ];

    let lastError = null;
    for (const model of candidateModels) {
        try {
            const aiResponse = await ai.models.generateContent({
                model,
                contents: prompt,
            });

            if (aiResponse && aiResponse.text) {
                return aiResponse.text.trim();
            }
        } catch (err) {
            lastError = err;
            console.warn(`[Chat] Model ${model} unavailable: ${err.message}. Retrying fallback...`);
        }
    }

    throw lastError || new Error("Failed to generate response from AI models");
};

/**
 * Ensures a document has non-empty chunks. If not, auto-repairs by extracting text.
 */
const ensureDocumentChunks = async (documentId) => {
    let chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: "asc" },
    });

    const hasValidText = chunks.some((c) => c.content && c.content.trim().length > 10);
    if (chunks.length > 0 && hasValidText) {
        return chunks;
    }

    // Auto-heal empty chunks from disk
    const document = await prisma.document.findUnique({
        where: { id: documentId },
    });

    if (!document) return [];

    const resolved = resolveFilePath(document.filePath);
    if (!fs.existsSync(resolved)) return [];

    await prisma.documentChunk.deleteMany({ where: { documentId } });
    const text = await extractText(resolved, document.fileType);
    const newChunks = chunkText(text);

    for (let i = 0; i < newChunks.length; i++) {
        await prisma.documentChunk.create({
            data: {
                content: newChunks[i],
                chunkIndex: i,
                documentId: document.id,
            },
        });
    }

    return await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: "asc" },
    });
};

const chat = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question cannot be empty",
            });
        }

        // Verify and heal chunks if needed
        const allDocChunks = await ensureDocumentChunks(documentId);

        let relevantChunks = [];

        // 1. Attempt vector search via Qdrant
        try {
            const embedding = await generateEmbedding(question);
            const result = await qdrant.query("document_chunks", {
                query: embedding,
                limit: 5,
                withPayload: true,
                filter: {
                    must: [
                        {
                            key: "documentId",
                            match: {
                                value: documentId,
                            },
                        },
                    ],
                },
            });

            if (result && result.points && result.points.length > 0) {
                const pointIds = result.points.map((p) => p.id);
                const chunkMap = new Map(allDocChunks.map((c) => [c.id, c]));
                relevantChunks = pointIds
                    .map((id) => chunkMap.get(id))
                    .filter(Boolean);
            }
        } catch (qdrantErr) {
            console.warn("⚠️ Qdrant search skipped (using database chunks):", qdrantErr.message);
        }

        // 2. Fallback: If Qdrant is offline or returned no points
        if (relevantChunks.length === 0) {
            if (allDocChunks.length <= 15) {
                // Short document (e.g. marksheets, certificates, resumes): supply full context
                relevantChunks = allDocChunks;
            } else {
                // Larger document: score chunks by keyword matching + include first chunk (header)
                const keywords = question
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .split(/\s+/)
                    .filter((w) => w.length > 2);

                const scored = allDocChunks.map((chunk) => {
                    const text = chunk.content.toLowerCase();
                    let score = 0;
                    for (const kw of keywords) {
                        if (text.includes(kw)) score += 1;
                    }
                    if (chunk.chunkIndex === 0) score += 0.5; // slight boost for document header
                    return { chunk, score };
                });

                scored.sort((a, b) => b.score - a.score);
                relevantChunks = scored.slice(0, 8).map((s) => s.chunk);
                relevantChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
            }
        }

        const context = relevantChunks
            .map((chunk) => chunk.content)
            .join("\n\n");

        const prompt = `
You are an intelligent, accurate AI document assistant for KnowledgeOS.

Context from the document:
${context || "[No document text available]"}

User inquiry:
"${question}"

Instructions:
1. If the user's input is strictly a greeting (e.g. "hi", "hello", "good morning") or acknowledgment ("ok", "thanks"), respond with a friendly greeting and state you are ready to answer questions about this document.
2. For ANY information lookup—including short questions or shorthand phrases (e.g. "My name", "name", "roll no.", "marks", "percentage", "school", "mother name", "father name", "result", "grades", etc.)—treat it as a direct question seeking that specific detail from the document.
3. Answer directly, accurately, and concisely based on the provided Context.
4. If the field is referenced under related labels (e.g. "Candidate Name", "Student Name", "Roll No", "Seat No", etc.), extract and present the value immediately.
5. If the information is genuinely not present anywhere in the context, politely state that it is not available in the document.
`;

        const answer = await generateAnswerWithFallbacks(prompt);

        await prisma.chat.create({
            data: {
                question,
                answer,
                documentId,
            },
        });

        res.status(200).json({
            success: true,
            answer,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const history = async (req, res) => {
    try {
        const chats = await prisma.chat.findMany({
            where: {
                documentId: req.params.documentId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.status(200).json({
            success: true,
            data: chats,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    chat,
    history,
};

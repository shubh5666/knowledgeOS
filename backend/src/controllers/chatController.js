
const prisma = require("../config/database");
const qdrant = require("../config/qdrant");
const ai = require("../config/gemini");

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

const chat = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { question } = req.body;

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

        const chunkIds = result.points.map((point) => point.id);

        const chunks = await prisma.documentChunk.findMany({
            where: {
                id: {
                    in: chunkIds,
                },
            },
        });

        const context = chunks
            .map((chunk) => chunk.content)
            .join("\n\n");

        const prompt = `
You are a helpful AI document assistant. 

Context from the document:
${context}

User input:
${question}

Instructions:
1. If the user's input is a casual greeting (like "hi", "hello", "hey") or acknowledging statement (like "ok", "okay", "thanks"), respond with a friendly, helpful reply.
2. If the user is asking a question about the document, answer it accurately and ONLY using the provided Context. If the context does not contain the answer, politely state that the answer is not present in the document.
`;

        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        await prisma.chat.create({
            data: {
                question,
                answer: aiResponse.text,
                documentId,
            },
        });

        res.status(200).json({
            success: true,
            answer: aiResponse.text,
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
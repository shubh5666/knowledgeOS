require("dotenv").config();
const qdrant = require("./src/config/qdrant");
const ai = require("./src/config/gemini");

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

async function test() {
    try {
        const documentId = "c5afff60-f1bb-43bf-b592-486ce6278514";
        const embedding = await generateEmbedding("hi");

        console.log("Testing standard qdrant.search with embedding and filter...");
        const result = await qdrant.search("document_chunks", {
            vector: embedding,
            limit: 5,
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

        console.log("Success! Found points:", result.length);
        if (result.length > 0) {
            console.log("First point ID:", result[0].id);
        }
    } catch (err) {
        console.error("Qdrant Search Error:", err.message);
        if (err.stack) {
            console.error(err.stack);
        }
    }
}

test();

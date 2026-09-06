
const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
});

qdrant.createCollectionIfNeeded = async () => {
    try {
        const collections = await qdrant.getCollections();
        const exists = collections.collections.find(
            (c) => c.name === "document_chunks"
        );

        if (exists) {
            console.log("Qdrant collection verified");
            return;
        }

        await qdrant.createCollection("document_chunks", {
            vectors: {
                size: 768,
                distance: "Cosine",
            },
        });
        console.log("Qdrant collection created");
    } catch (err) {
        console.log("ℹ️ Qdrant is offline; application is operating in database-fallback mode.");
    }
};

module.exports = qdrant;
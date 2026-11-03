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
            return;
        }

        await qdrant.createCollection("document_chunks", {
            vectors: {
                size: 768,
                distance: "Cosine",
            },
        });
    } catch (err) {
        // Qdrant is optional; backend smoothly operates with PostgreSQL fallback
    }
};

module.exports = qdrant;

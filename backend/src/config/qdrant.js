
const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
     url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

qdrant.createCollectionIfNeeded = async () => {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.find(
        (c) => c.name === "document_chunks"
    );

    if (exists) {
        console.log("Collection already exists");
        return;
    }

    await qdrant.createCollection("document_chunks", {
        vectors: {
            size: 768,
            distance: "Cosine",
        },
    });
    console.log("Collection created");
};

module.exports = qdrant;
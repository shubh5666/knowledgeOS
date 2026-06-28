const qdrant = require("./src/config/qdrant");

async function test() {
    try {
        const documentId = "6f9ac4c3-e7c3-401e-8f2f-39ca23787467"; // existing doc id
        const dummyVector = new Array(768).fill(0.1);

        console.log("Querying Qdrant with dummyVector and existing documentId...");
        try {
            const result = await qdrant.query("document_chunks", {
                query: dummyVector,
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
            console.log("Success! Found points:", result.points.length);
        } catch (e) {
            console.error("Query Failed:", e.message);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();

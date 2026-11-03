const express = require("express");
const documentRouter = express.Router();
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
    upload: uploadDocument,
    processDocument,
    getAllDocuments,
    removeDocument,
} = require("../controllers/documentController");

// Upload document
documentRouter.post(
    "/workspaces/:workspaceId/documents",
    auth,
    upload.single("document"),
    uploadDocument
);

// Retrieve all documents in workspace
documentRouter.get(
    "/workspaces/:workspaceId/documents",
    auth,
    getAllDocuments
);

// Process / vectorize document
documentRouter.post(
    "/documents/:documentId/process",
    auth,
    processDocument
);

// Delete document
documentRouter.delete(
    "/documents/:documentId",
    auth,
    removeDocument
);

module.exports = documentRouter;

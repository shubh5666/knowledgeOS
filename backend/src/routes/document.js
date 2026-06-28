
const express = require("express");

const documentRouter = express.Router();

const auth = require("../middlewares/auth");

const upload = require("../middlewares/upload");

const {
    upload: uploadDocument,getAllDocuments,removeDocument,
} = require("../controllers/documentController");

documentRouter.post(

    "/workspaces/:workspaceId/documents",

    auth,

    upload.single("document"),

    uploadDocument

);

documentRouter.get(
    "/workspaces/:workspaceId/documents",
    auth,
    getAllDocuments
);
documentRouter.delete(
    "/documents/:documentId",
    auth,
    removeDocument
);

module.exports = documentRouter;
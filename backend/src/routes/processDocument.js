
const express = require("express");

const processRouter = express.Router();

const auth = require("../middlewares/auth");

const { processDocument } = require("../controllers/documentController");

processRouter.post(
    "/documents/:documentId/process",
    auth,
    processDocument
);

module.exports = processRouter;
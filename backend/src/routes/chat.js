const express = require("express");

const chatRouter = express.Router();

const auth = require("../middlewares/auth");

const {
    chat,
    history,
} = require("../controllers/chatController");

chatRouter.post(
    "/documents/:documentId/chat",
    auth,
    chat
);

chatRouter.get(
    "/documents/:documentId/chat",
    auth,
    history
);

module.exports = chatRouter;

const express = require("express");

const workspaceRouter = express.Router();

const auth = require("../middlewares/auth");

const {
    create,
    getAll,
    remove,
} = require("../controllers/workspaceController");

workspaceRouter.post(
    "/organizations/:organizationId/workspaces",
    auth,
    create
);

workspaceRouter.get(
    "/organizations/:organizationId/workspaces",
    auth,
    getAll
);

workspaceRouter.delete(
    "/workspaces/:workspaceId",
    auth,
    remove
);

module.exports = workspaceRouter;
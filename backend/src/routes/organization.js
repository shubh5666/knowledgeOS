
const express = require("express");

const organizationRouter = express.Router();

const auth = require("../middlewares/auth");

const {
    create,getAll,remove,
} = require("../controllers/organizationController");

organizationRouter.post(
    "/organizations",
    auth,
    create
);

organizationRouter.get(
    "/organizations",
    auth,
    getAll
);

organizationRouter.delete(
    "/organizations/:organizationId",
    auth,
    remove
);

module.exports = organizationRouter;
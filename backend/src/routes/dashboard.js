
const express = require("express");

const dashboardRouter = express.Router();

const auth = require("../middlewares/auth");

const { dashboard } = require("../controllers/dashboardController");

dashboardRouter.get(
    "/dashboard",
    auth,
    dashboard
);

module.exports = dashboardRouter;
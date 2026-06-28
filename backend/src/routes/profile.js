
const express = require("express");

const profileRouter = express.Router();

const auth = require("../middlewares/auth");

const { getProfile } = require("../controllers/profileController");

profileRouter.get("/auth/profile", auth, getProfile);

module.exports = profileRouter;
const express = require("express");
const authRouter = express.Router();
const auth = require("../middlewares/auth");
const { signup, login, getProfile } = require("../controllers/authController");

authRouter.post("/auth/signup", signup);
authRouter.post("/auth/login", login);
authRouter.get("/auth/profile", auth, getProfile);

module.exports = authRouter;

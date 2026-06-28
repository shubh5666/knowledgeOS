const express = require("express");

const authRouter = express.Router();

const { signup, login } = require("../controllers/authController");

authRouter.post("/auth/signup", signup);
authRouter.post("/auth/login", login);

module.exports = authRouter;

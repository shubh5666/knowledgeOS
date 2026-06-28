
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const auth = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new Error("Token is missing");
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

      console.log("Logged in User:", user);
        req.user = user;

        next();

    } catch (err) {

        res.status(401).json({
            success: false,
            message: err.message,
        });

    }

};

module.exports = auth;
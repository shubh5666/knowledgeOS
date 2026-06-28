
const prisma = require("../config/database");

const dashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const organizations = await prisma.organization.count({
            where: { ownerId: userId },
        });

        const workspaces = await prisma.workspace.count({
            where: {
                organization: {
                    ownerId: userId,
                },
            },
        });

        const documents = await prisma.document.count({
            where: {
                workspace: {
                    organization: {
                        ownerId: userId,
                    },
                },
            },
        });

        const chats = await prisma.chat.count({
            where: {
                document: {
                    workspace: {
                        organization: {
                            ownerId: userId,
                        },
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: {
                organizations,
                workspaces,
                documents,
                chats,
            },
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
    dashboard,
};
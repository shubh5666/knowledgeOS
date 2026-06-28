
const prisma = require("../config/database");
const { deleteDocumentInternal } = require("./documentController");

const create = async (req, res) => {
    try {
        const workspace = await prisma.workspace.create({
            data: {
                name: req.body.name,
                description: req.body.description,
                organizationId: req.params.organizationId,
            },
        });

        res.status(201).json({
            success: true,
            data: workspace,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const getAll = async (req, res) => {
    try {
        const workspaces = await prisma.workspace.findMany({
            where: { organizationId: req.params.organizationId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: workspaces,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteWorkspaceInternal = async (workspaceId) => {
    const docs = await prisma.document.findMany({
        where: { workspaceId }
    });
    
    for (const doc of docs) {
        await deleteDocumentInternal(doc.id);
    }
    
    return await prisma.workspace.delete({
        where: { id: workspaceId }
    });
};

const remove = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { organization: true }
        });

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        if (workspace.organization.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not own this organization"
            });
        }

        await deleteWorkspaceInternal(workspaceId);

        res.status(200).json({
            success: true,
            message: "Workspace deleted successfully"
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    create,
    getAll,
    remove,
    deleteWorkspaceInternal,
};
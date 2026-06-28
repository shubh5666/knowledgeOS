
const prisma = require("../config/database");
const { deleteWorkspaceInternal } = require("./workspaceController");

const create = async (req, res) => {
    try {
        const organization = await prisma.organization.create({
            data: {
                name: req.body.name,
                description: req.body.description,
                ownerId: req.user.id,
            },
        });

        res.status(201).json({
            success: true,
            data: organization,
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
        const organizations = await prisma.organization.findMany({
            where: { ownerId: req.user.id },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: organizations,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteOrganizationInternal = async (orgId) => {
    const workspaces = await prisma.workspace.findMany({
        where: { organizationId: orgId }
    });
    
    for (const ws of workspaces) {
        await deleteWorkspaceInternal(ws.id);
    }
    
    return await prisma.organization.delete({
        where: { id: orgId }
    });
};

const remove = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!org) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        if (org.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not own this organization"
            });
        }

        await deleteOrganizationInternal(organizationId);

        res.status(200).json({
            success: true,
            message: "Organization deleted successfully"
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
};
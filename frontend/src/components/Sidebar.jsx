import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Folder,
  FileText,
  Plus,
  LogOut,
  LayoutDashboard,
  Upload,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";
import CreateOrgModal from "./modals/CreateOrgModal";
import CreateWorkspaceModal from "./modals/CreateWorkspaceModal";

export default function Sidebar({
  token,
  user,
  onLogout,
  organizations = [],
  activeOrg,
  setActiveOrg,
  workspaces = [],
  activeWorkspace,
  setActiveWorkspace,
  documents = [],
  activeDocument,
  setActiveDocument,
  onRefreshOrganizations,
  onRefreshWorkspaces,
  onRefreshDocuments,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Dialog / Modal display toggle states
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  // Form input field states for new Orgs and Workspaces
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");

  // Loading and Error boundary states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Create a new Organization
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.organizations.create(newOrgName, token);
      setNewOrgName("");
      setNewOrgDesc("");
      setShowOrgModal(false);
      await onRefreshOrganizations(); // Reload organizations list in App
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new Workspace under the active organization
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!activeOrg) return;
    setError("");
    setLoading(true);

    try {
      const data = await api.workspaces.create(activeOrg.id, newWorkspaceName, newWorkspaceDesc, token);
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setShowWorkspaceModal(false);
      await onRefreshWorkspaces(activeOrg.id); // Reload workspaces list in App
      
      // Automatically navigate to the newly created workspace
      if (data.data?.id) {
        navigate(`/workspace/${data.data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload a PDF document file to the active workspace
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeWorkspace) return;

    setError("");
    setUploading(true);

    try {
      const data = await api.documents.upload(activeWorkspace.id, file, token);
      await onRefreshDocuments(activeWorkspace.id); // Refresh documents in App
      
      // Auto-navigate to the newly uploaded document's chat route
      if (data.data?.id) {
        navigate(`/workspace/${activeWorkspace.id}/document/${data.data.id}`);
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset the file input element
    }
  };

  // Delete the active Organization
  const handleDeleteOrganization = async () => {
    if (!activeOrg) return;
    if (!window.confirm(`Are you sure you want to delete organization "${activeOrg.name}"?\nThis will permanently delete all its workspaces, documents, chunks, vectors, and chat history.`)) {
      return;
    }

    try {
      await api.organizations.delete(activeOrg.id, token);
      alert("Organization deleted successfully.");
      setActiveOrg(null);
      setActiveWorkspace(null);
      setActiveDocument(null);
      await onRefreshOrganizations(); // Reload org list
      navigate("/dashboard");
    } catch (err) {
      alert("Deletion failed: " + err.message);
    }
  };

  // Delete a Workspace
  const handleDeleteWorkspace = async (workspaceId) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    const wsName = ws ? ws.name : "this workspace";
    
    if (!window.confirm(`Are you sure you want to delete workspace "${wsName}"?\nThis will permanently delete all its documents, chunks, vectors, and chat history.`)) {
      return;
    }

    try {
      await api.workspaces.delete(workspaceId, token);
      alert("Workspace deleted successfully.");
      
      // If we deleted the active workspace, navigate back to the dashboard
      if (activeWorkspace?.id === workspaceId) {
        setActiveWorkspace(null);
        setActiveDocument(null);
        navigate("/dashboard");
      }
      
      await onRefreshWorkspaces(activeOrg.id); // Reload workspaces list
    } catch (err) {
      alert("Deletion failed: " + err.message);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Building2 size={22} className="sidebar-section-btn" style={{ color: "var(--accent-light)" }} />
        <span>KnowledgeOS</span>
      </div>

      <div className="sidebar-scrollable">
        {/* Navigation Option for Dashboard */}
        <div>
          <button
            className={`sidebar-nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveDocument(null);
              navigate("/dashboard");
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </button>
        </div>

        {/* Organization Selector */}
        <div className="org-selector-container">
          <div className="sidebar-section-title">
            <span>Organization</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {activeOrg && (
                <button
                  className="sidebar-section-btn delete-icon-btn"
                  title="Delete Active Organization"
                  onClick={handleDeleteOrganization}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                className="sidebar-section-btn"
                title="Create Organization"
                onClick={() => {
                  setError("");
                  setShowOrgModal(true);
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <select
            className="org-select"
            value={activeOrg ? activeOrg.id : ""}
            onChange={(e) => {
              const selected = organizations.find((o) => o.id === e.target.value);
              setActiveOrg(selected || null);
              setActiveWorkspace(null);
              setActiveDocument(null);
              navigate("/dashboard"); // Redirect to dashboard when changing orgs
            }}
          >
            <option value="" disabled>
              -- Select Organization --
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Workspaces Section (Renders only if active organization is selected) */}
        {activeOrg && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Workspaces</span>
              <button
                className="sidebar-section-btn"
                title="Create Workspace"
                onClick={() => {
                  setError("");
                  setShowWorkspaceModal(true);
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            {workspaces.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "0 12px" }}>
                No workspaces created
              </p>
            ) : (
              workspaces.map((ws) => {
                // Determine if this workspace is active based on activeWorkspace or url ID
                const isActive = activeWorkspace?.id === ws.id;
                return (
                  <div
                    key={ws.id}
                    className={`sidebar-workspace-row ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setActiveDocument(null);
                      navigate(`/workspace/${ws.id}`);
                    }}
                  >
                    <Folder size={18} />
                    <span className="workspace-name">{ws.name}</span>
                    <button
                      className="workspace-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering workspace selection click
                        handleDeleteWorkspace(ws.id);
                      }}
                      title="Delete Workspace"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Documents Section (Renders only if active workspace is selected) */}
        {activeWorkspace && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Knowledge Base</span>
              {/* Document File Uploader button */}
              <div className="upload-btn-wrapper">
                <button className="sidebar-section-btn" title="Upload Document" disabled={uploading}>
                  {uploading ? (
                    <span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", margin: 0 }}></span>
                  ) : (
                    <Upload size={16} />
                  )}
                </button>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            {documents.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "0 12px" }}>
                No documents uploaded
              </p>
            ) : (
              documents.map((doc) => {
                const isActive = location.pathname === `/workspace/${activeWorkspace.id}/document/${doc.id}`;
                return (
                  <button
                    key={doc.id}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveDocument(doc);
                      navigate(`/workspace/${activeWorkspace.id}/document/${doc.id}`);
                    }}
                  >
                    <FileText size={18} />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {doc.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Profile & Logout Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{user?.name || "User Name"}</span>
          <span className="user-email">{user?.email || "user@email.com"}</span>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Log Out">
          <LogOut size={18} />
        </button>
      </div>

      {/* Create Organization Modal */}
      <CreateOrgModal
        showOrgModal={showOrgModal}
        setShowOrgModal={setShowOrgModal}
        newOrgName={newOrgName}
        setNewOrgName={setNewOrgName}
        newOrgDesc={newOrgDesc}
        setNewOrgDesc={setNewOrgDesc}
        handleCreateOrganization={handleCreateOrganization}
        error={error}
        loading={loading}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        showWorkspaceModal={showWorkspaceModal}
        setShowWorkspaceModal={setShowWorkspaceModal}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        newWorkspaceDesc={newWorkspaceDesc}
        setNewWorkspaceDesc={setNewWorkspaceDesc}
        handleCreateWorkspace={handleCreateWorkspace}
        error={error}
        loading={loading}
      />
    </aside>
  );
}

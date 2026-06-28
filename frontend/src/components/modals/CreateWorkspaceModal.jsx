import React from "react";

export default function CreateWorkspaceModal({
  showWorkspaceModal,
  setShowWorkspaceModal,
  newWorkspaceName,
  setNewWorkspaceName,
  newWorkspaceDesc,
  setNewWorkspaceDesc,
  handleCreateWorkspace,
  error,
  loading,
}) {
  if (!showWorkspaceModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Create Workspace</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleCreateWorkspace}>
          <div className="form-group">
            <label className="form-label">Workspace Name</label>
            <input
              type="text"
              className="form-input"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. Sales Department"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              placeholder="e.g. Q&A and documentation repository"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowWorkspaceModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

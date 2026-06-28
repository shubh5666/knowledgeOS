import React from "react";

export default function CreateOrgModal({
  showOrgModal,
  setShowOrgModal,
  newOrgName,
  setNewOrgName,
  newOrgDesc,
  setNewOrgDesc,
  handleCreateOrganization,
  error,
  loading,
}) {
  if (!showOrgModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Create Organization</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleCreateOrganization}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={newOrgDesc}
              onChange={(e) => setNewOrgDesc(e.target.value)}
              placeholder="e.g. Primary workspace org"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowOrgModal(false)}
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

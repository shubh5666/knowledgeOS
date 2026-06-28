import React from "react";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";

export default function ChatSidebar({
  activeDocument,
  documentId,
  workspaceId,
  handleDeleteDocument,
  setActiveDocument,
  navigate,
}) {
  if (!activeDocument) return null;

  return (
    <div className="chat-doc-info">
      <div className="doc-details-header">
        <button
          className="doc-action-btn"
          onClick={() => {
            setActiveDocument(null);
            navigate(`/workspace/${workspaceId}`);
          }}
          style={{ marginBottom: "15px" }}
        >
          <ArrowLeft size={16} />
          <span>Workspace files</span>
        </button>

        <div className="doc-details-icon">
          <FileText size={24} />
        </div>
        <h3 className="doc-details-title" title={activeDocument.title}>
          {activeDocument.title}
        </h3>

        <div className="doc-details-meta">
          <div className="doc-meta-item">
            <span>Status</span>
            <span className="doc-status-badge processed">{activeDocument.status}</span>
          </div>
          <div className="doc-meta-item">
            <span>Filename</span>
            <span className="doc-meta-value" title={activeDocument.fileName}>
              {activeDocument.fileName}
            </span>
          </div>
          <div className="doc-meta-item">
            <span>Uploaded At</span>
            <span className="doc-meta-value">
              {new Date(activeDocument.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <button
        className="btn btn-danger btn-block"
        onClick={(e) => {
          handleDeleteDocument(documentId, e);
        }}
      >
        <Trash2 size={16} />
        <span>Delete File</span>
      </button>
    </div>
  );
}

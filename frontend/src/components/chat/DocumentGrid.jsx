import React from "react";
import { FileText, Trash2, RefreshCw, Database, ArrowRight } from "lucide-react";

export default function DocumentGrid({
  documents = [],
  processingId = null,
  handleDeleteDocument,
  handleProcessDocument,
  setActiveDocument,
  workspaceId,
  navigate,
}) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={48} className="empty-state-icon" />
        <h3 className="empty-state-title">No documents in this workspace</h3>
        <p className="empty-state-desc">
          Upload PDF documents using the upload button in the sidebar to build your workspace knowledge base.
        </p>
      </div>
    );
  }

  return (
    <div className="docs-grid">
      {documents.map((doc) => {
        const isDocProcessing = processingId === doc.id;
        return (
          <div key={doc.id} className="doc-card">
            <div className="doc-card-top">
              <div className="doc-icon-wrapper">
                <FileText size={20} />
              </div>
              <button
                className="doc-delete-btn"
                title="Delete document"
                onClick={(e) => handleDeleteDocument(doc.id, e)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div>
              <h4 className="doc-title" title={doc.title}>
                {doc.title}
              </h4>
              <div style={{ marginTop: "10px" }}>
                <span
                  className={`doc-status-badge ${
                    isDocProcessing
                      ? "processing"
                      : doc.status.toLowerCase()
                  }`}
                >
                  {isDocProcessing ? "PROCESSING..." : doc.status}
                </span>
              </div>
            </div>

            <div className="doc-card-actions">
              {doc.status === "UPLOADED" ? (
                <button
                  className="doc-action-btn"
                  onClick={() => handleProcessDocument(doc.id)}
                  disabled={isDocProcessing}
                >
                  {isDocProcessing ? (
                    <>
                      <RefreshCw size={14} className="spinner" style={{ margin: 0, width: 14, height: 14 }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      <span>Process Document</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="doc-action-btn"
                  onClick={() => {
                    setActiveDocument(doc);
                    navigate(`/workspace/${workspaceId}/document/${doc.id}`);
                  }}
                  style={{ color: "var(--accent-light)" }}
                >
                  <span>Start Chatting</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React from "react";
import { Database, RefreshCw } from "lucide-react";

export default function IngestionRequired({ documentId, handleProcessDocument }) {
  return (
    <div className="processing-screen">
      <Database size={48} className="empty-state-icon" style={{ marginBottom: "20px" }} />
      <h2 className="spinner-text-title">Ingestion Required</h2>
      <p className="spinner-text-desc" style={{ marginBottom: "24px" }}>
        This PDF has been uploaded but not vectorized. We need to index its content in Qdrant so Gemini can search it.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => handleProcessDocument(documentId)}
      >
        <RefreshCw size={16} />
        <span>Process and Ingest Content</span>
      </button>
    </div>
  );
}

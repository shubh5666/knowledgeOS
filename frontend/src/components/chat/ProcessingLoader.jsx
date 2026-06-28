import React from "react";

export default function ProcessingLoader() {
  return (
    <div className="processing-screen">
      <div className="spinner"></div>
      <h2 className="spinner-text-title">Processing Knowledge Base</h2>
      <p className="spinner-text-desc">
        Extracting text, creating semantic text chunks, and saving vector embeddings to Qdrant...
      </p>
    </div>
  );
}

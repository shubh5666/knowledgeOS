import React from "react";
import { Building2, Folder, FileText, MessageSquare } from "lucide-react";

export default function QuickAccessTabs({
  activeTab,
  organizations = [],
  activeOrg,
  setActiveOrg,
  workspaces = [],
  activeWorkspace,
  setActiveWorkspace,
  allWorkspaces = [],
  documents = [],
  setActiveDocument,
  navigate,
}) {
  if (!activeTab) return null;

  return (
    <div className="section-card" style={{ marginBottom: "24px", animation: "fadeIn 0.2s ease-out" }}>
      <h2 className="section-title">
        {activeTab === "organizations" && <><Building2 size={20} style={{ color: "var(--accent-light)" }} /> Quick Access: Organizations</>}
        {activeTab === "workspaces" && <><Folder size={20} style={{ color: "var(--accent-light)" }} /> Quick Access: Workspaces</>}
        {activeTab === "documents" && <><FileText size={20} style={{ color: "var(--accent-light)" }} /> Quick Access: Documents</>}
        {activeTab === "chats" && <><MessageSquare size={20} style={{ color: "var(--accent-light)" }} /> Quick Access: Recent Interactions</>}
      </h2>

      {/* Organizations Tab */}
      {activeTab === "organizations" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {organizations.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No organizations created yet. Click "+" in the sidebar to add one.</p>
          ) : (
            organizations.map(org => {
              const isActive = activeOrg?.id === org.id;
              return (
                <div
                  key={org.id}
                  onClick={() => {
                    setActiveOrg(org);
                    setActiveWorkspace(null);
                    setActiveDocument(null);
                  }}
                  style={{
                    padding: "16px",
                    background: isActive ? "var(--accent-glow)" : "var(--bg-primary)",
                    border: isActive ? "1px solid var(--accent-light)" : "1px solid var(--border-color)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  className="metric-quick-item"
                >
                  <h4 style={{ fontSize: "14px", fontWeight: "600", color: isActive ? "var(--accent-color)" : "var(--text-primary)", marginBottom: "4px" }}>{org.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{org.description || "No description"}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Workspaces Tab */}
      {activeTab === "workspaces" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {allWorkspaces.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No workspaces created yet. Select an organization and click "+" in the sidebar.</p>
          ) : (
            allWorkspaces.map(ws => {
              const parentOrg = organizations.find(o => o.id === ws.organizationId);
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    navigate(`/workspace/${ws.id}`);
                  }}
                  style={{
                    padding: "16px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  className="metric-quick-item"
                >
                  <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>{ws.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>{ws.description || "No description"}</p>
                  {parentOrg && (
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--border-color)", borderRadius: "4px", color: "var(--text-secondary)" }}>
                      Org: {parentOrg.name}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div>
          {activeOrg ? (
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Showing files inside the active organization: <strong>{activeOrg.name}</strong>.
              </p>
              
              {workspaces.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No workspaces under this organization.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {workspaces.map(ws => {
                    const isActiveWs = activeWorkspace?.id === ws.id;
                    return (
                      <div key={ws.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", background: isActiveWs ? "rgba(248, 250, 252, 0.5)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Folder size={16} style={{ color: "var(--text-muted)" }} />
                            {ws.name}
                          </h4>
                          {!isActiveWs && (
                            <button
                              onClick={() => {
                                setActiveWorkspace(ws);
                                navigate(`/workspace/${ws.id}`);
                              }}
                              style={{
                                fontSize: "11px",
                                padding: "3px 8px",
                                background: "none",
                                border: "1px solid var(--border-color)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              Select Workspace
                            </button>
                          )}
                        </div>

                        {isActiveWs ? (
                          documents.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", fontSize: "12px", paddingLeft: "22px" }}>No documents in this active workspace.</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px", paddingLeft: "22px" }}>
                              {documents.map(doc => (
                                <div
                                  key={doc.id}
                                  onClick={() => {
                                    setActiveDocument(doc);
                                    navigate(`/workspace/${ws.id}/document/${doc.id}`);
                                  }}
                                  style={{
                                    padding: "12px",
                                    background: "var(--bg-primary)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                  className="metric-quick-item"
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <FileText size={14} style={{ color: "var(--accent-light)" }} />
                                    <span style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={doc.title}>
                                      {doc.title}
                                    </span>
                                  </div>
                                  <span className={`doc-status-badge ${doc.status.toLowerCase()}`} style={{ fontSize: "8px" }}>
                                    {doc.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <p style={{ color: "var(--text-muted)", fontSize: "12px", paddingLeft: "22px" }}>Select this workspace above to view its loaded files.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Please select an organization in the sidebar first to view documents.</p>
          )}
        </div>
      )}

      {/* Chats Tab */}
      {activeTab === "chats" && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
            AI Interactions are stored within each specific document session.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            To chat, select a workspace, open a processed document, and use the interactive live chat panel to ask questions.
          </p>
        </div>
      )}
    </div>
  );
}

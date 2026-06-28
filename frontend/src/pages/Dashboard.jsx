import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Folder, FileText, MessageSquare, Compass } from "lucide-react";
import { api } from "../services/api";
import MetricCard from "../components/dashboard/MetricCard";
import QuickAccessTabs from "../components/dashboard/QuickAccessTabs";

export default function Dashboard({
  token,
  organizations = [],
  activeOrg,
  setActiveOrg,
  workspaces = [],
  activeWorkspace,
  setActiveWorkspace,
  allWorkspaces = [],
  documents = [],
  setActiveDocument,
}) {
  // Stats store the counts of orgs, workspaces, files, and interactions
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // activeTab decides which metric's quick access panel is shown below the cards
  const [activeTab, setActiveTab] = useState(null);

  const navigate = useNavigate();

  // Fetch the dashboard statistics from the backend server
  const fetchDashboardStats = async () => {
    try {
      const data = await api.dashboard.getStats(token);
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload statistics whenever the user changes or uploads documents/orgs/workspaces
  useEffect(() => {
    fetchDashboardStats();
  }, [token, organizations.length, allWorkspaces.length, documents.length]);

  // Show a loading spinner screen while fetching telemetry metrics
  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Toggle quick access tabs below (clicking the same tab closes it)
  const handleTabToggle = (tabName) => {
    setActiveTab(prev => prev === tabName ? null : tabName);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">System Console</h1>
      <p className="dashboard-subtitle">
        Real-time telemetry and overview of your enterprise knowledge base. Click any metric to explore!
      </p>

      {error && <div className="error-message">{error}</div>}

      {/* Row of Metrics Telemetry Cards */}
      <div className="metrics-grid">
        <MetricCard
          icon={Building2}
          value={stats?.organizations ?? 0}
          label="Organizations"
          isActive={activeTab === "organizations"}
          colorClass="blue"
          onClick={() => handleTabToggle("organizations")}
        />

        <MetricCard
          icon={Folder}
          value={stats?.workspaces ?? 0}
          label="Workspaces"
          isActive={activeTab === "workspaces"}
          colorClass="indigo"
          onClick={() => handleTabToggle("workspaces")}
        />

        <MetricCard
          icon={FileText}
          value={stats?.documents ?? 0}
          label="Ingested Files"
          isActive={activeTab === "documents"}
          colorClass="emerald"
          onClick={() => handleTabToggle("documents")}
        />

        <MetricCard
          icon={MessageSquare}
          value={stats?.chats ?? 0}
          label="AI Interactions"
          isActive={activeTab === "chats"}
          colorClass="pink"
          onClick={() => handleTabToggle("chats")}
        />
      </div>

      {/* Quick Access Directory Section (Renders only if a card is active) */}
      <QuickAccessTabs
        activeTab={activeTab}
        organizations={organizations}
        activeOrg={activeOrg}
        setActiveOrg={setActiveOrg}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        allWorkspaces={allWorkspaces}
        documents={documents}
        setActiveDocument={setActiveDocument}
        navigate={navigate}
      />

      {/* Getting Started Guide */}
      <div className="dashboard-sections">
        <div className="section-card">
          <h2 className="section-title">
            <Compass size={20} style={{ color: "var(--accent-light)" }} />
            Getting Started Guide
          </h2>
          <div className="intro-list">
            <div className="intro-item">
              <div className="intro-number">1</div>
              <div>
                <h4 className="intro-text-title">Create an Organization</h4>
                <p className="intro-text-desc">
                  Start by clicking the "+" button in the Organization section. An organization is the highest-level container (e.g. Acme Corp).
                </p>
              </div>
            </div>

            <div className="intro-item">
              <div className="intro-number">2</div>
              <div>
                <h4 className="intro-text-title">Create a Workspace</h4>
                <p className="intro-text-desc">
                  Select your organization and click "+" under Workspaces to create a workspace (e.g. Engineering, HR). Workspaces partition your knowledge repositories.
                </p>
              </div>
            </div>

            <div className="intro-item">
              <div className="intro-number">3</div>
              <div>
                <h4 className="intro-text-title">Upload and Ingest PDFs</h4>
                <p className="intro-text-desc">
                  Go into a workspace, click the upload button in the Sidebar to upload a PDF. Once uploaded, select it and click "Process Document" to split text and create vector embeddings in Qdrant.
                </p>
              </div>
            </div>

            <div className="intro-item">
              <div className="intro-number">4</div>
              <div>
                <h4 className="intro-text-title">Chat with your AI Assistant</h4>
                <p className="intro-text-desc">
                  Type questions in the chat feed. The system pulls vector chunks of the document and uses Gemini to answer them contextually, maintaining chat logs for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

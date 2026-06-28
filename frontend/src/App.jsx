import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ChatArea from "./pages/ChatArea";

import { api } from "./services/api";

export default function App() {
  // Global Auth states
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);

  // Nav and Data states
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  
  const [workspaces, setWorkspaces] = useState([]); // Filtered for activeOrg
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [allWorkspaces, setAllWorkspaces] = useState([]); // Flat list of all workspaces for syncing
  
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Extract parameters from pathname manually
  const pathParts = location.pathname.split("/");
  const urlWorkspaceId = pathParts[1] === "workspace" ? pathParts[2] : null;
  const urlDocumentId = pathParts[3] === "document" ? pathParts[4] : null;

  // Fetch User Profile
  const fetchUserProfile = async (authToken) => {
    setLoadingProfile(true);
    try {
      const data = await api.auth.getProfile(authToken);
      setUser(data.data);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      handleLogout();
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch Organizations
  const fetchOrganizations = async (authToken) => {
    try {
      const data = await api.organizations.list(authToken);
      setOrganizations(data.data);
      return data.data;
    } catch (err) {
      console.error("Failed to load organizations:", err);
      return [];
    }
  };

  // Fetch workspaces for all organizations (to allow deep link sync)
  const fetchAllWorkspacesList = async (orgList, authToken) => {
    try {
      const all = [];
      for (const org of orgList) {
        const data = await api.workspaces.list(org.id, authToken);
        all.push(...data.data);
      }
      setAllWorkspaces(all);
      return all;
    } catch (err) {
      console.error("Failed to fetch flat workspaces list:", err);
      return [];
    }
  };

  // Fetch Documents for selected Workspace
  const fetchDocuments = async (workspaceId, targetDocId) => {
    if (!workspaceId) return;
    try {
      const data = await api.documents.list(workspaceId, token);
      setDocuments(data.data);
      if (targetDocId) {
        const doc = data.data.find((d) => d.id === targetDocId);
        setActiveDocument(doc || null);
      } else {
        setActiveDocument(null);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  // Load user data on startup
  const initAppData = async (authToken) => {
    fetchUserProfile(authToken);
    const orgs = await fetchOrganizations(authToken);
    if (orgs.length > 0) {
      await fetchAllWorkspacesList(orgs, authToken);
    }
  };

  useEffect(() => {
    if (token) {
      initAppData(token);
    }
  }, [token]);

  // Synchronize state with URL pathname
  useEffect(() => {
    if (!token || organizations.length === 0 || allWorkspaces.length === 0) return;

    if (urlWorkspaceId) {
      const currentWs = allWorkspaces.find((w) => w.id === urlWorkspaceId);
      if (currentWs) {
        setActiveWorkspace(currentWs);

        // Find and set its parent organization as active
        const parentOrg = organizations.find((o) => o.id === currentWs.organizationId);
        if (parentOrg) {
          setActiveOrg(parentOrg);
          // Load siblings in sidebar workspaces list
          setWorkspaces(allWorkspaces.filter((w) => w.organizationId === parentOrg.id));
        }

        // Fetch documents and select the active document if specified in URL
        fetchDocuments(currentWs.id, urlDocumentId);
      } else {
        // Workspace not found (invalid URL), redirect to dashboard
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Clear workspace and document active focus (e.g. on /dashboard or /login)
      setActiveWorkspace(null);
      setActiveDocument(null);

      // Default activeOrg to first organization if nothing is active
      if (organizations.length > 0 && !activeOrg) {
        setActiveOrg(organizations[0]);
        setWorkspaces(allWorkspaces.filter((w) => w.organizationId === organizations[0].id));
      }
    }
  }, [location.pathname, organizations, allWorkspaces, token]);

  // Sync sidebar workspaces when active organization changes
  useEffect(() => {
    if (activeOrg) {
      setWorkspaces(allWorkspaces.filter((w) => w.organizationId === activeOrg.id));
    } else {
      setWorkspaces([]);
    }
  }, [activeOrg, allWorkspaces]);

  const handleAuthSuccess = (newToken, authUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(authUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setOrganizations([]);
    setActiveOrg(null);
    setWorkspaces([]);
    setAllWorkspaces([]);
    setDocuments([]);
    setActiveDocument(null);
    navigate("/login");
  };

  const handleRefreshOrganizations = async () => {
    const orgs = await fetchOrganizations(token);
    if (orgs.length > 0) {
      await fetchAllWorkspacesList(orgs, token);
    }
  };

  const handleRefreshWorkspaces = async (orgId) => {
    const orgs = await fetchOrganizations(token);
    const allWs = await fetchAllWorkspacesList(orgs, token);
    if (activeOrg) {
      setWorkspaces(allWs.filter((w) => w.organizationId === activeOrg.id));
    }
  };

  const handleRefreshDocuments = async (workspaceId) => {
    await fetchDocuments(workspaceId, urlDocumentId);
  };

  // If loading profile, show a simple spinner screen
  if (token && loadingProfile) {
    return (
      <div className="auth-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Authentication guard redirection logic
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar remains mounted across route changes to preserve layout state */}
      <Sidebar
        token={token}
        user={user}
        onLogout={handleLogout}
        organizations={organizations}
        activeOrg={activeOrg}
        setActiveOrg={setActiveOrg}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        documents={documents}
        activeDocument={activeDocument}
        setActiveDocument={setActiveDocument}
        onRefreshOrganizations={handleRefreshOrganizations}
        onRefreshWorkspaces={handleRefreshWorkspaces}
        onRefreshDocuments={handleRefreshDocuments}
      />

      {/* Main Content Router */}
      <main className="main-content">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <Dashboard
                token={token}
                organizations={organizations}
                activeOrg={activeOrg}
                setActiveOrg={setActiveOrg}
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                setActiveWorkspace={setActiveWorkspace}
                allWorkspaces={allWorkspaces}
                documents={documents}
                setActiveDocument={setActiveDocument}
              />
            }
          />
          <Route
            path="/workspace/:workspaceId"
            element={
              <ChatArea
                token={token}
                activeWorkspace={activeWorkspace}
                activeDocument={activeDocument}
                setActiveDocument={setActiveDocument}
                documents={documents}
                onRefreshDocuments={handleRefreshDocuments}
              />
            }
          />
          <Route
            path="/workspace/:workspaceId/document/:documentId"
            element={
              <ChatArea
                token={token}
                activeWorkspace={activeWorkspace}
                activeDocument={activeDocument}
                setActiveDocument={setActiveDocument}
                documents={documents}
                onRefreshDocuments={handleRefreshDocuments}
              />
            }
          />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

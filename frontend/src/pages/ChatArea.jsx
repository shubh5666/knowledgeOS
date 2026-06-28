import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import DocumentGrid from "../components/chat/DocumentGrid";
import IngestionRequired from "../components/chat/IngestionRequired";
import ProcessingLoader from "../components/chat/ProcessingLoader";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatFeed from "../components/chat/ChatFeed";

export default function ChatArea({
  token,
  activeWorkspace,
  activeDocument,
  setActiveDocument,
  documents,
  onRefreshDocuments,
}) {
  const { workspaceId, documentId } = useParams();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [question, setQuestion] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Fetch Chat History
  const fetchChatHistory = async (docId) => {
    if (!docId) return;
    setLoadingHistory(true);
    try {
      const data = await api.chat.getHistory(docId, token);
      setChats(data.data);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchChatHistory(documentId);
    } else {
      setChats([]);
    }
  }, [documentId, token]);

  // Process Document
  const handleProcessDocument = async (docId) => {
    setProcessingId(docId);
    try {
      await api.documents.process(docId, token);
      alert("Document processed successfully! You can now start chatting with it.");
      await onRefreshDocuments(workspaceId);
      navigate(`/workspace/${workspaceId}/document/${docId}`);
    } catch (err) {
      alert("Processing failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.documents.delete(docId, token);
      if (documentId === docId) {
        setActiveDocument(null);
        navigate(`/workspace/${workspaceId}`);
      }
      await onRefreshDocuments(workspaceId);
    } catch (err) {
      alert("Deletion failed: " + err.message);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim() || !documentId) return;

    const currentQuestion = question;
    setQuestion("");
    setSendingMsg(true);

    const tempUserChat = {
      id: Math.random().toString(),
      question: currentQuestion,
      answer: "",
      createdAt: new Date().toISOString(),
    };

    setChats((prev) => [...prev, tempUserChat]);

    try {
      const data = await api.chat.sendMessage(documentId, currentQuestion, token);
      setChats((prev) =>
        prev.map((c) =>
          c.id === tempUserChat.id ? { ...c, answer: data.answer } : c
        )
      );
    } catch (err) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === tempUserChat.id
            ? { ...c, answer: "Error: " + err.message }
            : c
        )
      );
    } finally {
      setSendingMsg(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="dashboard-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // SCREEN A: Workspace Document Manager (no active documentId in path)
  if (!documentId) {
    return (
      <div className="document-panel">
        <div className="panel-header">
          <div className="panel-title-wrapper">
            <h1 className="panel-title">{activeWorkspace.name}</h1>
            <p className="panel-subtitle">{activeWorkspace.description || "Workspace Files"}</p>
          </div>
        </div>

        <div className="panel-body">
          <DocumentGrid
            documents={documents}
            processingId={processingId}
            handleDeleteDocument={handleDeleteDocument}
            handleProcessDocument={handleProcessDocument}
            setActiveDocument={setActiveDocument}
            workspaceId={workspaceId}
            navigate={navigate}
          />
        </div>
      </div>
    );
  }

  // SCREEN B: Ingestion loader/action trigger screen (if document status is UPLOADED)
  if (activeDocument && activeDocument.status === "UPLOADED" && processingId !== documentId) {
    return (
      <IngestionRequired
        documentId={documentId}
        handleProcessDocument={handleProcessDocument}
      />
    );
  }

  // Render processing loader screen if it is active document vectorizing
  if (processingId === documentId || !activeDocument) {
    return <ProcessingLoader />;
  }

  return (
    <div className="chat-container">
      <ChatSidebar
        activeDocument={activeDocument}
        documentId={documentId}
        workspaceId={workspaceId}
        handleDeleteDocument={handleDeleteDocument}
        setActiveDocument={setActiveDocument}
        navigate={navigate}
      />

      <ChatFeed
        chats={chats}
        loadingHistory={loadingHistory}
        sendingMsg={sendingMsg}
        question={question}
        setQuestion={setQuestion}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}

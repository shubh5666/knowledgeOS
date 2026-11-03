require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const organizationRouter = require("./routes/organization");
const workspaceRouter = require("./routes/workspace");
const documentRouter = require("./routes/document");
const chatRouter = require("./routes/chat");
const dashboardRouter = require("./routes/dashboard");
const qdrant = require("./config/qdrant");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://knowledge-os-two.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// API Endpoints
app.use("/", authRouter);
app.use("/", organizationRouter);
app.use("/", workspaceRouter);
app.use("/", documentRouter);
app.use("/", chatRouter);
app.use("/", dashboardRouter);

// Initialize Qdrant collection when vector database is running
qdrant.createCollectionIfNeeded().catch(() => {});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`KnowledgeOS server running on port ${PORT}`);
});

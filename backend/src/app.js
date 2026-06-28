require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const organizationRouter = require("./routes/organization");
const workspaceRouter = require("./routes/workspace");
const documentRouter = require("./routes/document");
const qdrant = require("./config/qdrant");
const processRouter = require("./routes/processDocument");
const chatRouter = require("./routes/chat");
const dashboardRouter = require("./routes/dashboard");

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

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", organizationRouter);
app.use("/", workspaceRouter);
app.use("/", documentRouter);
app.use("/", processRouter);
app.use("/", chatRouter);
app.use("/", dashboardRouter);

qdrant.createCollectionIfNeeded().catch((err) => {
  console.warn(
    "⚠️ Warning: Failed to connect to Qdrant. Make sure your Qdrant service is running."
  );
  console.warn("Qdrant error details:", err.message);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
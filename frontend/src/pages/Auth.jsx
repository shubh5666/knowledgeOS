import React, { useState } from "react";
import { api } from "../services/api";
import InputField from "../components/common/InputField";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        // Log in the user
        const data = await api.auth.login(email, password);
        onAuthSuccess(data.data.token, data.data.user);
      } else {
        // Sign up and then auto-login
        await api.auth.signup(name, email, password);
        const loginData = await api.auth.login(email, password);
        onAuthSuccess(loginData.data.token, loginData.data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">KnowledgeOS</h1>
          <p className="auth-subtitle">
            {isLogin
              ? "Login to access your enterprise portal"
              : "Register your enterprise account"}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="success-message">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <InputField
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <InputField
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "New to the platform?" : "Already have an account?"}
          <button
            type="button"
            className="auth-toggle-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMsg("");
            }}
          >
            {isLogin ? "Create an account" : "Login here"}
          </button>
        </div>
      </div>
    </div>
  );
}

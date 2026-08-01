import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../utils/api";

export default function AuthPage({ register = false }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (register && password !== confirmPassword) {
      setError("Passwords do not match. Please enter the same password twice.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        `/auth/${register ? "register" : "login"}`,
        { email, password },
      );
      localStorage.setItem("token", response.data.token);
      navigate("/search", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={submit}>
        <div className="auth-brand">
          <span className="auth-brand-icon" aria-hidden="true">🎵</span>
          <h1>Music Catalog</h1>
        </div>
        <h2>{register ? "Create your account" : "Welcome back"}</h2>
        <p>
          {register
            ? "Create an account to build your personal album library."
            : "Log in to explore your music library."}
        </p>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength="8"
            autoComplete={register ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {register && (
          <label>
            Confirm password
            <input
              type="password"
              required
              minLength="8"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}
        <button disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Login"}
        </button>
        <p>
          {register ? "Already registered? " : "New here? "}
          <NavLink to={register ? "/login" : "/register"}>
            {register ? "Login" : "Create an account"}
          </NavLink>
        </p>
      </form>
    </div>
  );
}

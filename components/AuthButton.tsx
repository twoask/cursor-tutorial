"use client";

import db, { useAuth } from "@/lib/instantdb";
import { useState } from "react";

export function AuthButton() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "verifying">("idle");
  const [message, setMessage] = useState<{ type: "info" | "error"; text: string } | null>(null);

  if (user) {
    return (
      <div className="auth-section">
        <span className="user-email">{user.email}</span>
        <button
          onClick={() => {
            db.auth.signOut().catch((error) => {
              console.error("Sign out error:", error);
            });
          }}
          className="auth-btn"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setMessage(null);
    try {
      await db.auth.sendMagicCode({ email });
      setStep("code");
      setMessage({ type: "info", text: `Magic code sent to ${email}. Enter it below.` });
    } catch (error) {
      console.error("Magic code send error:", error);
      setMessage({ type: "error", text: "Failed to send code. Please try again." });
    } finally {
      setStatus("idle");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;
    setStatus("verifying");
    setMessage(null);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      setShowAuthForm(false);
      setEmail("");
      setCode("");
      setStep("email");
    } catch (error) {
      console.error("Magic code verify error:", error);
      setMessage({ type: "error", text: "Invalid or expired code. Please request a new one." });
    } finally {
      setStatus("idle");
    }
  };

  if (!showAuthForm) {
    return (
      <button onClick={() => setShowAuthForm(true)} className="auth-btn">
        Sign In
      </button>
    );
  }

  return (
    <div className="auth-form-container">
      <form
        onSubmit={step === "email" ? handleSendCode : handleVerifyCode}
        className="auth-form"
      >
        <h3>{step === "email" ? "Sign In" : "Enter Code"}</h3>
        <p className="auth-helper">
          {step === "email"
            ? "Enter your email to receive a one-time sign-in code."
            : `Check your inbox for the 6-digit code we sent to ${email}.`}
        </p>
        {message && (
          <p className={`auth-message ${message.type === "error" ? "error" : ""}`}>
            {message.text}
          </p>
        )}
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step === "code"}
          required
          className="auth-input"
        />
        {step === "code" && (
          <input
            type="text"
            placeholder="123456"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            className="auth-input"
          />
        )}
        <div className="auth-form-actions">
          <button
            type="submit"
            className="auth-btn primary"
            disabled={status !== "idle"}
          >
            {step === "email"
              ? status === "sending"
                ? "Sending..."
                : "Send Code"
              : status === "verifying"
              ? "Verifying..."
              : "Verify Code"}
          </button>
          {step === "code" && (
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setMessage(null);
              }}
              className="auth-btn secondary"
            >
              Use different email
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowAuthForm(false);
              setEmail("");
              setCode("");
              setStep("email");
              setMessage(null);
            }}
            className="auth-btn secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}



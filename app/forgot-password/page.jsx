'use client';

import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import Pool from "@/components/UserPool";
import "./forgot-password.css";
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const getUser = () => {
    return new CognitoUser({
      Username: email.toLowerCase(),
      Pool,
    });
  };

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    getUser().forgotPassword({
      onSuccess: (data) => {
        console.log("onSuccess:", data);
        setMessage("Verification code sent to your email.");
      },
      onFailure: (err) => {
        console.error("onFailure:", err);
        setError(err.message || "Something went wrong.");
      },
      inputVerificationCode: (data) => {
        console.log("Input code:", data);
        setStage(2);
      },
    });
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    getUser().confirmPassword(code, password, {
      onSuccess: (data) => {
        console.log("Password reset success:", data);
        setMessage("Password has been reset. You can now log in.");
        setStage(1);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      },
      onFailure: (err) => {
        console.error("Error confirming password:", err);
        setError(err.message || "Failed to reset password.");
      },
    });
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {stage === 1 && (
        <form onSubmit={sendCode} className="forgot-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit">Send verification code</button>
        </form>
      )}

      {stage === 2 && (
        <form onSubmit={resetPassword} className="reset-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter verification code"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          <button type="submit">Change password</button>
        </form>
      )}
    </div>
  );
}

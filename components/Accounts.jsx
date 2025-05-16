"use client";

import React, { useState } from "react";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "ap-northeast-1_5RFZ7tKmp",
    ClientId: "5eid7801fqgv7qu4pjdc7s4pm1",
};

const userPool = new CognitoUserPool(poolData);

export default function Accounts() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: oldPassword,
    });

    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    user.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        user.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) {
            setError(err.message || "Failed to change password");
          } else {
            setMessage("Password changed successfully!");
          }
        });
      },
      onFailure: (err) => {
        setError(err.message || "Authentication failed");
      },
    });
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <form className="change-password-form" onSubmit={handleChangePassword}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Current Password</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />

        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button type="submit">Change Password</button>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

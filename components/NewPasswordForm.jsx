"use client"; 

import { useState } from "react";
import './NewPasswordForm.css';

export default function NewPasswordForm({ cognitoUser, userAttributes, onSuccess, onFailure }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters, including uppercase letters and numbers");
      return;
    }

    delete userAttributes.email_verified;
    delete userAttributes.phone_number_verified;
    delete userAttributes.sub;

    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
      onSuccess,
      onFailure: (err) => {
        setError("Unable to change password: " + err.message);
        if (onFailure) onFailure(err);
      },
    });
  };

  return (
    <form onSubmit={handleChangePassword}>
      <h2>Change new password</h2>
      <p>Password must be at least 8 characters, including uppercase letters and numbers</p>
      <input
        type="password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button type="submit">Confirm</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

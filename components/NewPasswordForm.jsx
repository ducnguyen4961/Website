"use client";

import { useState, useEffect } from "react";
import MFASetup from "./MFASetup";
import { useRouter } from 'next/navigation';
import './NewPasswordForm.css';

export default function NewPasswordForm({ cognitoUser, userAttributes, onSuccess, onFailure }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [showMFASetup, setShowMFASetup] = useState(false);
  const router = useRouter();

  useEffect(() => {
      const idToken = localStorage.getItem('idToken');
      const loginTime = localStorage.getItem('loginTime');
      const now = Date.now();
      const MAX_SESSION_DURATION = 10 * 60 * 60 * 1000;
      if (!idToken || !loginTime || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
        localStorage.clear();
        router.push('/login');
      }
    }, []);

  const handleMFASetup = (challengeName, challengeParameters) => {
    console.log("MFA setup required during new password challenge");
    setShowMFASetup(true);
  };
  
  

  const handleChangePassword = (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters, including uppercase letters and numbers");
      return;
    }

    // Tạo bản sao để không mutate prop
    const attrs = { ...userAttributes };
    delete attrs.email_verified;
    delete attrs.phone_number_verified;
    delete attrs.sub;

    cognitoUser.completeNewPasswordChallenge(newPassword, attrs, {
      onSuccess,
      onFailure: (err) => {
        setError("Unable to change password: " + err.message);
        if (onFailure) onFailure(err);
      },
      mfaSetup: handleMFASetup,
      mfaRequired: () => {},
      totpRequired: () => {},
    });
  };

  if (showMFASetup) {
    return (
      <MFASetup
        cognitoUser={cognitoUser}
        onSuccess={onSuccess}
        onFailure={(err) => {
          setError(err.message || "Lỗi MFA setup");
        }}
      />
    );
  }

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

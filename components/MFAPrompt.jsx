"use client";
import React, { useState, useRef } from "react";
import "./MFAPrompt.css";

export default function MFAPrompt({ cognitoUser, email, onSuccess, onFailure, isSetup }) {
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRef = useRef(false);

  const handleConfirmMFA = async () => {
    if (isProcessingRef.current || !mfaCode) {
      setError(isProcessingRef.current ? "Loading..." : "Please enter verification code");
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isSetup) {
        await new Promise((resolve, reject) => {
          cognitoUser.confirmSoftwareToken(mfaCode, "My TOTP device", {
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
          });
        });
      } else {
        await new Promise((resolve, reject) => {
  cognitoUser.sendMFACode(mfaCode, {
    onSuccess: (session) => {
      cognitoUser.setSignInUserSession(session);
      resolve(session);
    },
    onFailure: (err) => reject(err),
  }, "SOFTWARE_TOKEN_MFA");
});

      }

      if (onSuccess) {
        const idToken = cognitoUser.getSignInUserSession().getIdToken().getJwtToken();
        onSuccess({ idToken });
      }
    } catch (err) {
      console.error("MFA verification failed:", err);
      setError(err.message || "Incorrect verification code");
      if (onFailure) onFailure(err);
    } finally {
      isProcessingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Enter MFA authentication code</h2>
        <p>Please enter the code from your authenticator app</p>
        
        <input
          type="text"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          placeholder="Enter 6 digits"
          disabled={isLoading}
        />
        
        <button 
          onClick={handleConfirmMFA}
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Confirm'}
        </button>
        
        {error && (
          <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
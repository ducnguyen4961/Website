"use client";

import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUser
} from "amazon-cognito-identity-js";
import { useRouter } from "next/navigation";
import './signup.css'; 

const poolData = {
  UserPoolId: "ap-northeast-1_5RFZ7tKmp",
  ClientId: "5eid7801fqgv7qu4pjdc7s4pm1",        
};

const userPool = new CognitoUserPool(poolData);

export default function SignupPage() {
  const [step, setStep] = useState("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignup = (e) => {
    e.preventDefault();
  
    console.log("Phone submitted:", phone); 
  
    userPool.signUp(
      email,
      password,
      [
        { Name: "name", Value: name },
        { Name: "email", Value: email },
        { Name: "phone_number", Value: phone } 
      ],
      null,
      (err, result) => {
        if (err) {
          console.error("Signup error:", err);
          setError(err.message || JSON.stringify(err));
        } else {
          console.log("Signup successful!", result);
          setStep("confirm"); 
        }
      }
    );
  };
  

  const handleConfirm = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setError(err.message || JSON.stringify(err));
      } else {
        console.log("Confirmation successful:", result);
        router.push("/login");
      }
    });
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signuptitle">
          <h1>{step === "signup" ? "Sign Up" : "Confirm Email"}</h1>
        </div>
        {step === "signup" ? (
          <form className="signup-form" onSubmit={handleSignup}>
            <div>
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your name" />
            </div>
            
            <div>
            <label>Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+81"
            />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
            </div>
            <div style={{ position: "relative", minHeight: "80px", marginBottom: "16px" }}>
              <label>Password</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  padding: "12px 40px 12px 12px",
                  width: "100%",
                  boxSizing: "border-box",
                  height: "40px",
                  fontSize: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "6px"
                }}
                />
              <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#555",
                height: "20px",
                width: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined" style={{
                  display: "inline-block", width: "24px", height: "24px", fontSize: "24px", lineHeight: "24px"
                }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
              </div>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Create Account</button>
            <div className="signup-text">
              Already have an account? <a href="/login">Login here</a>
            </div>
          </form>
        ) : (
          <form className="signup-form" onSubmit={handleConfirm}>
            <p>Enter the confirmation code sent to your email</p>
            <div>
              <label>Verification Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Confirm Account</button>
            <p style={{ marginTop: '15px' }}>
              Didn't receive code?{" "}
              <button
                type="button"
                onClick={() => {
                  const user = new CognitoUser({ Username: email, Pool: userPool });
                  user.resendConfirmationCode((err, result) => {
                    if (err) alert("Error resending code: " + err.message);
                    else alert("The confirmation code has been resent.");
                  });
                }}
              >
                Resend code
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

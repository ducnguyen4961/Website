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
  const [step, setStep] = useState("signup"); // "signup" or "confirm"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); // mã xác nhận
  const [error, setError] = useState("");
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
            <div>
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
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

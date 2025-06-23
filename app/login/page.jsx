"use client";

import React, { useState } from "react";
import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { useRouter } from "next/navigation";
import NewPasswordForm from "@/components/NewPasswordForm";
import "./login.css";

const poolData = {
  UserPoolId: "ap-northeast-1_5RFZ7tKmp",
  ClientId: "5eid7801fqgv7qu4pjdc7s4pm1",
};

const userPool = new CognitoUserPool(poolData);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [challengeData, setChallengeData] = useState(null);
  const [cognitoUser, setCognitoUser] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });
    setCognitoUser(user);
    user.authenticateUser(authenticationDetails, {
      onSuccess: async (result) => {
        console.log("Login success:", result);
        const idToken = result.getIdToken().getJwtToken();
        try {
          const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          console.log("Fetch response:", res);
          

          const userInfo = await res.json();
          console.log("Fetched JSON body:", userInfo); 
          localStorage.setItem("userEmail", email);
          localStorage.setItem("idToken", idToken);
          localStorage.setItem("userRole", userInfo.role);
          localStorage.setItem("house", userInfo.house_device);
          localStorage.setItem("slaveIds", JSON.stringify(userInfo.slave_ids));
          router.push("/");
        } catch (err) {
          console.error("Error loading user info:", err);
          setError("Đăng nhập thành công nhưng không lấy được dữ liệu người dùng");
        }
      },
      onFailure: (err) => {
        console.error("Login error:", err);
        setError(err.message || "Login failed");
      },
      newPasswordRequired: (userAttributes) => {
        const cleanAttributes = { ...userAttributes };
        delete cleanAttributes.email;
        delete cleanAttributes.email_verified;
        delete cleanAttributes.phone_number;
        delete cleanAttributes.phone_number_verified;
        delete cleanAttributes.sub;

        setChallengeData({
          cognitoUser: user,
          userAttributes: cleanAttributes,
        });
        setShowNewPasswordForm(true);
      },
      totpRequired: () => {
        setShowMfaInput(true);
      },
      mfaRequired: () => {
        setShowMfaInput(true);
      },
    });
  };

  if (showNewPasswordForm) {
    return (
      <NewPasswordForm
        cognitoUser={challengeData.cognitoUser}
        userAttributes={challengeData.userAttributes}
        onSuccess={(res) => {
          console.log("Password changed successfully", res);
          localStorage.setItem("userEmail", email);
          router.push("/");
        }}
        onFailure={(err) => {
          console.error("Password change failed", err);
        }}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className= "logintitle">
          <h1>Login</h1>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className= "btnlogin">
            <button type="submit">Login</button>
          </div>
          <div className="extra-links">
            <div className="forgot-password">
              <a href="/forgot-password">Forgot password?</a>
            </div>
            <div className="signup">
              New user? <a href="/signup">Sign up</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

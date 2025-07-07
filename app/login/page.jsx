"use client";

import React, { useState, useContext } from "react";
import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { useRouter } from "next/navigation";
import NewPasswordForm from "@/components/NewPasswordForm";
import MFAPrompt from "@/components/MFAPrompt";
import { AuthContext } from "@/context/Authcontext";
import MFASetup from "@/components/MFASetup";
import "./login.css";
const poolData = {
  UserPoolId: "ap-northeast-1_5RFZ7tKmp",
  ClientId: "5eid7801fqgv7qu4pjdc7s4pm1",
};
const userPool = new CognitoUserPool(poolData);
const setAuthCookie = (email, role, idToken) => {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();

  const cookieOptions = `expires=${expires}; path=/; SameSite=Lax${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;

  document.cookie = `userEmail=${email}; ${cookieOptions}`;
  document.cookie = `userRole=${role}; ${cookieOptions}`;
  document.cookie = `idToken=${idToken}; ${cookieOptions}`;
};

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [challengeData, setChallengeData] = useState(null);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [showMFAPrompt, setShowMFAPrompt] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [isInMfaSetupFlow, setIsInMfaSetupFlow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  user.authenticateUser(authenticationDetails, {
    onSuccess: async (result) => {
      const idToken = result.getIdToken().getJwtToken();
      try {
        const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const userInfo = await res.json();
        setAuthCookie(email, userInfo.role, idToken);

        localStorage.setItem("userEmail", email);
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("loginTime", Date.now().toString());
        localStorage.setItem("userRole", userInfo.role);
        localStorage.setItem("house", userInfo.house_device);
        localStorage.setItem("slaveIds", JSON.stringify(userInfo.slave_ids));
        if (userInfo.role === "admin") {
          localStorage.setItem("houseDevicesMap", JSON.stringify(userInfo.house_devices || {}));
        }

        login(email, userInfo.role);
        router.push("/");
      } catch (err) {
        console.error("Error loading user info:", err);
        setError("Login successful but cannot get user data");
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

    mfaRequired: () => {
      setCognitoUser(user);
      setShowMFAPrompt(true);
    },
    totpRequired: () => {
      setCognitoUser(user);
      setShowMFAPrompt(true);
    },
    mfaSetup: (challengeName, challengeParameters) => {
      setCognitoUser(user); 
      setShowMFASetup(true);
    }
  });
};
  if (showNewPasswordForm) {
    return (
      <NewPasswordForm
        cognitoUser={challengeData.cognitoUser}
        userAttributes={challengeData.userAttributes}
        onSuccess={(res) => {
          setAuthCookie(email, "user", "");
          localStorage.setItem("userEmail", email);
          login(email, "user");
          router.push("/");
        }}
        onFailure={(err) => {
          console.error("Password change failed", err);
        }}
      />
    );
  }
  if (showMFASetup) {
  return (
    <MFASetup
    cognitoUser={cognitoUser}
    onSuccess={async ({ idToken }) => {
      try {
        const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        const userInfo = await res.json();
        setAuthCookie(email, userInfo.role, idToken);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("loginTime", Date.now().toString());
        localStorage.setItem("userRole", userInfo.role);
        localStorage.setItem("house", userInfo.house_device);
        localStorage.setItem("slaveIds", JSON.stringify(userInfo.slave_ids));
        if (userInfo.role === "admin") {
          localStorage.setItem("houseDevicesMap", JSON.stringify(userInfo.house_devices || {}));
          try {
            const res2 = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
            });
            const users = await res2.json();
            const emails = users.map(u => u.email).filter(Boolean);
            const usernames = users.map(u => u.username || u.name).filter(Boolean);
            localStorage.setItem("userEmails", JSON.stringify(emails));
            localStorage.setItem("userNames", JSON.stringify(usernames));
          } catch (err) {
            console.error("Lỗi khi lấy danh sách user (admin)", err);
          }
        }
        login(email, userInfo.role);
        router.push("/");
      } catch (err) {
        setError("MFA registration completed but cannot get user information");
      }
    }}
    />
  );
}

  if (showMFAPrompt) {
    return (
      <MFAPrompt
      cognitoUser={cognitoUser}
      email={email}
      isSetup={isInMfaSetupFlow}
      onSuccess={async ({ idToken }) => {
        try {
          const res = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          const userInfo = await res.json();

          setAuthCookie(email, userInfo.role, idToken);
          localStorage.setItem("userEmail", email);
          localStorage.setItem("idToken", idToken);
          localStorage.setItem("loginTime", Date.now().toString());
          localStorage.setItem("userRole", userInfo.role);
          localStorage.setItem("house", userInfo.house_device);
          localStorage.setItem("slaveIds", JSON.stringify(userInfo.slave_ids));

          if (userInfo.role === "admin") {
            localStorage.setItem("houseDevicesMap", JSON.stringify(userInfo.house_devices || {}));
            try {
              const res2 = await fetch("https://rb1295a9k5.execute-api.ap-northeast-1.amazonaws.com/version2/at", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
              });
              const users = await res2.json();
              const emails = users.map(u => u.email).filter(Boolean);
              const usernames = users.map(u => u.username || u.name).filter(Boolean);
              localStorage.setItem("userEmails", JSON.stringify(emails));
              localStorage.setItem("userNames", JSON.stringify(usernames));
            } catch (err) {
              console.error("Lỗi khi lấy danh sách user (admin)", err);
            }
          }
          login(email, userInfo.role);
          router.push("/");
        } catch (err) {
          setError("Login successful but cannot get user data");
        }
      }}      
      />
    );
  }

  return (
    <div className="login-container">
  <div className="login-box">
    <div className="logintitle">
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
          placeholder="Enter your email"
          style={{
            padding: "12px",
            width: "100%",
            boxSizing: "border-box",
            height: "40px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "6px"
          }}
        />
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
            onClick={() => setShowPassword((prev) => !prev)}
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

      <div className="btnlogin">
        <button type="submit" style={{
          width: "100%",
          padding: "12px",
          fontSize: "18px",
          fontWeight: "bold",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}>Login</button>
      </div>

      <div className="extra-links" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", fontSize: "14px" }}>
        <div className="forgot-password">
          <a href="/forgot-password">Forgot password?</a>
        </div>
        <div className="signup">
          New user? <a href="/signup">Sign up</a>
        </div>
      </div>
    </form>

    {error && (
      <p style={{ color: "red", fontWeight: "600", marginTop: "10px" }}>{error}</p>
    )}
  </div>
</div>

  );
}
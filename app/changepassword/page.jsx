'use client';

import React, { useState, useContext, useEffect } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import './changepassword.css';
import { useRouter } from 'next/navigation';
import { AuthContext } from "@/context/Authcontext";

const poolData = {
  UserPoolId: 'ap-northeast-1_5RFZ7tKmp',
  ClientId: '5eid7801fqgv7qu4pjdc7s4pm1',
};
const userPool = new CognitoUserPool(poolData);

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    const { logout } = useContext(AuthContext);
    const idToken = localStorage.getItem('idToken');
    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();
    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    if (!idToken || !loginTime ||isNaN(parseInt(loginTime)) || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
      localStorage.clear();
      logout();
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const user = userPool.getCurrentUser();
    if (!user) {
      router.push('/login'); 
    } else {
      user.getSession((err, session) => {
        if (err || !session.isValid()) {
          router.push('/login');
        }
      });
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const user = userPool.getCurrentUser();
    if (!user) {
      setError('No user is currently logged in.');
      return;
    }

    user.getSession((err, session) => {
      if (err || !session.isValid()) {
        setError('Session is invalid. Please login again.');
        return;
      }

      user.changePassword(currentPassword, newPassword, (err, result) => {
        if (err) {
          setError(err.message || 'Password change failed.');
        } else {
          setMessage('Password changed successfully.');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      });
    });
  };

  return (
    <div className="change-password-container">
      <div className="change-title">
        <h2>Change Password</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <div className="changepass">
          <button type="submit">Change Password</button>
        </div>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
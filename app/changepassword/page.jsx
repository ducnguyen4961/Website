'use client';

import React, { useState, useContext, useEffect } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import './changepassword.css';
import { useRouter } from 'next/navigation';

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
    const user = userPool.getCurrentUser();
    if (!user) {
      router.push('/login'); // chưa login thì đẩy về login luôn
    } else {
      user.getSession((err, session) => {
        if (err || !session.isValid()) {
          router.push('/login'); // session hết hạn thì cũng về login
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
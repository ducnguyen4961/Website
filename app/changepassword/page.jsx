'use client';

import React, { useState, useContext } from 'react';
import './changepassword.css';
import { AccountContext } from '@/components/Accounts';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();
  const { getSession, authenticate } = useContext(AccountContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { user, email } = await getSession();
      await authenticate(email, password);
      user.changePassword(password, newPassword, (err, result) => {
        if (err) {
          console.error(err);
          setError('Password change failed.');
        } else {
          setMessage('Password changed successfully.');
          setTimeout(() => {
            router.push('/'); // 👈 Chuyển về trang /
          }, 1000);
        }
      });
    } catch (err) {
      console.error(err);
      setError('Authentication failed.');
    }
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <div className= "changepass">
          <button type="submit">Change Password</button>
        </div>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

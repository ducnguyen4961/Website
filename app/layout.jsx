'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Account } from '@/components/Accounts';


export default function RootLayout({ children }) {
  const [userEmail, setUserEmail] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    window.location.href = '/';
  };

  return (
    <html lang="ja">
      <body>
        <Account>
          <header className="navbar">
            <div className="logo">
              <img src="/images/logocty.png" alt="Logo" />
            </div>
            
            <div className="right-link">
              <a href="/" className="home-btn">Home</a>
              <a href="/products" className="products-btn">Products</a>
              <a href="/about" className="about-btn">About</a>
              <a href="/contact" className="contact-btn">Contact</a>
              </div>
              
              <div className="left-link">
              {userEmail ? (
                <>
                  <div className="profile-dropdown">
                    <button
                      className="profile-btn"
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                    >
                      Profile
                    </button>
                    {isProfileOpen && (
                      <div className="dropdown-content">
                        <p>{userEmail}</p>
                        <button onClick={handleLogout}>Logout</button>
                        <a href="/changepassword">Change Password</a>
                      </div>
                    )}
                  </div>
                  <a href="/dashboard" className="dashboard-btn">Dashboard</a>
                </>
              ) : (
                <>
                  <a href="/login" className="login-btn">Login</a>
                  <a href="/signup" className="signup-btn">Sign Up</a>
                </>
              )}
            </div>
          </header>
          <main>{children}</main>
        </Account>
      </body>
    </html>
  );
}
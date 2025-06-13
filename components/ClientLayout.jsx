// components/ClientLayout.jsx
'use client';
import { useEffect, useState } from 'react';
import { AuthProvider } from "@/context/AuthContext";

export default function ClientLayout({ children }) {
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
    <AuthProvider>
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
                <div
                  className="profile-btn"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsProfileOpen((prev) => !prev);
                  }}
                >Profile</div>

                {isProfileOpen && (
                  <div className="dropdown-content">
                    <p>{userEmail}</p>
                    <a className="logout-btn" onClick={handleLogout} role="button">Logout</a>
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
    </AuthProvider>
  );
}

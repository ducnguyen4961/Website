'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { AuthProvider, AuthContext } from "@/context/Authcontext";
import Link from 'next/link';

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
        <AuthProvider>
          <div className="navbar">
            <Link href="https://www.uruoi-navi.com/" className="logo-link">
              <img
                src="/images/logocty.png"
                alt="Logo"
                className="logo"
                width={200}
                height={70}
              />
            </Link>
            <div className="right-link">

              <a
                href="https://yamamoto-denki.jp/product-line/agricultural-products/"
                className="products-btn"
              >
                Products
              </a>

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
        </div>
        <main>{children}</main>

        </AuthProvider>
      </body>
    </html>
  );
}
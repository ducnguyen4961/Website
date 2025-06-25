'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { AuthProvider, AuthContext } from "@/context/Authcontext";
import Link from 'next/link';
import Head from 'next/head';

export default function RootLayout({ children }) {
  const [userEmail, setUserEmail] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


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
                    ><span className="material-symbols-outlined">manage_accounts</span></div>

                  {isProfileOpen && (
                    <div className="dropdown-content">
                      <p>{userEmail}</p>
                      <a className="logout-btn" onClick={handleLogout} role="button">Logout</a>
                      <a href="/changepassword">Change Password</a>
                    </div>
                  )}
                </div>
                <div className="menu-dropdown">
                  <div className="menu-btn" 
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsMenuOpen((prev) => !prev);
                  }}
                  ><span className="material-symbols-outlined" style={{ color: '#333' }}>menu</span></div>
                  {isMenuOpen && (
                    <div className="dropdown-content">
                      <a href="/dashboard">ダッシュボード</a>
                      <a href="/RadarChart">レーダーチャート</a>
                      <a href="/config-form">ユーザ設定</a>
                      <a href="/fill-form">デバイス</a>
                      </div>
                  )}
                </div>
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
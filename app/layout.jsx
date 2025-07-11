'use client';

import './globals.css';
import { useState, useContext } from 'react';
import { useRouter } from "next/navigation";
import { AuthProvider, AuthContext } from "@/context/Authcontext";
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import awsExports from '@/src/aws-exports';

Amplify.configure(awsExports);

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isInitialized } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="navbar">
      <Link href="https://www.uruoi-navi.com/" className="logo-link">
        <img src="/images/logocty.png" alt="Logo" className="logo-img" width={200} height={70} />
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
        {!isInitialized ? (
          <div style={{ minWidth: 150 }}></div>
        ) : user ? (
          <>
            <div 
              className="profile-dropdown" 
              onMouseEnter={() => setIsProfileOpen(true)} 
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div className="profile-btn" role="button" tabIndex={0}>
                <span className="material-symbols-outlined">Person</span>
              </div>
              {isProfileOpen && (
                <div className="dropdown-content">
                  <p>{user.email}</p>
                  <a className="logout-btn" onClick={handleLogout} role="button">
                    <span className="material-symbols-outlined">logout</span>Logout
                  </a>
                  <a href="/changepassword">
                    <span className="material-symbols-outlined">cycle</span>Change Password
                  </a>
                </div>
              )}
            </div>

            <div 
              className="menu-dropdown" 
              onMouseEnter={() => setIsMenuOpen(true)} 
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <div className="menu-btn" role="button" tabIndex={0}>
                <span className="material-symbols-outlined">menu</span>
              </div>
              {isMenuOpen && (
                <div className="dropdown-content">
                  <a href="/dashboard">
                    <span className="material-symbols-outlined">monitoring</span>ダッシュボード
                  </a>
                  <a href="/RadarChart">
                    <span className="material-symbols-outlined">pie_chart</span>レーダーチャート
                  </a>
                  {user.role == 'admin' && (
                    <a href="/register-slave">
                      <span className="material-symbols-outlined">devices_other</span>デバイス
                    </a>
                  )}
                  <a href="/config-form">
                    <span className="material-symbols-outlined">settings_b_roll</span>ユーザ設定
                  </a>
                  {(user.role === 'user_csv1' || user.role === 'admin') && (
                    <>
                      <a href="/HistoricalData/user_csv1">
                        <span className="material-symbols-outlined">history</span>有線 ver.
                      </a>
                    </>
                  )}
                  {(user.role === 'user_csv2' || user.role === 'admin') && (
                    <>
                      <a href="/HistoricalData/user_csv2">
                        <span className="material-symbols-outlined">history</span>有線 ver.
                      </a>
                    </>
                  )}
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
  );
}


export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}


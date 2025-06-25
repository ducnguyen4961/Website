'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { AuthProvider, AuthContext } from "@/context/Authcontext";
import Link from 'next/link';



export default function RootLayout({ children }) {
  const [userEmail, setUserEmail] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);


  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    if (email) setUserEmail(email);
    if (role) setUserRole(role);
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
                <div className="profile-dropdown" onMouseEnter={() => setIsProfileOpen(true)} onMouseLeave={() => setIsProfileOpen(false)}>
                  <div className="profile-btn" role="button" tabIndex={0}>
                    <span className="material-symbols-outlined">manage_accounts</span>
                    </div>
                    {isProfileOpen && (
                      <div className="dropdown-content">
                        <p>{userEmail}</p>
                        <a className="logout-btn" onClick={handleLogout} role="button">Logout</a>
                        <a href="/changepassword">Change Password</a>
                      </div>
                    )}
                    </div>
                <div className="menu-dropdown" onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
                  <div className="menu-btn" role="button" tabIndex={0}>
                    <span className="material-symbols-outlined">menu</span>
                    </div>
                    {isMenuOpen && (
                      <div className="dropdown-content">
                        <a href="/dashboard">ダッシュボード</a>
                        <a href="/RadarChart">レーダーチャート</a>
                        {userRole && userRole !== 'user' && <a href="/fill-form">デバイス</a>}
                        <a href="/config-form">ユーザ設定</a>
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
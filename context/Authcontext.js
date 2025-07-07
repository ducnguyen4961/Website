"use client";
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getCookie = (name) => {
    if (typeof window === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };
  useEffect(() => {
    const email = getCookie('userEmail') || localStorage.getItem('userEmail');
    const role = getCookie('userRole') || localStorage.getItem('userRole');
    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();
    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    
    if (!email || !loginTime || now - parseInt(loginTime) > MAX_SESSION_DURATION) {
      setUser(null);
      localStorage.clear(); 
      document.cookie = "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } else {
      setUser({ email, role });
    }
    setIsInitialized(true);
  }, []);


  const login = (email, role) => {
    document.cookie = `userEmail=${email}; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 30}`;
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", role);
    setUser({ email, role });
  };

  const logout = () => {
    document.cookie = "userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("idToken");
    localStorage.removeItem("loginTime");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

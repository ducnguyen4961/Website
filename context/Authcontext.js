"use client";

import { createContext, useEffect, useState } from "react";

// Tạo context
export const AuthContext = createContext();

// Provider bọc toàn bộ app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Kiểm tra localStorage khi load
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUser(email);
    }
  }, []);

  const login = (email) => {
    localStorage.setItem("userEmail", email);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

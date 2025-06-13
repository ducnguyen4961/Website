"use client";

import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
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

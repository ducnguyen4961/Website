"use client";
import { createContext, useContext,　useEffect, useState } from "react";
const AuthContext = createContext();

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);

    useEffect(() => {
        // You can store user in localStorgae or invoke Cognito to take information right here if you need
        const storeUser = JSON.parse(localStorage.getItem("cognitoUser"));
        if (storeUser) setUser(storeUser);
    },[]);

    return (
        <AuthContext.Provider value={{user, setUser}}>
            children
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
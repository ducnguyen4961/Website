'use client';

import React, { createContext } from 'react';
import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_XXXXXXX', // 🔁 thay bằng của bạn
  ClientId: 'XXXXXXXXXXXXXXXXXXXXXX', // 🔁 thay bằng của bạn
};

const UserPool = new CognitoUserPool(poolData);

export const AccountContext = createContext();

export const Account = ({ children }) => {
  const getSession = async () =>
    await new Promise((resolve, reject) => {
      const user = UserPool.getCurrentUser();
      if (user) {
        user.getSession((err, session) => {
          if (err) {
            reject(err);
          } else {
            resolve({ session, user, email: user.getUsername() });
          }
        });
      } else {
        reject(new Error("No user session found"));
      }
    });

  const authenticate = async (Username, Password) =>
    await new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username,
        Pool: UserPool,
      });

      const authDetails = new AuthenticationDetails({
        Username,
        Password,
      });

      user.authenticateUser(authDetails, {
        onSuccess: (data) => {
          resolve(data);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });

  return (
    <AccountContext.Provider value={{ getSession, authenticate }}>
      {children}
    </AccountContext.Provider>
  );
};

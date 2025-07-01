"use client";
import React, { useEffect, useState, useRef } from "react";
import { toCanvas } from 'qrcode';
import "./MFASetup.css";

export default function MFASetup({ cognitoUser, onSuccess, onFailure }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setupCompleted = useRef(false);

  useEffect(() => {
    if (!cognitoUser || setupCompleted.current) return;
    setupCompleted.current = true;
    const setupMFA = async () => {
      try {
        await new Promise((resolve, reject) => {
          cognitoUser.associateSoftwareToken({
            associateSecretCode: (secretCode) => {
              const username = cognitoUser.getUsername();
              const otpauthUrl = `otpauth://totp/UruoiNavi:${username}?secret=${secretCode}&issuer=UruoiNavi`;
              setQrCodeUrl(otpauthUrl);
              resolve();
            },
            onFailure: (err) => {
              console.error("associateSoftwareToken failed:", err);
              reject(err);
            }
          });
        });
      } catch (err) {
        setError("10秒待ってからもう一度お試しください。");
        if (onFailure) onFailure(err);
      }
    };

    setupMFA();
  }, [cognitoUser]);
  const canvasRef = useRef(null);
  useEffect(() => {
    if (qrCodeUrl && canvasRef.current) {
      toCanvas(canvasRef.current, qrCodeUrl, { width: 180 }, (error) => {
        if (error) console.error("QR code error:", error);
      });
    }
  }, [qrCodeUrl]);

  const handleConfirm = async () => {
  if (isLoading) return;
  setIsLoading(true);
  setError("");

  try {
    await new Promise((resolve, reject) => {
      cognitoUser.verifySoftwareToken(otpCode, "My TOTP device", {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
    await new Promise((resolve, reject) => {
      cognitoUser.setUserMfaPreference(
        null,
        { PreferredMfa: true, Enabled: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    if (onSuccess) {
      const idToken = cognitoUser.getSignInUserSession().getIdToken().getJwtToken();
      onSuccess({ idToken });
    }
  } catch (err) {
    console.error("MFA Error:", err);
    setError(err.message || "認証に失敗しました。もう一度お試しください。");
    if (onFailure) onFailure(err);
  } finally {
    setIsLoading(false);
  }
};
  return (
  <div className="mfa-setup-container" style={{ display: 'flex', justifyContent: 'center', gap: '40px', padding: '20px' }}>
    <div className="login-box" style={{ textAlign: 'center' }}>
      <h2>QRコード</h2>
      {qrCodeUrl ? (
        <>
          <canvas ref={canvasRef} width={180} height={180} style={{ marginBottom: '12px' }} />
          <p>認証アプリでQRコードをスキャンする</p>
          <input
            type="text"
            placeholder="確認コードを入力してください"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            disabled={isLoading}
            style={{ padding: '8px', marginBottom: '8px', width: '180px' }}
          />
          <br />
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ padding: '8px 16px' }}
          >
            {isLoading ? '処理...' : '確認'}
          </button>
        </>
      ) : (
        <p>QR コードを生成しています...</p>
      )}
      {error && <p style={{ color: "red", marginTop: '10px' }}>{error}</p>}
    </div>
    <div className="mfa-instructions" style={{ maxWidth: '300px' }}>
      <h3>インストール手順</h3>
      <ol style={{ lineHeight: '1.8' }}>
        <li>ステップ1： スマートフォンに Google Authenticator アプリをダウンロードします</li>
        <li>ステップ2： アプリを開き、必要に応じてログインします</li>
        <li>ステップ3： 「新しいアカウントを追加」を選択し、となり側のQRコードをスキャンします</li>
        <li>ステップ4： アプリに表示された6桁のコードをQRコードの下の欄に入力します</li>
        <li>ステップ5： 「確認」をタップして完了です</li>
      </ol>
    </div>
  </div>
);

}
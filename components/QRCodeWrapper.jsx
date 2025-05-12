// components/QRCodeWrapper.jsx
"use client"; // Đảm bảo component này chỉ chạy ở client

import React from 'react';
import { QRCode } from 'qrcode.react';

export default function QRCodeWrapper({ value }) {
  return <QRCode value={value} size={256} />;
}

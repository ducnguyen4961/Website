// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'My App',
  description: 'Example App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}

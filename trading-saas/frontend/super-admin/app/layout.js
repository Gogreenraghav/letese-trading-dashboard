import './globals.css';

export const metadata = {
  title: 'NSE-BSE Trading SaaS — Super Admin',
  description: 'Super Admin Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

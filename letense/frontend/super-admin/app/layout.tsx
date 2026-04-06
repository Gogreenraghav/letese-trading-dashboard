import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LETESE● Super Admin",
  description: "LETESE Legal SaaS — Super Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LETESE● Admin Dashboard",
  description: "Customer Admin Dashboard — LETESE Legal SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

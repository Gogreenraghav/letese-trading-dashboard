"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/login") {
      setChecked(true);
      return;
    }
    const token = localStorage.getItem("sa_token");
    if (!token) {
      router.push("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0E1A",
        color: "#64748B",
        fontFamily: "Inter, sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}

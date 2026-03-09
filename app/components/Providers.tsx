"use client";

import { useEffect } from "react";
import { NeonAuthUIProvider, useAuthenticate } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

// Syncs the Neon Auth session token to the API layer
function AuthSync() {
  const { user } = useAuthenticate({ enabled: false });

  useEffect(() => {
    if (!user) {
      setAuthToken(null);
      return;
    }

    // Extract session token from cookies to pass as Bearer token to our API
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) =>
      c.startsWith("better-auth.session_token=")
    );
    if (sessionCookie) {
      const token = sessionCookie.split("=").slice(1).join("=");
      setAuthToken(token);
    }
  }, [user]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const isElectron =
    typeof window !== "undefined" &&
    !!(window as unknown as { electron?: { isElectron: boolean } }).electron
      ?.isElectron;

  // In Electron mode, skip NeonAuthUIProvider entirely
  if (isElectron) {
    return <>{children}</>;
  }

  return (
    <NeonAuthUIProvider authClient={authClient} emailOTP>
      <AuthSync />
      {children}
    </NeonAuthUIProvider>
  );
}

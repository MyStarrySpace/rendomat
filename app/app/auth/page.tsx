"use client";

import { AuthView } from "@neondatabase/neon-js/auth/react/ui";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <AuthView />
    </div>
  );
}

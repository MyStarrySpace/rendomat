"use client";

import { AccountView } from "@neondatabase/neon-js/auth/react/ui";

export default function AccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <AccountView />
    </div>
  );
}

"use client";

import { AccountView } from "@neondatabase/neon-js/auth/react/ui";
import "@neondatabase/neon-js/ui/css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clients"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="caption mb-4">Settings</p>
          <h1 className="headline text-3xl text-[hsl(var(--foreground))] mb-8">
            Account
          </h1>
          <AccountView />
        </div>
      </div>
    </div>
  );
}

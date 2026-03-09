"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth";
import Link from "next/link";
import { User, LogOut, Settings, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UserMenu() {
  const { user } = useAuthenticate({ enabled: false });
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSignOut() {
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  if (!user) return null;

  const initial = user.email?.[0]?.toUpperCase() || "?";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 border border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] text-sm font-medium flex items-center justify-center hover:border-[hsl(var(--border-hover))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] shadow-lg z-50"
          >
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--foreground-subtle))] truncate">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Account
              </Link>
              <Link
                href="/billing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Billing
              </Link>
            </div>

            <div className="border-t border-[hsl(var(--border))] py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--error))] hover:bg-[hsl(var(--error-muted))] transition-colors w-full text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

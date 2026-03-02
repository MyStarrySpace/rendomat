"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, CreditCard, User, Coins } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 bg-[hsl(var(--surface))] animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()}
        className="inline-flex items-center gap-2 h-8 px-3 text-sm font-medium text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        Sign in
      </button>
    );
  }

  const user = session.user as any;
  const credits = user.credits ?? 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-8 px-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-6 h-6 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="w-5 h-5 text-[hsl(var(--foreground-muted))]" />
        )}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--accent))]">
          <Coins className="w-3 h-3" />
          {credits}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] shadow-lg z-50">
          <div className="p-3 border-b border-[hsl(var(--border))]">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-[hsl(var(--foreground-muted))] truncate">
              {user.email}
            </p>
          </div>

          <div className="p-2 border-b border-[hsl(var(--border))]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs uppercase tracking-wider text-[hsl(var(--foreground-muted))]">
                Credits
              </span>
              <span className="text-sm font-medium text-[hsl(var(--accent))]">
                {credits}
              </span>
            </div>
          </div>

          <div className="p-1">
            <Link
              href="/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-colors w-full"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Buy Credits
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--background))] transition-colors w-full text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

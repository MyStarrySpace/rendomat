"use client";

import { useState, useEffect } from "react";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react/ui";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { billingApi, userApi, CreditPackage, CreditTransaction } from "@/lib/api";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  spring,
  staggerContainer,
  fadeInUp,
  viewportOnce,
} from "@/lib/motion";

export default function BillingPage() {
  const { user } = useAuthenticate({ enabled: false });
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  // Check for success/canceled query params
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") setShowSuccess(true);
    if (params.get("canceled") === "true") setShowCanceled(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [pkgRes] = await Promise.all([
        billingApi.getPackages(),
      ]);
      setPackages(pkgRes.packages);

      if (user) {
        // TODO: fetch credits and transactions from Neon DB via API route
      }
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(packageId: string) {
    if (!user) return;
    setCheckingOut(packageId);
    try {
      // TODO: implement checkout via Neon DB API route
      console.warn("Checkout not yet implemented with Neon Auth");
      setCheckingOut(null);
    } catch (error) {
      console.error("Checkout failed:", error);
      setCheckingOut(null);
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatReason(reason: string) {
    switch (reason) {
      case "signup_bonus": return "Signup bonus";
      case "purchase": return "Credit purchase";
      case "render": return "Cloud render";
      default: return reason;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--foreground-muted))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {credits} credits
            </span>
          </div>
        </div>
      </motion.nav>

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Status banners */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-[hsl(var(--success))]" />
              <p className="text-sm text-[hsl(var(--foreground))]">
                Payment successful! Credits have been added to your account.
              </p>
            </motion.div>
          )}
          {showCanceled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-[hsl(var(--warning))]" />
              <p className="text-sm text-[hsl(var(--foreground))]">
                Payment canceled. No charges were made.
              </p>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
            className="mb-12"
          >
            <p className="caption mb-4">Billing</p>
            <h1 className="headline text-4xl text-[hsl(var(--foreground))] mb-3">
              Cloud Render Credits
            </h1>
            <p className="text-[hsl(var(--foreground-muted))] max-w-lg">
              Credits are based on video length: 1 credit per 10 seconds of rendered
              video. Your video is rendered on AWS Lambda and delivered via S3, so no
              local resources are needed.
            </p>
          </motion.div>

          {/* Packages */}
          {!user ? (
            <div className="p-8 border border-[hsl(var(--border))] text-center">
              <p className="text-[hsl(var(--foreground-muted))] mb-4">
                Sign in to purchase credits
              </p>
              <Button onClick={() => router.push("/auth")}>
                Sign in
              </Button>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            >
              {packages.map((pkg) => (
                <motion.div key={pkg.id} variants={fadeInUp}>
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pkg.label}</span>
                        <Badge variant="secondary">{formatPrice(pkg.price)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-4">
                      <p className="text-sm text-[hsl(var(--foreground-muted))]">
                        {formatPrice(Math.round(pkg.price / pkg.credits))} per credit
                      </p>
                      <Button
                        onClick={() => handleCheckout(pkg.id)}
                        loading={checkingOut === pkg.id}
                        disabled={!!checkingOut}
                        icon={<CreditCard className="w-4 h-4" />}
                        className="w-full"
                      >
                        Buy {pkg.credits} Credits
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Transaction history */}
          {user && transactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.2 }}
            >
              <h2 className="caption mb-6">Transaction History</h2>
              <div className="border border-[hsl(var(--border))]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))]">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Reason</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-[hsl(var(--border))] last:border-0"
                      >
                        <td className="p-3 text-[hsl(var(--foreground-muted))]">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-[hsl(var(--foreground))]">
                          {formatReason(txn.reason)}
                        </td>
                        <td className={`p-3 text-right font-medium ${txn.amount > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--error))]'}`}>
                          {txn.amount > 0 ? '+' : ''}{txn.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

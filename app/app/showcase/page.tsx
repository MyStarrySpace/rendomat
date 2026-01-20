"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowLeft, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Label } from "@/components/ui/input";

// -----------------------------------------------------------------------------
// Component Showcase Page
// -----------------------------------------------------------------------------

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rendomat
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[hsl(var(--foreground))] flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            View source
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-6">Design System</p>

          <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-6">
            Component Library
          </h1>

          <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl leading-relaxed">
            A minimal design system built for Rendomat. Warm tones, editorial
            typography, and straightforward components.
          </p>
        </div>
      </section>

      {/* Colors */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Colors</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch name="Background" variable="--background" />
            <ColorSwatch name="Surface" variable="--surface" />
            <ColorSwatch name="Foreground" variable="--foreground" light />
            <ColorSwatch name="Muted" variable="--foreground-muted" light />
            <ColorSwatch name="Accent" variable="--accent" light />
            <ColorSwatch name="Border" variable="--border" />
            <ColorSwatch name="Success" variable="--success" light />
            <ColorSwatch name="Error" variable="--error" light />
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Typography</p>

          <div className="space-y-8">
            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-2 font-mono">
                headline / Instrument Serif
              </p>
              <p className="headline text-4xl text-[hsl(var(--foreground))]">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-2 font-mono">
                body / Inter
              </p>
              <p className="text-lg text-[hsl(var(--foreground))]">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-2 font-mono">
                caption / uppercase tracking
              </p>
              <p className="caption">The quick brown fox</p>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-2 font-mono">
                mono / JetBrains Mono
              </p>
              <p className="font-mono text-sm text-[hsl(var(--foreground))]">
                const message = &quot;Hello, world&quot;;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Buttons</p>

          <div className="space-y-8">
            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                Variants
              </p>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                Sizes
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                With icons
              </p>
              <div className="flex flex-wrap gap-4">
                <Button icon={<Check className="w-4 h-4" />}>Confirm</Button>
                <Button
                  variant="secondary"
                  icon={<ArrowUpRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Open link
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                States
              </p>
              <div className="flex flex-wrap gap-4">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Cards</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>
                  A simple card with header and content areas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                  Card content goes here. Cards are used to group related
                  information together.
                </p>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
                <CardDescription>
                  With a visible border for more definition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                  Use bordered cards when you need more visual separation
                  between elements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Badges</p>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                Monospace
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge mono>v1.0.0</Badge>
                <Badge variant="outline" mono>
                  MIT
                </Badge>
                <Badge variant="secondary" mono>
                  TypeScript
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Form Elements</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="input-default">Text Input</Label>
                <Input id="input-default" placeholder="Enter text..." />
              </div>

              <div>
                <Label htmlFor="input-disabled">Disabled</Label>
                <Input
                  id="input-disabled"
                  placeholder="Cannot edit"
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="textarea">Textarea</Label>
              <Textarea
                id="textarea"
                placeholder="Enter longer text..."
                rows={5}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Utility Classes */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-8">Utility Classes</p>

          <div className="space-y-8">
            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                .pill
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="pill">Design</span>
                <span className="pill">Development</span>
                <span className="pill">React</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                .link-subtle
              </p>
              <p className="text-[hsl(var(--foreground-muted))]">
                This is a paragraph with a{" "}
                <a href="#" className="link-subtle">
                  subtle link
                </a>{" "}
                inside it.
              </p>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                .frame
              </p>
              <div className="frame inline-block">
                <div className="w-48 h-32 bg-[hsl(var(--background-subtle))] flex items-center justify-center">
                  <span className="caption">Image</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-4 font-mono">
                .divider
              </p>
              <div className="divider" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[hsl(var(--foreground-subtle))]">
            Built with Next.js, Tailwind CSS, and CSS custom properties.
          </p>
        </div>
      </footer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Color Swatch Component
// -----------------------------------------------------------------------------

function ColorSwatch({
  name,
  variable,
  light = false,
}: {
  name: string;
  variable: string;
  light?: boolean;
}) {
  return (
    <div>
      <div
        className="h-20 mb-2 border border-[hsl(var(--border))]"
        style={{ backgroundColor: `hsl(var(${variable}))` }}
      />
      <p
        className={`text-sm ${light ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground-muted))]"}`}
      >
        {name}
      </p>
      <p className="text-xs font-mono text-[hsl(var(--foreground-subtle))]">
        {variable}
      </p>
    </div>
  );
}

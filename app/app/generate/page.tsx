"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  FileText,
  Building2,
  Target,
  Zap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  urlToVideoApi,
  templateApi,
  type UrlAnalysis,
  type Template,
} from "@/lib/api";
import { staggerContainer, fadeInUp, spring } from "@/lib/motion";

// ============================================================================
// Types
// ============================================================================

type Step = "input" | "review" | "generating" | "done";

// ============================================================================
// Page
// ============================================================================

export default function GenerateFromUrlPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("input");

  // Input
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Analysis result + overrides
  const [analysis, setAnalysis] = useState<UrlAnalysis | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);
  const [overrides, setOverrides] = useState({
    title: "",
    description: "",
    templateId: "",
    sceneCount: 0,
    useResearch: false,
  });

  // Result
  const [result, setResult] = useState<{
    video: { id: number; title: string };
    scenes: unknown[];
  } | null>(null);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setError("");
    setAnalyzing(true);

    try {
      const [analysisData, templateData] = await Promise.all([
        urlToVideoApi.analyzeUrl(url.trim()),
        templateApi.getAll(),
      ]);

      setAnalysis(analysisData);
      setTemplates(templateData);
      setOverrides({
        title: analysisData.title,
        description: analysisData.description,
        templateId: analysisData.recommendedTemplate,
        sceneCount: analysisData.sceneCount,
        useResearch: false,
      });
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!analysis) return;

    setStep("generating");
    setError("");

    try {
      const res = await urlToVideoApi.generateFromUrl({
        url: analysis.sourceUrl,
        title: overrides.title || undefined,
        description: overrides.description || undefined,
        templateId: overrides.templateId || undefined,
        sceneCount: overrides.sceneCount || undefined,
        useResearch: overrides.useResearch,
      });

      setResult({
        video: res.video as { id: number; title: string },
        scenes: res.scenes,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("review");
    }
  }

  function handleReset() {
    setStep("input");
    setUrl("");
    setAnalysis(null);
    setOverrides({
      title: "",
      description: "",
      templateId: "",
      sceneCount: 0,
      useResearch: false,
    });
    setResult(null);
    setError("");
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="caption">URL to Video</span>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-10"
          >
            <motion.p variants={fadeInUp} className="caption mb-3">
              Generate
            </motion.p>
            <motion.h1
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-3"
            >
              Paste a URL, get a video
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-lg"
            >
              Drop any public URL — product page, company site, blog post,
              case study — and AI will analyze it and generate a video.
            </motion.p>
          </motion.div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(["input", "review", "generating", "done"] as Step[]).map(
              (s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 flex items-center justify-center text-xs border ${
                      step === s
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                        : (["input", "review", "generating", "done"] as Step[]).indexOf(step) > i
                          ? "border-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--foreground-subtle))]"
                    }`}
                  >
                    {(["input", "review", "generating", "done"] as Step[]).indexOf(step) > i ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-8 h-px ${
                        (["input", "review", "generating", "done"] as Step[]).indexOf(step) > i
                          ? "bg-[hsl(var(--accent))]"
                          : "bg-[hsl(var(--border))]"
                      }`}
                    />
                  )}
                </div>
              )
            )}
            <span className="ml-3 text-xs text-[hsl(var(--foreground-subtle))]">
              {step === "input" && "Enter URL"}
              {step === "review" && "Review & customize"}
              {step === "generating" && "Generating..."}
              {step === "done" && "Complete"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* ============================================================ */}
            {/* STEP 1: URL INPUT                                            */}
            {/* ============================================================ */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={spring.gentle}
              >
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleAnalyze} className="space-y-4">
                      <div>
                        <Label>Public URL</Label>
                        <Input
                          type="url"
                          placeholder="https://example.com/product"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          icon={<Globe className="w-4 h-4" />}
                          required
                        />
                        <p className="mt-1.5 text-xs text-[hsl(var(--foreground-subtle))]">
                          Product pages, company sites, blog posts, landing
                          pages, portfolios...
                        </p>
                      </div>

                      {error && (
                        <p className="text-sm text-[hsl(var(--error))]">
                          {error}
                        </p>
                      )}

                      <Button type="submit" loading={analyzing}>
                        <Sparkles className="w-4 h-4" />
                        Analyze URL
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: REVIEW & CUSTOMIZE                                   */}
            {/* ============================================================ */}
            {step === "review" && analysis && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={spring.gentle}
                className="space-y-6"
              >
                {/* Source info */}
                <Card padding="sm">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[hsl(var(--foreground-subtle))]" />
                    <span className="text-sm text-[hsl(var(--foreground-muted))] truncate flex-1">
                      {analysis.sourceUrl}
                    </span>
                    <Badge variant="outline">{analysis.contentType}</Badge>
                  </div>
                </Card>

                {/* Analysis summary */}
                <Card>
                  <CardContent className="space-y-4 pt-1">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                          AI Analysis
                        </p>
                        <p className="text-sm text-[hsl(var(--foreground-muted))] mt-1">
                          {analysis.templateReasoning}
                        </p>
                      </div>
                    </div>

                    {/* Extracted company details */}
                    {analysis.companyDetails?.companyName && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[hsl(var(--border))]">
                        {analysis.companyDetails.companyName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[hsl(var(--foreground-subtle))]" />
                            <span className="text-xs text-[hsl(var(--foreground-muted))]">
                              {analysis.companyDetails.companyName}
                            </span>
                          </div>
                        )}
                        {analysis.companyDetails.industry && (
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-[hsl(var(--foreground-subtle))]" />
                            <span className="text-xs text-[hsl(var(--foreground-muted))]">
                              {analysis.companyDetails.industry}
                            </span>
                          </div>
                        )}
                        {analysis.companyDetails.targetAudience && (
                          <div className="col-span-2 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-[hsl(var(--foreground-subtle))]" />
                            <span className="text-xs text-[hsl(var(--foreground-muted))]">
                              Audience: {analysis.companyDetails.targetAudience}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Editable fields */}
                <Card>
                  <CardContent className="space-y-4 pt-1">
                    <div>
                      <Label>Video Title</Label>
                      <Input
                        value={overrides.title}
                        onChange={(e) =>
                          setOverrides((p) => ({ ...p, title: e.target.value }))
                        }
                        maxLength={60}
                      />
                    </div>

                    <div>
                      <Label>Creative Brief</Label>
                      <Textarea
                        value={overrides.description}
                        onChange={(e) =>
                          setOverrides((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Template</Label>
                        <select
                          value={overrides.templateId}
                          onChange={(e) =>
                            setOverrides((p) => ({
                              ...p,
                              templateId: e.target.value,
                            }))
                          }
                          className="w-full h-10 px-3 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]"
                        >
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}{" "}
                              {t.id === analysis.recommendedTemplate
                                ? "(recommended)"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Scenes</Label>
                        <Input
                          type="number"
                          min={3}
                          max={15}
                          value={overrides.sceneCount}
                          onChange={(e) =>
                            setOverrides((p) => ({
                              ...p,
                              sceneCount: parseInt(e.target.value) || 6,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Advanced overrides toggle */}
                    <button
                      type="button"
                      onClick={() => setShowOverrides(!showOverrides)}
                      className="flex items-center gap-1.5 text-xs text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground-muted))] transition-colors"
                    >
                      {showOverrides ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      Advanced options
                    </button>

                    <AnimatePresence>
                      {showOverrides && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={overrides.useResearch}
                                onChange={(e) =>
                                  setOverrides((p) => ({
                                    ...p,
                                    useResearch: e.target.checked,
                                  }))
                                }
                                className="accent-[hsl(var(--accent))]"
                              />
                              <div>
                                <span className="text-sm text-[hsl(var(--foreground))]">
                                  Deep research mode
                                </span>
                                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                                  Also search the web for supporting data,
                                  citations, and case studies. Takes longer.
                                </p>
                              </div>
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {error && (
                  <p className="text-sm text-[hsl(var(--error))]">{error}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button onClick={handleGenerate}>
                    <Zap className="w-4 h-4" />
                    Generate Video
                  </Button>
                  <Button variant="ghost" onClick={handleReset}>
                    Start over
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: GENERATING                                           */}
            {/* ============================================================ */}
            {step === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={spring.gentle}
              >
                <Card>
                  <CardContent className="py-16 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[hsl(var(--accent))] animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        Generating your video...
                      </p>
                      <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                        {overrides.useResearch
                          ? "Researching, analyzing, and building scenes. This may take a minute."
                          : "Analyzing content and building scenes..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: DONE                                                 */}
            {/* ============================================================ */}
            {step === "done" && result && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={spring.gentle}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="py-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]">
                      <Film className="w-6 h-6 text-[hsl(var(--accent))]" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-[hsl(var(--foreground))]">
                        {result.video.title}
                      </p>
                      <p className="text-sm text-[hsl(var(--foreground-muted))] mt-1">
                        {result.scenes.length} scenes generated from URL
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        onClick={() =>
                          router.push(`/videos/${result.video.id}`)
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Editor
                      </Button>
                      <Button variant="secondary" onClick={handleReset}>
                        Generate another
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Scene list preview */}
                <Card>
                  <CardContent className="pt-1">
                    <p className="text-xs font-medium text-[hsl(var(--foreground-subtle))] uppercase tracking-wider mb-3">
                      Generated Scenes
                    </p>
                    <div className="space-y-2">
                      {(
                        result.scenes as {
                          scene_number: number;
                          name: string;
                          scene_type: string;
                        }[]
                      ).map((scene) => (
                        <div
                          key={scene.scene_number}
                          className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border))] last:border-0"
                        >
                          <span className="text-xs text-[hsl(var(--foreground-subtle))] w-5 text-right tabular-nums">
                            {scene.scene_number + 1}
                          </span>
                          <span className="text-sm text-[hsl(var(--foreground))] flex-1">
                            {scene.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {scene.scene_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

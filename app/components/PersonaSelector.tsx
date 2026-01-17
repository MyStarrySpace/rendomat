"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Info, Sparkles, Users, Monitor, CheckCircle, GraduationCap } from "lucide-react";

// Types for personas
interface PersonaBehaviorOption {
  id: string;
  label: string;
  prompt: string;
}

interface PersonaBehavior {
  label: string;
  default: string | string[];
  multi?: boolean;
  options: PersonaBehaviorOption[];
}

interface Persona {
  id: string;
  name: string;
  category: "content-type" | "platform";
  description: string;
  expertise: string;
  behaviors: Record<string, PersonaBehavior>;
  scenePreferences: Record<string, number>;
}

interface PersonaSelectorProps {
  selectedPersonas: string[];
  behaviorOverrides: Record<string, string | string[]>;
  onChange: (personas: string[], overrides: Record<string, string | string[]>) => void;
  compact?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "content-type": <Sparkles className="w-4 h-4" />,
  "platform": <Monitor className="w-4 h-4" />,
  "academic": <GraduationCap className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  "content-type": "Content Type",
  "platform": "Platform",
  "academic": "Academic & Scientific",
};

export default function PersonaSelector({
  selectedPersonas,
  behaviorOverrides,
  onChange,
  compact = false,
}: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Persona[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string>("");

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedPersonas.length > 0 && showPromptPreview) {
      fetchPromptPreview();
    }
  }, [selectedPersonas, behaviorOverrides, showPromptPreview]);

  async function loadPersonas() {
    try {
      const res = await fetch("http://localhost:8787/api/personas");
      if (!res.ok) throw new Error("Failed to fetch personas");
      const data = await res.json();
      setPersonas(data.personas);
      setGrouped(data.grouped);
    } catch (error) {
      console.error("Failed to load personas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPromptPreview() {
    try {
      const res = await fetch("http://localhost:8787/api/personas/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: selectedPersonas,
          behaviorOverrides,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch preview");
      const data = await res.json();
      setPromptPreview(data.prompt);
    } catch (error) {
      console.error("Failed to fetch prompt preview:", error);
    }
  }

  function togglePersona(personaId: string) {
    const isSelected = selectedPersonas.includes(personaId);
    let newPersonas: string[];

    if (isSelected) {
      // Remove persona
      newPersonas = selectedPersonas.filter((id) => id !== personaId);
      // Also remove its behavior overrides
      const persona = personas.find((p) => p.id === personaId);
      if (persona) {
        const newOverrides = { ...behaviorOverrides };
        for (const key of Object.keys(persona.behaviors)) {
          delete newOverrides[key];
        }
        onChange(newPersonas, newOverrides);
        return;
      }
    } else {
      // Add persona
      newPersonas = [...selectedPersonas, personaId];
    }

    onChange(newPersonas, behaviorOverrides);
  }

  function updateBehavior(key: string, value: string | string[]) {
    const newOverrides = {
      ...behaviorOverrides,
      [key]: value,
    };
    onChange(selectedPersonas, newOverrides);
  }

  function getBehaviorValue(behavior: PersonaBehavior, key: string): string | string[] {
    if (behaviorOverrides[key] !== undefined) {
      return behaviorOverrides[key];
    }
    return behavior.default;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const selectedPersonaObjects = personas.filter((p) =>
    selectedPersonas.includes(p.id)
  );

  // Collect all behaviors from selected personas
  const availableBehaviors: Record<string, { behavior: PersonaBehavior; persona: Persona }> = {};
  for (const persona of selectedPersonaObjects) {
    for (const [key, behavior] of Object.entries(persona.behaviors)) {
      availableBehaviors[key] = { behavior, persona };
    }
  }

  return (
    <div className="space-y-4">
      {/* Persona Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-purple-200">
          <Users className="w-4 h-4" />
          AI Personas
          <span className="text-purple-400 text-xs font-normal">(select one or more)</span>
        </label>

        {/* Categories */}
        {Object.entries(grouped).map(([category, categoryPersonas]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-purple-300">
              {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
              <span>{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryPersonas.map((persona) => {
                const isSelected = selectedPersonas.includes(persona.id);
                return (
                  <button
                    key={persona.id}
                    onClick={() => togglePersona(persona.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                      ${isSelected
                        ? "bg-purple-600 text-white border border-purple-500"
                        : "bg-white/5 text-purple-200 border border-purple-500/20 hover:border-purple-500/40 hover:bg-white/10"
                      }
                    `}
                    title={persona.description}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    {persona.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Behavior Customization */}
      {selectedPersonas.length > 0 && Object.keys(availableBehaviors).length > 0 && (
        <div className="space-y-3 pt-3 border-t border-purple-500/20">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200">
              <Sparkles className="w-4 h-4" />
              Behavior Customization
            </label>
            {!compact && (
              <button
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                {showPromptPreview ? "Hide" : "Preview"} Prompt
              </button>
            )}
          </div>

          {/* Behavior Dropdowns */}
          <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-2"}`}>
            {Object.entries(availableBehaviors).map(([key, { behavior, persona }]) => {
              const currentValue = getBehaviorValue(behavior, key);
              const isMulti = behavior.multi;

              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-purple-300 flex items-center justify-between">
                    <span>{behavior.label}</span>
                    <span className="text-purple-400 text-[10px]">
                      from {persona.name}
                    </span>
                  </label>
                  {isMulti ? (
                    // Multi-select as checkboxes
                    <div className="flex flex-wrap gap-1.5">
                      {behavior.options.map((option) => {
                        const values = Array.isArray(currentValue)
                          ? currentValue
                          : [currentValue];
                        const isChecked = values.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              const newValues = isChecked
                                ? values.filter((v) => v !== option.id)
                                : [...values, option.id];
                              updateBehavior(key, newValues);
                            }}
                            className={`
                              px-2 py-1 text-xs rounded transition-all
                              ${isChecked
                                ? "bg-purple-600/50 text-purple-100 border border-purple-500/50"
                                : "bg-white/5 text-purple-300 border border-purple-500/20 hover:border-purple-500/40"
                              }
                            `}
                            title={option.prompt}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Single-select dropdown
                    <select
                      value={currentValue as string}
                      onChange={(e) => updateBehavior(key, e.target.value)}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      {behavior.options.map((option) => (
                        <option key={option.id} value={option.id} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prompt Preview */}
          <AnimatePresence>
            {showPromptPreview && promptPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-black/30 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-300">
                      Generated Prompt Preview
                    </span>
                    <button
                      onClick={() => setShowPromptPreview(false)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-xs text-purple-200 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {promptPreview}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Selected Personas Summary */}
      {selectedPersonas.length > 0 && compact && (
        <div className="text-xs text-purple-400">
          Selected: {selectedPersonaObjects.map((p) => p.name).join(" + ")}
        </div>
      )}
    </div>
  );
}

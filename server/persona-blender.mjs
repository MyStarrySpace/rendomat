/**
 * Persona Blending System
 *
 * Combines multiple personas additively, merging their expertise,
 * behaviors, and scene preferences into a unified prompt.
 */

import { getPersona, getAllPersonas } from './personas.mjs';

/**
 * Blend multiple personas into a combined configuration
 * @param {string[]} selectedPersonaIds - Array of persona IDs to blend
 * @param {Object} behaviorOverrides - Object mapping behavior keys to selected option IDs
 * @returns {Object} Blended persona configuration
 */
export function blendPersonas(selectedPersonaIds, behaviorOverrides = {}) {
  // Get the persona objects
  const selectedPersonas = selectedPersonaIds
    .map(id => getPersona(id))
    .filter(p => p !== null);

  if (selectedPersonas.length === 0) {
    // Return default VSL expert if no valid personas selected
    const defaultPersona = getPersona('vsl-expert');
    return blendPersonas(['vsl-expert'], behaviorOverrides);
  }

  // 1. Combine expertise sections (additive)
  const combinedExpertise = selectedPersonas
    .map(p => `## ${p.name} Expertise\n${p.expertise}`)
    .join('\n\n');

  // 2. Merge behaviors (later personas override earlier ones for same keys)
  const mergedBehaviors = {};
  for (const persona of selectedPersonas) {
    for (const [key, behavior] of Object.entries(persona.behaviors)) {
      // Track which persona this behavior came from
      mergedBehaviors[key] = {
        ...behavior,
        _sourcePersona: persona.id
      };
    }
  }

  // 3. Apply user overrides and build final behavior prompts
  const finalBehaviors = {};
  const behaviorDescriptions = [];

  for (const [key, behavior] of Object.entries(mergedBehaviors)) {
    let selectedOptionIds;

    // Handle multi-select vs single-select behaviors
    if (behavior.multi) {
      // For multi-select, use override if provided, otherwise use default
      if (behaviorOverrides[key]) {
        selectedOptionIds = Array.isArray(behaviorOverrides[key])
          ? behaviorOverrides[key]
          : [behaviorOverrides[key]];
      } else {
        selectedOptionIds = Array.isArray(behavior.default)
          ? behavior.default
          : [behavior.default];
      }

      // Get prompts for all selected options
      const selectedOptions = selectedOptionIds
        .map(id => behavior.options.find(o => o.id === id))
        .filter(o => o);

      const prompts = selectedOptions.map(o => o.prompt);
      finalBehaviors[key] = {
        label: behavior.label,
        selectedIds: selectedOptionIds,
        prompts: prompts
      };

      if (prompts.length > 0) {
        behaviorDescriptions.push(`- ${behavior.label}: ${prompts.join(' ')}`);
      }
    } else {
      // Single-select behavior
      const selectedOptionId = behaviorOverrides[key] || behavior.default;
      const selectedOption = behavior.options.find(o => o.id === selectedOptionId);

      finalBehaviors[key] = {
        label: behavior.label,
        selectedId: selectedOptionId,
        prompt: selectedOption?.prompt || ''
      };

      if (selectedOption?.prompt) {
        behaviorDescriptions.push(`- ${behavior.label}: ${selectedOption.prompt}`);
      }
    }
  }

  // 4. Blend scene preferences (average weighted)
  const blendedScenePrefs = {};
  for (const persona of selectedPersonas) {
    for (const [scene, weight] of Object.entries(persona.scenePreferences)) {
      blendedScenePrefs[scene] = (blendedScenePrefs[scene] || 0) + weight;
    }
  }

  // Normalize so weights sum to 1
  const total = Object.values(blendedScenePrefs).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const scene of Object.keys(blendedScenePrefs)) {
      blendedScenePrefs[scene] = blendedScenePrefs[scene] / total;
    }
  }

  // Sort scene preferences by weight (descending)
  const sortedScenePrefs = Object.entries(blendedScenePrefs)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, val]) => {
      acc[key] = val;
      return acc;
    }, {});

  return {
    selectedPersonas: selectedPersonas.map(p => ({ id: p.id, name: p.name })),
    combinedExpertise,
    mergedBehaviors,
    finalBehaviors,
    behaviorDescriptions,
    blendedScenePrefs: sortedScenePrefs
  };
}

/**
 * Build a complete prompt from blended personas
 * @param {string[]} selectedPersonaIds - Array of persona IDs to blend
 * @param {Object} behaviorOverrides - Object mapping behavior keys to selected option IDs
 * @returns {string} Complete prompt string for AI generation
 */
export function buildPromptFromPersonas(selectedPersonaIds, behaviorOverrides = {}) {
  const blended = blendPersonas(selectedPersonaIds, behaviorOverrides);

  // Format scene preferences as percentages
  const scenePrefsFormatted = Object.entries(blended.blendedScenePrefs)
    .map(([scene, weight]) => `- ${scene}: ${Math.round(weight * 100)}%`)
    .join('\n');

  const prompt = `You are an AI video content creator with expertise from multiple specialists:

${blended.combinedExpertise}

BEHAVIOR GUIDELINES:
${blended.behaviorDescriptions.join('\n')}

SCENE TYPE PREFERENCES (blend of all personas):
Favor these scene types in roughly this distribution:
${scenePrefsFormatted}

These preferences are guidelines, not strict requirements. Vary scene types for visual interest while leaning toward the suggested distribution.`;

  return prompt;
}

/**
 * Preview what a blended prompt would look like
 * @param {string[]} selectedPersonaIds - Array of persona IDs
 * @param {Object} behaviorOverrides - Behavior overrides
 * @returns {Object} Preview information including prompt and metadata
 */
export function previewBlendedPrompt(selectedPersonaIds, behaviorOverrides = {}) {
  const blended = blendPersonas(selectedPersonaIds, behaviorOverrides);
  const prompt = buildPromptFromPersonas(selectedPersonaIds, behaviorOverrides);

  return {
    prompt,
    metadata: {
      personaCount: blended.selectedPersonas.length,
      personas: blended.selectedPersonas,
      behaviorCount: Object.keys(blended.finalBehaviors).length,
      behaviors: blended.finalBehaviors,
      scenePreferences: blended.blendedScenePrefs
    }
  };
}

/**
 * Get the effective personas for a video, considering inheritance
 * @param {Object} video - Video object with personas field
 * @param {Object} client - Client object with default_personas field
 * @returns {Object} Effective persona configuration
 */
export function getEffectivePersonas(video, client) {
  // Video-level personas override client defaults
  let personaIds = video?.personas;
  let behaviorOverrides = video?.behavior_overrides;
  let source = 'video';

  // If no video personas, inherit from client
  if (!personaIds || personaIds.length === 0) {
    personaIds = client?.default_personas;
    behaviorOverrides = client?.default_behavior_overrides;
    source = 'client';
  }

  // If still no personas, use default
  if (!personaIds || personaIds.length === 0) {
    personaIds = ['vsl-expert'];
    behaviorOverrides = {};
    source = 'default';
  }

  // Parse JSON strings if needed
  if (typeof personaIds === 'string') {
    try {
      personaIds = JSON.parse(personaIds);
    } catch {
      personaIds = ['vsl-expert'];
    }
  }

  if (typeof behaviorOverrides === 'string') {
    try {
      behaviorOverrides = JSON.parse(behaviorOverrides);
    } catch {
      behaviorOverrides = {};
    }
  }

  return {
    personaIds: personaIds || ['vsl-expert'],
    behaviorOverrides: behaviorOverrides || {},
    source
  };
}

/**
 * Validate persona IDs
 * @param {string[]} personaIds - Array of persona IDs to validate
 * @returns {Object} Validation result with valid and invalid IDs
 */
export function validatePersonaIds(personaIds) {
  const allPersonas = getAllPersonas();
  const validIds = new Set(allPersonas.map(p => p.id));

  const valid = [];
  const invalid = [];

  for (const id of personaIds) {
    if (validIds.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid, isValid: invalid.length === 0 };
}

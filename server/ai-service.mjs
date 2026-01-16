import Anthropic from '@anthropic-ai/sdk';
import { searchPhotos } from './pexels-service.mjs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate slides from a description using Claude
 * @param {string} description - The video description
 * @param {string} [templateId] - Optional template ID to guide structure
 * @param {number} [sceneCount] - Optional number of scenes to generate (if not provided, AI decides)
 * @param {object} [companyDetails] - Optional company-specific details for advanced mode
 */
export async function generateSlidesFromDescription(description, templateId = null, sceneCount = null, companyDetails = null) {
  // If sceneCount is not provided, let the AI decide based on content
  const sceneCountInstruction = sceneCount
    ? `Generate exactly ${sceneCount} compelling slides`
    : `Generate an appropriate number of slides (typically 6-9 for optimal conversion)`;

  const templateGuidance = templateId
    ? `Use the "${templateId}" template structure as a guide for pacing and scene types.`
    : `Design the optimal scene sequence and types for maximum impact.`;

  // Build company context if provided (advanced mode)
  const companyContext = companyDetails ? `
COMPANY CONTEXT (use this to personalize the VSL):
- Company Name: ${companyDetails.companyName || 'N/A'}
- Industry: ${companyDetails.industry || 'N/A'}
- Target Audience: ${companyDetails.targetAudience || 'N/A'}
- Key Pain Points: ${companyDetails.painPoints || 'N/A'}
- Unique Value Proposition: ${companyDetails.valueProposition || 'N/A'}
- Key Metrics/Proof Points: ${companyDetails.metrics || 'N/A'}
- Call-to-Action: ${companyDetails.cta || 'N/A'}
` : '';

  const prompt = `You are a professional B2B VSL (Video Sales Letter) script writer with expertise in conversion copywriting. ${sceneCountInstruction} for a video based on this description:

${description}
${companyContext}
${templateGuidance}

CRITICAL VSL FRAMEWORK - Follow the PAS (Problem-Agitate-Solution) structure:

**Scene 1 - HOOK (3-5 seconds):**
Use a pattern interrupt: surprising stat, provocative question, bold claim, or "If you're [specific qualifier]..."
Example hooks: "Did you know...", "3 mistakes that [target audience] makes...", "If you're still [pain point]..."

**Scenes 2-3 - PROBLEM IDENTIFICATION:**
Clearly articulate the specific pain points your target audience faces.
Use precise, factual language (avoid exaggeration - B2B buyers respond negatively to dramatization).
Make it feel personal and relevant to their role.

**Scenes 3-5 - AGITATION:**
Quantify the consequences with facts and realistic scenarios.
Show the compounding effect of inaction.
Address multiple stakeholder concerns (technical, financial, operational).
Use data visualization (charts/stats) to make impact tangible.

**Scenes 6-7 - SOLUTION:**
Present your solution as the logical answer to the established problem.
Focus on outcomes and benefits, not features.
Use social proof: customer quotes, case study metrics, industry recognition.

**Scene 8-9 - CALL TO ACTION:**
Clear, specific next step (book demo, start trial, download resource).
Remove friction and create urgency without being pushy.

SCENE TYPE SELECTION GUIDE:
- Hook: text-only or stats (grab attention fast)
- Problem: text-only or dual-images (relatability)
- Agitation: bar-chart, line-chart, stats (quantify pain)
- Solution: single-image, quote (build trust)
- Social Proof: stats, quote, grid-2x2 (credibility)
- CTA: text-only (clarity)

Return ONLY a valid JSON array of scenes with this structure:
[
  {
    "scene_number": 0,
    "name": "Hook - [Brief description]",
    "scene_type": "text-only",
    "data": {
      "title": "Pattern interrupt or curiosity gap",
      "body_text": "Expand on hook with specificity"
    }
  }
]

TECHNICAL REQUIREMENTS:
- Title: max 60 characters, punchy and benefit-focused
- Body text: max 150 characters, conversational and direct
- For image scenes: leave image URLs as empty strings
- For chart scenes: provide realistic data (labels array and data/datasets)
- For quote scenes: include "quote" and "author" fields
- For stats scenes: use "stats_text" with format "value | label" per line
- Vary scene types for visual interest (3+ different types minimum)

TONE: Professional but conversational. Fact-based but persuasive. Empathetic to pain points but confident in solution.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;

  // Extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const scenes = JSON.parse(jsonMatch[0]);

  // Auto-fetch stock images for image-based scenes
  await populateStockImages(scenes, description);

  return scenes;
}

/**
 * Automatically fetch and populate stock images for image-based scenes
 * @param {Array} scenes - The generated scenes array
 * @param {string} description - Original video description for context
 */
async function populateStockImages(scenes, description) {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) {
    console.log('[ai] Pexels API key not found - skipping stock image population');
    return;
  }

  // Scene types that need images
  const imageSceneTypes = ['single-image', 'dual-images', 'grid-2x2', 'image-gallery'];

  for (const scene of scenes) {
    if (!imageSceneTypes.includes(scene.scene_type)) {
      continue;
    }

    try {
      // Generate search query from scene title/description
      const searchQuery = generateImageSearchQuery(scene, description);

      // Determine how many images we need
      const imageCount = scene.scene_type === 'grid-2x2' ? 4 :
                        scene.scene_type === 'dual-images' ? 2 :
                        scene.scene_type === 'image-gallery' ? 4 : 1;

      // Search for images
      const results = await searchPhotos(searchQuery, imageCount, 1);

      if (results.photos && results.photos.length > 0) {
        // Populate image URLs in scene data
        if (scene.scene_type === 'single-image') {
          scene.data.image_url = results.photos[0].url;
        } else if (scene.scene_type === 'dual-images') {
          scene.data.image_url = results.photos[0]?.url || '';
          scene.data.image_url_2 = results.photos[1]?.url || results.photos[0]?.url || '';
        } else if (scene.scene_type === 'grid-2x2' || scene.scene_type === 'image-gallery') {
          scene.data.image_url = results.photos[0]?.url || '';
          scene.data.image_url_2 = results.photos[1]?.url || results.photos[0]?.url || '';
          scene.data.image_url_3 = results.photos[2]?.url || results.photos[0]?.url || '';
          scene.data.image_url_4 = results.photos[3]?.url || results.photos[0]?.url || '';
        }

        console.log(`[ai] Populated ${imageCount} stock image(s) for scene: ${scene.name}`);
      }
    } catch (error) {
      console.error(`[ai] Failed to fetch stock images for scene ${scene.name}:`, error.message);
      // Continue without images - user can add them manually later
    }
  }
}

/**
 * Generate a search query for stock images based on scene content
 * @param {Object} scene - The scene object
 * @param {string} videoDescription - Overall video description for context
 */
function generateImageSearchQuery(scene, videoDescription) {
  // Try to extract key terms from the scene name or title
  const sceneName = scene.name || '';
  const sceneTitle = scene.data?.title || '';

  // Remove common VSL prefixes and clean up
  const cleanName = sceneName
    .replace(/^(Hook|Problem|Agitation|Solution|CTA|Scene \d+)\s*[-:]\s*/i, '')
    .trim();

  // If we have a clean scene name, use it
  if (cleanName && cleanName.length > 3) {
    return cleanName;
  }

  // Otherwise use scene title
  if (sceneTitle && sceneTitle.length > 3) {
    return sceneTitle.substring(0, 50); // Limit length
  }

  // Fallback to generic terms based on video description
  const keywords = videoDescription.split(' ').slice(0, 3).join(' ');
  return keywords || 'business professional';
}

/**
 * Generate chart data from a description
 */
export async function generateChartData(description, chartType) {
  const prompt = `Generate sample data for a ${chartType} chart based on this description:

${description}

Return ONLY valid JSON with the following structure based on chart type:

For line-chart:
{
  "labels": ["Jan", "Feb", "Mar", ...],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [10, 20, 30, ...]
    }
  ]
}

For bar-chart (same as line-chart):
{
  "labels": ["Category 1", "Category 2", ...],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [10, 20, 30, ...]
    }
  ]
}

For pie-chart:
{
  "labels": ["Segment 1", "Segment 2", ...],
  "data": [30, 25, 20, 15, 10]
}

Make the data realistic and relevant to the description.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Improve scene content
 */
export async function improveSceneContent(sceneData) {
  const prompt = `Improve this VSL scene to be more compelling and persuasive:

Current content:
${JSON.stringify(sceneData, null, 2)}

Return ONLY valid JSON with the improved scene data. Keep the same structure but enhance the title and body_text to be more engaging. Maintain professional tone suitable for B2B sales.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Search for relevant data/facts for a topic
 */
export async function searchTopicData(topic) {
  const prompt = `Provide 5-7 key statistics, facts, or data points about: ${topic}

Focus on recent, credible information that would be useful in a B2B sales video.

Return ONLY valid JSON in this format:
{
  "stats": [
    {
      "value": "75%",
      "label": "Short description of what this stat means"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;

  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

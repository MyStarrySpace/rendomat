import Anthropic from '@anthropic-ai/sdk';
import { searchPhotos } from './pexels-service.mjs';
import { buildPromptFromPersonas, blendPersonas } from './persona-blender.mjs';
import { getTemplate } from './templates.mjs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate slides from a description using Claude
 * @param {string} description - The video description
 * @param {string} [templateId] - Optional template ID to guide structure
 * @param {number} [sceneCount] - Optional number of scenes to generate (if not provided, AI decides)
 * @param {object} [companyDetails] - Optional company-specific details for advanced mode
 * @param {string[]} [personas] - Optional array of persona IDs to use for generation
 * @param {object} [behaviorOverrides] - Optional behavior customizations
 */
export async function generateSlidesFromDescription(description, templateId = null, sceneCount = null, companyDetails = null, personas = null, behaviorOverrides = null) {
  // If sceneCount is not provided, let the AI decide based on content
  const sceneCountInstruction = sceneCount
    ? `Generate exactly ${sceneCount} compelling slides`
    : `Generate an appropriate number of slides (typically 6-9 for optimal conversion)`;

  let templateGuidance = `Design the optimal scene sequence and types for maximum impact.`;
  if (templateId) {
    const template = getTemplate(templateId);
    if (template && template.framework) {
      const sceneList = template.scenes
        .map(s => `${s.scene_number}. ${s.name} (${s.scene_type})`)
        .join('\n');
      templateGuidance = `Use the "${template.name}" framework (${template.framework}). Follow this scene structure:\n${sceneList}\nAdapt the content to match the user's description while keeping the framework's persuasion sequence.`;
    } else {
      templateGuidance = `Use the "${templateId}" template structure as a guide for pacing and scene types.`;
    }
  }

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

  // Build persona-based prompt or use default VSL expert
  const selectedPersonas = personas && personas.length > 0 ? personas : ['vsl-expert'];
  const personaPrompt = buildPromptFromPersonas(selectedPersonas, behaviorOverrides || {});
  const blendedConfig = blendPersonas(selectedPersonas, behaviorOverrides || {});

  // Build scene type guide from blended preferences
  const scenePrefsGuide = Object.entries(blendedConfig.blendedScenePrefs)
    .slice(0, 6) // Top 6 scene types
    .map(([scene, weight]) => `- ${scene}: ~${Math.round(weight * 100)}% of scenes`)
    .join('\n');

  const prompt = `${personaPrompt}

${sceneCountInstruction} for a video based on this description:

${description}
${companyContext}
${templateGuidance}

VIDEO STRUCTURE GUIDELINES:
- Start with a strong hook that grabs attention immediately
- Build your narrative following the behavior guidelines above
- End with a clear call-to-action
- Vary scene types for visual interest

RECOMMENDED SCENE TYPE DISTRIBUTION:
${scenePrefsGuide}

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
 * Generate LaTeX equation from a description
 */
export async function generateEquation(description) {
  const prompt = `Generate a LaTeX equation based on this description:

${description}

Return ONLY valid JSON with the following structure:
{
  "title": "Brief title for the equation/concept",
  "equation": "Main LaTeX equation (single equation)",
  "equations": ["Step 1 equation", "Step 2 equation", ...] (optional, for multi-step derivations),
  "description": "One sentence explaining what the equation represents"
}

IMPORTANT LaTeX syntax rules:
- Use ^ for superscript: x^2, e^{i\\pi}
- Use _ for subscript: x_n, a_{ij}
- Use \\frac{numerator}{denominator} for fractions
- Use \\sqrt{x} for square root, \\sqrt[n]{x} for nth root
- Use \\int for integral, \\sum for summation, \\prod for product
- Use \\alpha, \\beta, \\gamma, etc. for Greek letters
- Use \\pi, \\infty for pi and infinity
- Use \\cdot for multiplication dot, \\times for cross
- Use \\leq, \\geq, \\neq for comparison operators
- Use \\lim_{x \\to a} for limits
- Use \\partial for partial derivatives
- Use \\vec{x} or \\mathbf{x} for vectors
- Use \\left( and \\right) for auto-sizing parentheses

Make the equation accurate and properly formatted for KaTeX rendering.`;

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
/**
 * Analyze a public URL and extract structured information for video generation.
 * Scrapes the page, classifies the content type, extracts company details,
 * and recommends a template.
 * @param {string} url - The public URL to analyze
 * @returns {Promise<{description: string, companyDetails: object, recommendedTemplate: string, contentType: string, title: string}>}
 */
export async function analyzeUrl(url) {
  // Import fetchUrlContent from research-service
  const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));

  // Fetch URL content inline (mirrors research-service logic, avoids circular dep)
  let html = '';
  let pageTitle = url;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    pageTitle = titleMatch ? titleMatch[1].trim() : url;
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }

  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 40000);

  if (textContent.length < 50) {
    throw new Error('Page has too little content to analyze');
  }

  const { getAllTemplates } = await import('./templates.mjs');
  const templates = getAllTemplates();
  const templateList = templates.map(t => `- ${t.id}: ${t.name} (${t.category}, ${t.scene_count} scenes)`).join('\n');

  const prompt = `Analyze this web page and extract structured information for generating a video.

PAGE URL: ${url}
PAGE TITLE: ${pageTitle}

PAGE CONTENT:
${textContent}

AVAILABLE VIDEO TEMPLATES:
${templateList}

Analyze the page and return ONLY valid JSON:
{
  "title": "Short video title based on the page content (max 60 chars)",
  "description": "A 2-3 sentence description of what the video should cover, written as a creative brief for an AI video generator. Be specific about the key messages, value propositions, and target audience.",
  "content_type": "product|company|case-study|blog|landing-page|portfolio|documentation|other",
  "recommended_template": "template_id from the list above that best fits this content",
  "template_reasoning": "One sentence explaining why this template fits",
  "company_details": {
    "companyName": "Company or product name (extract from page)",
    "industry": "Industry or vertical",
    "targetAudience": "Who this is for",
    "painPoints": "Key problems addressed",
    "valueProposition": "Core value prop or unique selling point",
    "metrics": "Any specific numbers, stats, or proof points found",
    "cta": "Suggested call-to-action"
  },
  "scene_count": 6
}

GUIDELINES:
- For product pages: focus on features, benefits, and differentiators
- For case studies: focus on challenge, solution, results
- For company pages: focus on mission, services, and social proof
- For blog posts: focus on key insights and takeaways
- Pick a scene_count between 5 and 9 based on content density
- Choose the template that best matches the content's persuasion goal`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse URL analysis');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    title: analysis.title || pageTitle,
    description: analysis.description,
    contentType: analysis.content_type || 'other',
    recommendedTemplate: analysis.recommended_template || 'product-launch',
    templateReasoning: analysis.template_reasoning || '',
    companyDetails: analysis.company_details || {},
    sceneCount: analysis.scene_count || 6,
    sourceUrl: url,
    pageTitle,
  };
}

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

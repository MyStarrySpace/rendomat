import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate slides from a description using Claude
 * @param {string} description - The video description
 * @param {string} [templateId] - Optional template ID to guide structure
 * @param {number} [sceneCount] - Optional number of scenes to generate (if not provided, AI decides)
 */
export async function generateSlidesFromDescription(description, templateId = null, sceneCount = null) {
  // If sceneCount is not provided, let the AI decide based on content
  const sceneCountInstruction = sceneCount
    ? `Generate exactly ${sceneCount} compelling slides`
    : `Generate an appropriate number of slides (typically 5-10)`;

  const templateGuidance = templateId
    ? `Use the "${templateId}" template structure as a guide for pacing and scene types.`
    : `Design the optimal scene sequence and types for maximum impact.`;

  const prompt = `You are a professional VSL (Video Sales Letter) script writer. ${sceneCountInstruction} for a video based on this description:

${description}

${templateGuidance}

For each slide, provide:
1. A clear, concise title (max 60 characters)
2. Body text that elaborates on the title (max 150 characters)
3. Scene type - choose the most effective from:
   - Text Content: text-only, quote, stats
   - Visual Content: single-image, dual-images, grid-2x2, image-gallery
   - Data Visualization: line-chart, bar-chart, pie-chart, area-chart, progress-bars
4. Any relevant data for that scene type

Return ONLY a valid JSON array of scenes with this structure:
[
  {
    "scene_number": 0,
    "name": "Scene name",
    "scene_type": "text-only",
    "data": {
      "title": "Title text",
      "body_text": "Body text"
    }
  }
]

Important guidelines:
- For image-based scenes (single-image, dual-images, grid-2x2), leave image URLs as empty strings - they'll be added later
- For chart scenes, provide realistic sample data in the appropriate format (labels array and data/datasets)
- For quote scenes, include "quote" and "author" fields
- For stats scenes, include "stats_text" field with format: "value | label" on each line
- Vary scene types for visual interest - don't use only text-only scenes
- Follow VSL best practices: strong hook, clear problem/solution, social proof, and compelling CTA

Make the content engaging, persuasive, and professional.`;

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
  return scenes;
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

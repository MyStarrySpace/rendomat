import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Citation object structure
 * @typedef {Object} Citation
 * @property {string} source_url - URL where the information was found
 * @property {string} source_title - Title of the page/document
 * @property {string} exact_quote - The exact text from the source
 * @property {string} summary - Brief summary of what this citation supports
 * @property {number} confidence_score - 0-100 confidence that this is accurate
 * @property {string} retrieved_at - ISO timestamp of when this was retrieved
 */

/**
 * Case Study object structure
 * @typedef {Object} CaseStudy
 * @property {string} title - Case study title
 * @property {string} client_name - Client/company featured
 * @property {string} industry - Industry of the client
 * @property {string} challenge - The problem/challenge addressed
 * @property {string} solution - How it was solved
 * @property {string[]} results - Key results/metrics
 * @property {string} source_url - Where this was found
 * @property {number} relevance_score - 0-100 how relevant to current context
 */

/**
 * Research Result object structure
 * @typedef {Object} ResearchResult
 * @property {Citation[]} citations - Array of citations
 * @property {CaseStudy[]} case_studies - Extracted case studies
 * @property {Object[]} key_facts - Key facts with confidence scores
 * @property {string[]} search_queries_used - Queries used for research
 * @property {string} summary - Overall research summary
 */

/**
 * Fetch and parse content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<{content: string, title: string, error?: string}>}
 */
async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      return { content: '', title: '', error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Convert HTML to text (basic extraction)
    const textContent = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return { content: textContent.substring(0, 50000), title }; // Limit to 50k chars
  } catch (error) {
    return { content: '', title: '', error: error.message };
  }
}

/**
 * Search the web using a search engine API
 * For production, integrate with a real search API (Brave, Google, Bing, etc.)
 * @param {string} query - Search query
 * @returns {Promise<{results: Array<{url: string, title: string, snippet: string}>}>}
 */
async function searchWeb(query) {
  // Check if we have a search API configured
  const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
  const SERPER_API_KEY = process.env.SERPER_API_KEY;

  if (BRAVE_API_KEY) {
    try {
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          results: (data.web?.results || []).map(r => ({
            url: r.url,
            title: r.title,
            snippet: r.description,
          })),
        };
      }
    } catch (error) {
      console.error('[research] Brave search error:', error.message);
    }
  }

  if (SERPER_API_KEY) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          results: (data.organic || []).map(r => ({
            url: r.link,
            title: r.title,
            snippet: r.snippet,
          })),
        };
      }
    } catch (error) {
      console.error('[research] Serper search error:', error.message);
    }
  }

  // Return empty results if no search API is configured
  console.log('[research] No search API configured - web search disabled');
  return { results: [] };
}

/**
 * Extract case studies from portfolio/website content
 * @param {string} url - The URL that was fetched
 * @param {string} content - The page content
 * @param {string} companyContext - Context about what we're looking for
 * @returns {Promise<CaseStudy[]>}
 */
async function extractCaseStudies(url, content, companyContext) {
  if (!content || content.length < 100) {
    return [];
  }

  const prompt = `Analyze this website content and extract any case studies, success stories, or client testimonials.

WEBSITE URL: ${url}

CONTENT:
${content.substring(0, 30000)}

CONTEXT: ${companyContext}

Extract case studies in JSON format. For each case study found, include:
- title: The case study title
- client_name: The client/company featured (use "Unnamed Client" if not specified)
- industry: Industry of the client
- challenge: The problem or challenge addressed
- solution: How it was solved
- results: Array of key results/metrics (strings)
- relevance_score: 0-100 how relevant this is to the context

Return ONLY valid JSON array:
[
  {
    "title": "...",
    "client_name": "...",
    "industry": "...",
    "challenge": "...",
    "solution": "...",
    "results": ["Result 1", "Result 2"],
    "relevance_score": 85
  }
]

If no case studies are found, return an empty array: []

IMPORTANT: Only include actual case studies from the content. Do NOT make up or hallucinate case studies.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const caseStudies = JSON.parse(jsonMatch[0]);
      return caseStudies.map(cs => ({
        ...cs,
        source_url: url,
      }));
    }
  } catch (error) {
    console.error('[research] Case study extraction error:', error.message);
  }

  return [];
}

/**
 * Perform research with citations on a topic
 * @param {string} topic - The topic to research
 * @param {Object} options - Research options
 * @param {string} [options.portfolioUrl] - Portfolio URL to analyze
 * @param {string} [options.websiteUrl] - Website URL to analyze
 * @param {string} [options.companyName] - Company name for context
 * @param {string} [options.industry] - Industry for context
 * @param {boolean} [options.searchWeb] - Whether to search the web
 * @returns {Promise<ResearchResult>}
 */
export async function performResearch(topic, options = {}) {
  const {
    portfolioUrl,
    websiteUrl,
    companyName = '',
    industry = '',
    searchWeb: doWebSearch = true,
  } = options;

  const companyContext = `Company: ${companyName || 'Unknown'}, Industry: ${industry || 'Unknown'}, Topic: ${topic}`;

  const citations = [];
  const caseStudies = [];
  const searchQueriesUsed = [];
  const fetchedContent = [];

  // 1. Fetch portfolio URL if provided
  if (portfolioUrl) {
    console.log(`[research] Fetching portfolio: ${portfolioUrl}`);
    const { content, title, error } = await fetchUrlContent(portfolioUrl);

    if (content) {
      fetchedContent.push({ url: portfolioUrl, title, content });

      // Extract case studies from portfolio
      const portfolioCaseStudies = await extractCaseStudies(portfolioUrl, content, companyContext);
      caseStudies.push(...portfolioCaseStudies);
    } else if (error) {
      console.warn(`[research] Failed to fetch portfolio: ${error}`);
    }
  }

  // 2. Fetch website URL if provided
  if (websiteUrl && websiteUrl !== portfolioUrl) {
    console.log(`[research] Fetching website: ${websiteUrl}`);
    const { content, title, error } = await fetchUrlContent(websiteUrl);

    if (content) {
      fetchedContent.push({ url: websiteUrl, title, content });
    } else if (error) {
      console.warn(`[research] Failed to fetch website: ${error}`);
    }
  }

  // 3. Perform web search if enabled
  if (doWebSearch) {
    // Generate search queries
    const searchQueries = [
      `${topic} statistics data`,
      `${topic} case study`,
      companyName ? `${companyName} ${topic}` : null,
      industry ? `${industry} ${topic} trends` : null,
    ].filter(Boolean);

    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries
      searchQueriesUsed.push(query);
      const { results } = await searchWeb(query);

      // Fetch top results
      for (const result of results.slice(0, 3)) {
        const { content, title, error } = await fetchUrlContent(result.url);
        if (content) {
          fetchedContent.push({ url: result.url, title, content, snippet: result.snippet });
        }
      }
    }
  }

  // 4. Analyze all fetched content and extract citations
  if (fetchedContent.length > 0) {
    const analysisPrompt = `Analyze these web sources and extract relevant information with citations for the topic: "${topic}"

CONTEXT: ${companyContext}

SOURCES:
${fetchedContent.map((fc, i) => `
--- SOURCE ${i + 1} ---
URL: ${fc.url}
TITLE: ${fc.title}
SNIPPET: ${fc.snippet || 'N/A'}
CONTENT (truncated):
${fc.content.substring(0, 8000)}
`).join('\n')}

Extract relevant facts and quotes with citations. For each piece of information:
1. Find EXACT quotes from the sources (copy verbatim)
2. Assign a confidence score (0-100) based on source reliability and how directly the information is stated
3. Summarize what the citation supports

Return ONLY valid JSON:
{
  "citations": [
    {
      "source_url": "https://...",
      "source_title": "Page Title",
      "exact_quote": "The exact text from the source, word for word",
      "summary": "Brief summary of what this supports",
      "confidence_score": 85
    }
  ],
  "key_facts": [
    {
      "fact": "Statement of fact",
      "supporting_citation_index": 0,
      "confidence_score": 90
    }
  ],
  "summary": "Overall research summary in 2-3 sentences"
}

CRITICAL RULES:
- Only include EXACT quotes that appear verbatim in the source content
- If you cannot find an exact quote, set confidence_score below 50
- Do NOT make up or hallucinate quotes
- Higher confidence = more reliable source + more direct statement
- Include confidence_score reasoning in your assessment`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{ role: 'user', content: analysisPrompt }],
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);

        // Add retrieved timestamp to citations
        const now = new Date().toISOString();
        citations.push(...(analysis.citations || []).map(c => ({
          ...c,
          retrieved_at: now,
        })));

        return {
          citations,
          case_studies: caseStudies,
          key_facts: analysis.key_facts || [],
          search_queries_used: searchQueriesUsed,
          summary: analysis.summary || '',
        };
      }
    } catch (error) {
      console.error('[research] Analysis error:', error.message);
    }
  }

  // Return what we have even if analysis failed
  return {
    citations,
    case_studies: caseStudies,
    key_facts: [],
    search_queries_used: searchQueriesUsed,
    summary: 'Research completed with limited results.',
  };
}

/**
 * Generate slides with research and citations
 * @param {string} description - Video description
 * @param {Object} options - Generation options
 * @param {ResearchResult} options.research - Research results to incorporate
 * @param {string[]} [options.personas] - Persona IDs
 * @param {Object} [options.behaviorOverrides] - Behavior customizations
 * @param {number} [options.sceneCount] - Number of scenes
 * @returns {Promise<{scenes: Array, citations_used: Citation[]}>}
 */
export async function generateSlidesWithResearch(description, options = {}) {
  const {
    research,
    personas = ['vsl-expert'],
    behaviorOverrides = {},
    sceneCount = null,
    companyDetails = null,
  } = options;

  // Import persona blender
  const { buildPromptFromPersonas, blendPersonas } = await import('./persona-blender.mjs');

  const personaPrompt = buildPromptFromPersonas(personas, behaviorOverrides);
  const blendedConfig = blendPersonas(personas, behaviorOverrides);

  const scenePrefsGuide = Object.entries(blendedConfig.blendedScenePrefs)
    .slice(0, 6)
    .map(([scene, weight]) => `- ${scene}: ~${Math.round(weight * 100)}% of scenes`)
    .join('\n');

  const sceneCountInstruction = sceneCount
    ? `Generate exactly ${sceneCount} compelling slides`
    : `Generate an appropriate number of slides (typically 6-9 for optimal conversion)`;

  const companyContext = companyDetails ? `
COMPANY CONTEXT:
- Company Name: ${companyDetails.companyName || 'N/A'}
- Industry: ${companyDetails.industry || 'N/A'}
- Target Audience: ${companyDetails.targetAudience || 'N/A'}
- Key Pain Points: ${companyDetails.painPoints || 'N/A'}
- Unique Value Proposition: ${companyDetails.valueProposition || 'N/A'}
` : '';

  // Build research context
  const researchContext = research ? `
RESEARCH DATA (use these facts with citations):

${research.case_studies?.length ? `
CASE STUDIES FOUND:
${research.case_studies.map((cs, i) => `
[Case Study ${i + 1}] ${cs.title}
- Client: ${cs.client_name} (${cs.industry})
- Challenge: ${cs.challenge}
- Solution: ${cs.solution}
- Results: ${cs.results.join(', ')}
- Source: ${cs.source_url}
- Relevance: ${cs.relevance_score}%
`).join('')}
` : ''}

${research.citations?.length ? `
VERIFIED CITATIONS (use these exact quotes):
${research.citations.map((c, i) => `
[Citation ${i + 1}] (Confidence: ${c.confidence_score}%)
Source: ${c.source_title} - ${c.source_url}
Quote: "${c.exact_quote}"
Summary: ${c.summary}
`).join('')}
` : ''}

${research.key_facts?.length ? `
KEY FACTS:
${research.key_facts.map((f, i) => `- ${f.fact} (Confidence: ${f.confidence_score}%)`).join('\n')}
` : ''}

RESEARCH SUMMARY: ${research.summary || 'No summary available'}
` : '';

  const prompt = `${personaPrompt}

${sceneCountInstruction} for a video based on this description:

${description}
${companyContext}
${researchContext}

VIDEO STRUCTURE GUIDELINES:
- Start with a strong hook that grabs attention immediately
- BUILD CREDIBILITY: Use the case studies and citations provided to support claims
- When using statistics or claims, reference the citation number
- End with a clear call-to-action

RECOMMENDED SCENE TYPE DISTRIBUTION:
${scenePrefsGuide}

Return ONLY valid JSON with this structure:
{
  "scenes": [
    {
      "scene_number": 0,
      "name": "Hook - [Brief description]",
      "scene_type": "text-only",
      "data": {
        "title": "Pattern interrupt or curiosity gap",
        "body_text": "Expand on hook with specificity"
      },
      "citations_used": [] // Array of citation indices used in this scene
    }
  ],
  "citations_used_summary": [
    {
      "citation_index": 0,
      "used_in_scenes": [1, 3],
      "how_used": "Brief description of how this citation was used"
    }
  ]
}

TECHNICAL REQUIREMENTS:
- Title: max 60 characters, punchy and benefit-focused
- Body text: max 150 characters, conversational and direct
- When using a statistic or claim from research, add the citation index to citations_used
- For image scenes: leave image URLs as empty strings
- For chart scenes: provide realistic data
- For quote scenes: include "quote" and "author" fields
- For stats scenes: use "stats_text" with format "value | label" per line

CRITICAL: Only use facts and statistics that come from the research data provided. If making a claim not in the research, mark it clearly.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const result = JSON.parse(jsonMatch[0]);

  // Attach full citation objects to the result
  const citationsUsed = [];
  if (research?.citations && result.citations_used_summary) {
    for (const usage of result.citations_used_summary) {
      if (research.citations[usage.citation_index]) {
        citationsUsed.push({
          ...research.citations[usage.citation_index],
          used_in_scenes: usage.used_in_scenes,
          how_used: usage.how_used,
        });
      }
    }
  }

  // Auto-fetch stock images for image scenes
  const { searchPhotos } = await import('./pexels-service.mjs');
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (PEXELS_API_KEY) {
    const imageSceneTypes = ['single-image', 'dual-images', 'grid-2x2', 'image-gallery'];

    for (const scene of result.scenes) {
      if (imageSceneTypes.includes(scene.scene_type)) {
        try {
          const searchQuery = scene.data?.title || scene.name || 'business';
          const imageCount = scene.scene_type === 'grid-2x2' ? 4 :
                            scene.scene_type === 'dual-images' ? 2 :
                            scene.scene_type === 'image-gallery' ? 4 : 1;

          const results = await searchPhotos(searchQuery, imageCount, 1);

          if (results.photos?.length) {
            scene.data.image_url = results.photos[0]?.url || '';
            if (imageCount > 1) scene.data.image_url_2 = results.photos[1]?.url || results.photos[0]?.url || '';
            if (imageCount > 2) scene.data.image_url_3 = results.photos[2]?.url || results.photos[0]?.url || '';
            if (imageCount > 3) scene.data.image_url_4 = results.photos[3]?.url || results.photos[0]?.url || '';
          }
        } catch (error) {
          console.error(`[research] Failed to fetch images for scene: ${error.message}`);
        }
      }
    }
  }

  return {
    scenes: result.scenes,
    citations_used: citationsUsed,
    case_studies_used: research?.case_studies || [],
    research_summary: research?.summary || '',
  };
}

/**
 * Verify a claim against sources
 * @param {string} claim - The claim to verify
 * @param {string[]} sourceUrls - URLs to check against
 * @returns {Promise<{verified: boolean, confidence: number, supporting_quote?: string, source_url?: string}>}
 */
export async function verifyClaim(claim, sourceUrls) {
  const fetchedContent = [];

  for (const url of sourceUrls.slice(0, 5)) {
    const { content, title } = await fetchUrlContent(url);
    if (content) {
      fetchedContent.push({ url, title, content: content.substring(0, 10000) });
    }
  }

  if (fetchedContent.length === 0) {
    return { verified: false, confidence: 0, error: 'Could not fetch any sources' };
  }

  const prompt = `Verify this claim against the provided sources:

CLAIM: "${claim}"

SOURCES:
${fetchedContent.map((fc, i) => `
--- SOURCE ${i + 1} ---
URL: ${fc.url}
TITLE: ${fc.title}
CONTENT:
${fc.content}
`).join('\n')}

Determine if the claim is supported by any of these sources.

Return ONLY valid JSON:
{
  "verified": true/false,
  "confidence": 0-100,
  "supporting_quote": "Exact quote that supports this (if verified)",
  "source_url": "URL of supporting source (if verified)",
  "explanation": "Brief explanation of verification result"
}

RULES:
- Only mark verified=true if you find clear supporting evidence
- confidence should reflect how directly the sources support the claim
- supporting_quote must be an EXACT quote from the source`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[research] Verification error:', error.message);
  }

  return { verified: false, confidence: 0, error: 'Verification failed' };
}

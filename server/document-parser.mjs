/**
 * Document Parser for Video Seeds
 *
 * Parses markdown and Word documents to extract content structure
 * and generate video scene seeds for explainer videos.
 */

import mammoth from 'mammoth';
import { marked } from 'marked';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

// =====================
// Document Types
// =====================

/**
 * @typedef {Object} DocumentSection
 * @property {string} title - Section heading
 * @property {number} level - Heading level (1-6)
 * @property {string} content - Section content
 * @property {string[]} bullets - Bullet points in this section
 * @property {DocumentSection[]} children - Nested sections
 */

/**
 * @typedef {Object} ParsedDocument
 * @property {string} title - Document title
 * @property {Object} metadata - Frontmatter/metadata
 * @property {string} summary - Document summary/intro
 * @property {DocumentSection[]} sections - Document sections
 * @property {string[]} keywords - Extracted keywords
 * @property {Object} stats - Document statistics
 */

/**
 * @typedef {Object} VideoSeed
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {SceneSeed[]} scenes - Generated scene seeds
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} SceneSeed
 * @property {string} type - Scene type (intro, content, quote, stats, outro)
 * @property {string} title - Scene title/heading
 * @property {string[]} content - Main content points
 * @property {string} narration - Suggested narration text
 * @property {number} estimatedDuration - Estimated duration in seconds
 * @property {Object} suggestedVisuals - Visual suggestions
 */

// =====================
// Markdown Parser
// =====================

/**
 * Parse a markdown file and extract structure
 * @param {string} filePath - Path to markdown file
 * @returns {Promise<ParsedDocument>}
 */
export async function parseMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseMarkdownContent(content);
}

/**
 * Parse markdown content string
 * @param {string} content - Markdown content
 * @returns {ParsedDocument}
 */
export function parseMarkdownContent(content) {
  // Parse frontmatter
  const { data: metadata, content: body } = matter(content);

  // Parse to tokens
  const tokens = marked.lexer(body);

  // Extract document structure
  const sections = [];
  let currentSection = null;
  let title = metadata.title || '';
  let summary = '';

  for (const token of tokens) {
    if (token.type === 'heading') {
      // First h1 becomes the title if not in frontmatter
      if (token.depth === 1 && !title) {
        title = token.text;
        continue;
      }

      // Create new section
      const section = {
        title: token.text,
        level: token.depth,
        content: '',
        bullets: [],
        children: [],
      };

      if (token.depth === 2) {
        sections.push(section);
        currentSection = section;
      } else if (currentSection && token.depth > 2) {
        currentSection.children.push(section);
      }
    } else if (token.type === 'paragraph') {
      const text = token.text;
      if (!summary && !currentSection) {
        // First paragraph before any section is the summary
        summary = text;
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? '\n\n' : '') + text;
      }
    } else if (token.type === 'list') {
      if (currentSection) {
        const bullets = token.items.map(item => {
          // Extract text from list item tokens
          return item.tokens
            .filter(t => t.type === 'text' || t.type === 'paragraph')
            .map(t => t.text)
            .join(' ');
        });
        currentSection.bullets.push(...bullets);
      }
    } else if (token.type === 'blockquote') {
      if (currentSection) {
        const quoteText = token.tokens
          .filter(t => t.type === 'paragraph')
          .map(t => t.text)
          .join(' ');
        currentSection.content += (currentSection.content ? '\n\n' : '') + `"${quoteText}"`;
      }
    }
  }

  // Extract keywords from content
  const keywords = extractKeywords(body);

  // Calculate stats
  const words = body.split(/\s+/).filter(w => w.length > 0);
  const stats = {
    wordCount: words.length,
    sectionCount: sections.length,
    bulletCount: sections.reduce((sum, s) => sum + s.bullets.length, 0),
    estimatedReadTime: Math.ceil(words.length / 200), // 200 wpm
  };

  return {
    title,
    metadata,
    summary,
    sections,
    keywords,
    stats,
  };
}

// =====================
// Word Document Parser
// =====================

/**
 * Parse a Word document (.docx) and extract structure
 * @param {string} filePath - Path to .docx file
 * @returns {Promise<ParsedDocument>}
 */
export async function parseDocx(filePath) {
  const buffer = await fs.readFile(filePath);
  return parseDocxBuffer(buffer);
}

/**
 * Parse a Word document buffer
 * @param {Buffer} buffer - Document buffer
 * @returns {Promise<ParsedDocument>}
 */
export async function parseDocxBuffer(buffer) {
  // Extract text with style information
  const result = await mammoth.convertToHtml(buffer, {
    styleMap: [
      "p[style-name='Title'] => h1:fresh",
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
    ]
  });

  const html = result.value;

  // Also get raw text for stats
  const textResult = await mammoth.extractRawText(buffer);
  const rawText = textResult.value;

  // Parse HTML to extract structure
  const sections = [];
  let currentSection = null;
  let title = '';
  let summary = '';

  // Simple HTML parsing (for more robust parsing, consider cheerio)
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    title = h1Match[1].trim();
  }

  // Extract sections by h2 tags
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
  const parts = html.split(h2Regex);

  // First part before any h2 is intro/summary
  if (parts[0]) {
    const introText = stripHtml(parts[0]);
    if (introText && !title) {
      // Try to extract title from first paragraph
      const lines = introText.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        title = lines[0];
        summary = lines.slice(1).join(' ').trim();
      }
    } else {
      summary = introText;
    }
  }

  // Process sections
  for (let i = 1; i < parts.length; i += 2) {
    const sectionTitle = parts[i]?.trim() || `Section ${Math.floor(i / 2) + 1}`;
    const sectionContent = parts[i + 1] || '';

    const section = {
      title: sectionTitle,
      level: 2,
      content: '',
      bullets: [],
      children: [],
    };

    // Extract content and bullets
    const paragraphs = sectionContent.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
    section.content = paragraphs
      .map(p => stripHtml(p))
      .filter(t => t.length > 0)
      .join('\n\n');

    // Extract bullet points
    const listItems = sectionContent.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
    section.bullets = listItems
      .map(li => stripHtml(li))
      .filter(t => t.length > 0);

    sections.push(section);
  }

  // Extract keywords
  const keywords = extractKeywords(rawText);

  // Calculate stats
  const words = rawText.split(/\s+/).filter(w => w.length > 0);
  const stats = {
    wordCount: words.length,
    sectionCount: sections.length,
    bulletCount: sections.reduce((sum, s) => sum + s.bullets.length, 0),
    estimatedReadTime: Math.ceil(words.length / 200),
  };

  return {
    title,
    metadata: {},
    summary,
    sections,
    keywords,
    stats,
  };
}

// =====================
// Video Seed Generation
// =====================

/**
 * Generate video seeds from a parsed document
 * @param {ParsedDocument} doc - Parsed document
 * @param {Object} options - Generation options
 * @returns {VideoSeed}
 */
export function generateVideoSeed(doc, options = {}) {
  const {
    maxScenes = 10,
    targetDuration = 120, // 2 minutes default
    includeIntro = true,
    includeOutro = true,
    style = 'explainer', // explainer, presentation, tutorial
  } = options;

  const scenes = [];
  const secondsPerScene = targetDuration / Math.min(doc.sections.length + 2, maxScenes);

  // Intro scene
  if (includeIntro) {
    scenes.push({
      type: 'intro',
      title: doc.title,
      content: [doc.summary || 'Introduction'],
      narration: generateIntroNarration(doc, style),
      estimatedDuration: Math.max(5, secondsPerScene),
      suggestedVisuals: {
        background: 'gradient',
        animation: 'zoom-in',
        elements: ['title-text', 'subtitle'],
      },
    });
  }

  // Content scenes from sections
  const availableSlots = maxScenes - (includeIntro ? 1 : 0) - (includeOutro ? 1 : 0);
  const sectionsToInclude = prioritizeSections(doc.sections, availableSlots);

  for (const section of sectionsToInclude) {
    const sceneType = determineSceneType(section);

    scenes.push({
      type: sceneType,
      title: section.title,
      content: section.bullets.length > 0
        ? section.bullets.slice(0, 4)
        : [section.content.split('\n')[0] || section.title],
      narration: generateSectionNarration(section, style),
      estimatedDuration: secondsPerScene,
      suggestedVisuals: getSuggestedVisuals(sceneType, section),
    });
  }

  // Outro scene
  if (includeOutro) {
    scenes.push({
      type: 'outro',
      title: 'Summary',
      content: generateSummaryPoints(doc),
      narration: generateOutroNarration(doc, style),
      estimatedDuration: Math.max(5, secondsPerScene),
      suggestedVisuals: {
        background: 'gradient',
        animation: 'fade-out',
        elements: ['call-to-action', 'logo'],
      },
    });
  }

  return {
    title: doc.title,
    description: doc.summary,
    scenes,
    metadata: {
      sourceWordCount: doc.stats.wordCount,
      estimatedDuration: scenes.reduce((sum, s) => sum + s.estimatedDuration, 0),
      keywords: doc.keywords,
      style,
    },
  };
}

/**
 * Prioritize sections for video inclusion
 * @param {DocumentSection[]} sections
 * @param {number} maxCount
 * @returns {DocumentSection[]}
 */
function prioritizeSections(sections, maxCount) {
  if (sections.length <= maxCount) {
    return sections;
  }

  // Score sections by importance indicators
  const scored = sections.map(section => {
    let score = 0;

    // More bullets = more important
    score += section.bullets.length * 2;

    // Longer content = more important
    score += Math.min(section.content.length / 100, 5);

    // Keywords in title boost importance
    const importanceKeywords = ['key', 'important', 'critical', 'main', 'core', 'essential'];
    if (importanceKeywords.some(kw => section.title.toLowerCase().includes(kw))) {
      score += 5;
    }

    return { section, score };
  });

  // Sort by score and take top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(s => s.section);
}

/**
 * Determine scene type based on section content
 * @param {DocumentSection} section
 * @returns {string}
 */
function determineSceneType(section) {
  const content = (section.content + ' ' + section.bullets.join(' ')).toLowerCase();

  // Check for statistics/numbers
  if (/\d+%|\d+ (percent|million|billion|thousand)|\$\d+/.test(content)) {
    return 'stats';
  }

  // Check for quotes
  if (section.content.includes('"') && section.content.includes('"')) {
    return 'quote';
  }

  // Check for steps/process
  if (/step \d|phase \d|first|second|third|finally/i.test(content)) {
    return 'process';
  }

  // Check for comparison
  if (/vs\.?|versus|compared to|difference between/i.test(content)) {
    return 'comparison';
  }

  // Default to content scene
  return section.bullets.length >= 3 ? 'bullet-list' : 'text-only';
}

/**
 * Get suggested visuals for a scene type
 * @param {string} sceneType
 * @param {DocumentSection} section
 * @returns {Object}
 */
function getSuggestedVisuals(sceneType, section) {
  const baseVisuals = {
    background: 'solid',
    animation: 'fade-in',
    elements: [],
  };

  switch (sceneType) {
    case 'stats':
      return {
        ...baseVisuals,
        elements: ['animated-number', 'chart', 'icon'],
        animation: 'count-up',
      };

    case 'quote':
      return {
        ...baseVisuals,
        background: 'gradient',
        elements: ['quote-marks', 'attribution'],
        animation: 'slide-in',
      };

    case 'process':
      return {
        ...baseVisuals,
        elements: ['step-indicator', 'progress-bar', 'icon'],
        animation: 'sequential',
      };

    case 'comparison':
      return {
        ...baseVisuals,
        elements: ['split-screen', 'vs-graphic'],
        animation: 'slide-from-sides',
      };

    case 'bullet-list':
      return {
        ...baseVisuals,
        elements: ['bullet-icons', 'staggered-text'],
        animation: 'stagger-in',
      };

    default:
      return {
        ...baseVisuals,
        elements: ['heading', 'body-text'],
        animation: 'fade-in',
      };
  }
}

// =====================
// Narration Generation
// =====================

/**
 * Generate intro narration
 * @param {ParsedDocument} doc
 * @param {string} style
 * @returns {string}
 */
function generateIntroNarration(doc, style) {
  if (style === 'tutorial') {
    return `In this tutorial, we'll explore ${doc.title}. ${doc.summary || ''}`;
  }
  if (style === 'presentation') {
    return `Today, we're discussing ${doc.title}. ${doc.summary || ''}`;
  }
  // explainer (default)
  return `Let's break down ${doc.title}. ${doc.summary || ''}`;
}

/**
 * Generate section narration
 * @param {DocumentSection} section
 * @param {string} style
 * @returns {string}
 */
function generateSectionNarration(section, style) {
  const intro = section.title + '. ';

  if (section.bullets.length > 0) {
    return intro + section.bullets.slice(0, 3).join('. ') + '.';
  }

  // Use first 2-3 sentences of content
  const sentences = section.content.split(/[.!?]+/).filter(s => s.trim());
  return intro + sentences.slice(0, 2).join('. ').trim() + '.';
}

/**
 * Generate outro narration
 * @param {ParsedDocument} doc
 * @param {string} style
 * @returns {string}
 */
function generateOutroNarration(doc, style) {
  const keyPoints = generateSummaryPoints(doc);

  if (style === 'tutorial') {
    return `To summarize: ${keyPoints.join('. ')}. Now you're ready to get started!`;
  }
  if (style === 'presentation') {
    return `In conclusion: ${keyPoints.join('. ')}. Thank you for your attention.`;
  }
  return `Key takeaways: ${keyPoints.join('. ')}. Thanks for watching!`;
}

/**
 * Generate summary points from document
 * @param {ParsedDocument} doc
 * @returns {string[]}
 */
function generateSummaryPoints(doc) {
  const points = [];

  // Take first bullet from each major section
  for (const section of doc.sections.slice(0, 4)) {
    if (section.bullets.length > 0) {
      points.push(section.bullets[0]);
    } else if (section.content) {
      const firstSentence = section.content.split(/[.!?]/)[0];
      if (firstSentence) {
        points.push(firstSentence.trim());
      }
    }
  }

  return points.slice(0, 3);
}

// =====================
// Utility Functions
// =====================

/**
 * Strip HTML tags from string
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Extract keywords from text
 * @param {string} text
 * @returns {string[]}
 */
function extractKeywords(text) {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'you', 'they',
    'he', 'she', 'i', 'my', 'your', 'our', 'their', 'his', 'her',
  ]);

  // Extract words and count frequencies
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Parse a document file (auto-detect type)
 * @param {string} filePath - Path to document
 * @returns {Promise<ParsedDocument>}
 */
export async function parseDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.md':
    case '.markdown':
      return parseMarkdown(filePath);
    case '.docx':
      return parseDocx(filePath);
    case '.txt':
      const content = await fs.readFile(filePath, 'utf-8');
      // Treat plain text as markdown
      return parseMarkdownContent(content);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

// =====================
// Export
// =====================

export default {
  parseMarkdown,
  parseMarkdownContent,
  parseDocx,
  parseDocxBuffer,
  parseDocument,
  generateVideoSeed,
};

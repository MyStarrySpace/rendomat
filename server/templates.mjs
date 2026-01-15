// Video templates with scene definitions

export const VIDEO_TEMPLATES = {
  'ultrahuman-vsl': {
    name: 'Ultrahuman VSL',
    description: 'Professional B2B VSL with 8 scenes',
    composition_id: 'UltrahumanVSL',
    duration_seconds: 109,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Cold Open',
        start_frame: 0,
        end_frame: 150, // 5 seconds - minimal
        parameters: {
          title: 'Opening Hook',
          body_text: 'When health data multiplies, design changes.',
          style: 'minimal'
        }
      },
      {
        scene_number: 1,
        name: 'Respect the Ambition',
        start_frame: 150,
        end_frame: 510, // 12 seconds
        parameters: {
          title: 'The Vision',
          body_text: "You're building something ambitious in health tech.",
          style: 'confident'
        }
      },
      {
        scene_number: 2,
        name: 'The Inflection Point',
        start_frame: 510,
        end_frame: 960, // 15 seconds
        parameters: {
          title: 'The Challenge',
          body_text: 'Your users now have multiple data streams to track.',
          style: 'tension'
        }
      },
      {
        scene_number: 3,
        name: 'Naming the Hidden Problem',
        start_frame: 960,
        end_frame: 1560, // 20 seconds - content heavy
        parameters: {
          title: 'The Problem',
          body_text: 'But scattered dashboards create cognitive overload.',
          style: 'problem'
        }
      },
      {
        scene_number: 4,
        name: 'Dashboard-of-Dashboards',
        start_frame: 1560,
        end_frame: 2010, // 15 seconds
        parameters: {
          title: 'The Solution',
          body_text: 'Introducing: The unified health intelligence platform.',
          style: 'solution'
        }
      },
      {
        scene_number: 5,
        name: 'Reframing the Opportunity',
        start_frame: 2010,
        end_frame: 2610, // 20 seconds - content heavy
        parameters: {
          title: 'The Opportunity',
          body_text: 'Turn data complexity into competitive advantage.',
          style: 'opportunity'
        }
      },
      {
        scene_number: 6,
        name: "Why You're Reaching Out",
        start_frame: 2610,
        end_frame: 3060, // 15 seconds
        parameters: {
          title: 'The Partnership',
          body_text: 'We help health tech companies scale their design systems.',
          style: 'partnership'
        }
      },
      {
        scene_number: 7,
        name: 'Soft Close',
        start_frame: 3060,
        end_frame: 3270, // 7 seconds - minimal CTA
        parameters: {
          title: 'The Call to Action',
          body_text: "Let's talk about your roadmap.",
          style: 'close'
        }
      }
    ]
  },

  'product-launch': {
    name: 'Product Launch VSL',
    description: 'Standard product launch video with 5 scenes',
    composition_id: 'ProductLaunchVSL',
    duration_seconds: 75,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook',
        start_frame: 0,
        end_frame: 210, // 7 seconds - minimal hook
        parameters: {
          title: 'The Hook',
          body_text: 'Introducing [Product Name]',
          image_url: null,
          style: 'bold'
        }
      },
      {
        scene_number: 1,
        name: 'Problem',
        start_frame: 210,
        end_frame: 660, // 15 seconds
        parameters: {
          title: 'The Problem',
          body_text: 'Are you struggling with [pain point]?',
          image_url: null,
          style: 'empathy'
        }
      },
      {
        scene_number: 2,
        name: 'Solution',
        start_frame: 660,
        end_frame: 1410, // 25 seconds - content heavy with features
        parameters: {
          title: 'The Solution',
          body_text: 'Our product solves this by [key benefit].',
          image_url: null,
          features_list: ['Feature 1', 'Feature 2', 'Feature 3'],
          style: 'solution'
        }
      },
      {
        scene_number: 3,
        name: 'Social Proof',
        start_frame: 1410,
        end_frame: 2010, // 20 seconds - testimonials
        parameters: {
          title: 'Trusted By',
          body_text: 'Join thousands of satisfied customers.',
          testimonials: [
            { name: 'Customer 1', quote: 'Great product!' },
            { name: 'Customer 2', quote: 'Life changing!' }
          ],
          style: 'trust'
        }
      },
      {
        scene_number: 4,
        name: 'Call to Action',
        start_frame: 2010,
        end_frame: 2250, // 8 seconds - minimal CTA
        parameters: {
          title: 'Get Started Today',
          body_text: 'Sign up now and get 30% off.',
          cta_button: 'Start Free Trial',
          style: 'urgent'
        }
      }
    ]
  },

  'explainer-video': {
    name: 'Explainer Video',
    description: 'Educational explainer with 4 scenes',
    composition_id: 'ExplainerVideo',
    duration_seconds: 47,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Introduction',
        start_frame: 0,
        end_frame: 150, // 5 seconds - minimal intro
        parameters: {
          title: 'What is [Topic]?',
          body_text: "Let's break it down.",
          style: 'friendly'
        }
      },
      {
        scene_number: 1,
        name: 'The Concept',
        start_frame: 150,
        end_frame: 750, // 20 seconds - educational content
        parameters: {
          title: 'How It Works',
          body_text: "Here's the core concept explained simply.",
          diagram_type: 'flowchart',
          style: 'educational'
        }
      },
      {
        scene_number: 2,
        name: 'Key Benefits',
        start_frame: 750,
        end_frame: 1200, // 15 seconds - benefits list
        parameters: {
          title: 'Why It Matters',
          body_text: "Here's why this is important.",
          benefits_list: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
          style: 'informative'
        }
      },
      {
        scene_number: 3,
        name: 'Conclusion',
        start_frame: 1200,
        end_frame: 1410, // 7 seconds - minimal conclusion
        parameters: {
          title: 'Learn More',
          body_text: 'Want to dive deeper? Visit our resources.',
          style: 'conclusion'
        }
      }
    ]
  },

  'testimonial-showcase': {
    name: 'Testimonial Showcase',
    description: 'Customer testimonial video with 3 scenes',
    composition_id: 'TestimonialVideo',
    duration_seconds: 40,
    aspect_ratio: '1:1',
    scenes: [
      {
        scene_number: 0,
        name: 'Opening',
        start_frame: 0,
        end_frame: 150, // 5 seconds - minimal intro
        parameters: {
          title: 'Real Stories',
          body_text: 'Hear from our customers.',
          style: 'warm'
        }
      },
      {
        scene_number: 1,
        name: 'Testimonials',
        start_frame: 150,
        end_frame: 1050, // 30 seconds - 3 testimonials (~10s each)
        parameters: {
          title: 'Customer Success',
          testimonials: [
            {
              name: 'Jane Doe',
              company: 'Acme Corp',
              quote: 'This product transformed our workflow.',
              image_url: null
            },
            {
              name: 'John Smith',
              company: 'Tech Inc',
              quote: "Best investment we've made.",
              image_url: null
            },
            {
              name: 'Sarah Johnson',
              company: 'Startup Co',
              quote: 'Incredible results in just 2 weeks.',
              image_url: null
            }
          ],
          style: 'authentic'
        }
      },
      {
        scene_number: 2,
        name: 'Call to Action',
        start_frame: 1050,
        end_frame: 1200, // 5 seconds - minimal CTA
        parameters: {
          title: 'Join Them',
          body_text: 'Start your success story today.',
          cta_button: 'Get Started',
          style: 'inviting'
        }
      }
    ]
  },

  'social-media-ad': {
    name: 'Social Media Ad',
    description: 'Quick attention-grabbing ad for social platforms',
    composition_id: 'SocialMediaAd',
    duration_seconds: 15,
    aspect_ratio: '9:16',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook',
        start_frame: 0,
        end_frame: 90, // 3 seconds - very minimal for social
        parameters: {
          title: 'Stop Scrolling!',
          body_text: 'This will change everything.',
          style: 'attention-grabbing'
        }
      },
      {
        scene_number: 1,
        name: 'Value Proposition',
        start_frame: 90,
        end_frame: 300, // 7 seconds
        parameters: {
          title: 'The Offer',
          body_text: 'Get [benefit] in just [timeframe].',
          image_url: null,
          style: 'bold'
        }
      },
      {
        scene_number: 2,
        name: 'Call to Action',
        start_frame: 300,
        end_frame: 450, // 5 seconds - minimal CTA
        parameters: {
          title: 'Act Now',
          body_text: 'Swipe up to learn more.',
          cta_button: 'Shop Now',
          style: 'urgent'
        }
      }
    ]
  }
};

// Get all templates as a list
export function getAllTemplates() {
  return Object.entries(VIDEO_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    duration_seconds: template.duration_seconds,
    aspect_ratio: template.aspect_ratio,
    scene_count: template.scenes.length
  }));
}

// Get a specific template by ID
export function getTemplate(templateId) {
  return VIDEO_TEMPLATES[templateId] || null;
}

// Create scenes for a video based on template
export function createScenesFromTemplate(templateId, videoId, customData = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return template.scenes.map(scene => ({
    video_id: videoId,
    scene_number: scene.scene_number,
    name: scene.name,
    start_frame: scene.start_frame,
    end_frame: scene.end_frame,
    data: JSON.stringify({
      ...scene.parameters,
      ...customData
    })
  }));
}


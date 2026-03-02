// Video templates with scene definitions

export const VIDEO_TEMPLATES = {
  'ultrahuman-vsl': {
    name: 'Ultrahuman VSL',
    description: 'Professional B2B VSL with 8 scenes',
    category: 'general',
    framework: null,
    composition_id: 'DynamicScene',
    duration_seconds: 109,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Cold Open',
        scene_type: 'text-only',
        start_frame: 0,
        end_frame: 150,
        parameters: {
          title: 'Opening Hook',
          body_text: 'When health data multiplies, design changes.',
          style: 'minimal'
        }
      },
      {
        scene_number: 1,
        name: 'Respect the Ambition',
        scene_type: 'text-only',
        start_frame: 150,
        end_frame: 510,
        parameters: {
          title: 'The Vision',
          body_text: "You're building something ambitious in health tech.",
          style: 'confident'
        }
      },
      {
        scene_number: 2,
        name: 'The Inflection Point',
        scene_type: 'text-only',
        start_frame: 510,
        end_frame: 960,
        parameters: {
          title: 'The Challenge',
          body_text: 'Your users now have multiple data streams to track.',
          style: 'tension'
        }
      },
      {
        scene_number: 3,
        name: 'Naming the Hidden Problem',
        scene_type: 'text-only',
        start_frame: 960,
        end_frame: 1560,
        parameters: {
          title: 'The Problem',
          body_text: 'But scattered dashboards create cognitive overload.',
          style: 'problem'
        }
      },
      {
        scene_number: 4,
        name: 'Dashboard-of-Dashboards',
        scene_type: 'text-only',
        start_frame: 1560,
        end_frame: 2010,
        parameters: {
          title: 'The Solution',
          body_text: 'Introducing: The unified health intelligence platform.',
          style: 'solution'
        }
      },
      {
        scene_number: 5,
        name: 'Reframing the Opportunity',
        scene_type: 'text-only',
        start_frame: 2010,
        end_frame: 2610,
        parameters: {
          title: 'The Opportunity',
          body_text: 'Turn data complexity into competitive advantage.',
          style: 'opportunity'
        }
      },
      {
        scene_number: 6,
        name: "Why You're Reaching Out",
        scene_type: 'text-only',
        start_frame: 2610,
        end_frame: 3060,
        parameters: {
          title: 'The Partnership',
          body_text: 'We help health tech companies scale their design systems.',
          style: 'partnership'
        }
      },
      {
        scene_number: 7,
        name: 'Soft Close',
        scene_type: 'text-only',
        start_frame: 3060,
        end_frame: 3270,
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
    category: 'general',
    framework: null,
    composition_id: 'DynamicScene',
    duration_seconds: 75,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook',
        scene_type: 'text-only',
        start_frame: 0,
        end_frame: 210,
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
        scene_type: 'text-only',
        start_frame: 210,
        end_frame: 660,
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
        scene_type: 'text-only',
        start_frame: 660,
        end_frame: 1410,
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
        scene_type: 'text-only',
        start_frame: 1410,
        end_frame: 2010,
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
        scene_type: 'text-only',
        start_frame: 2010,
        end_frame: 2250,
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
    category: 'general',
    framework: null,
    composition_id: 'DynamicScene',
    duration_seconds: 47,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Introduction',
        scene_type: 'text-only',
        start_frame: 0,
        end_frame: 150,
        parameters: {
          title: 'What is [Topic]?',
          body_text: "Let's break it down.",
          style: 'friendly'
        }
      },
      {
        scene_number: 1,
        name: 'The Concept',
        scene_type: 'text-only',
        start_frame: 150,
        end_frame: 750,
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
        scene_type: 'text-only',
        start_frame: 750,
        end_frame: 1200,
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
        scene_type: 'text-only',
        start_frame: 1200,
        end_frame: 1410,
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
    category: 'general',
    framework: null,
    composition_id: 'DynamicScene',
    duration_seconds: 40,
    aspect_ratio: '1:1',
    scenes: [
      {
        scene_number: 0,
        name: 'Opening',
        scene_type: 'text-only',
        start_frame: 0,
        end_frame: 150,
        parameters: {
          title: 'Real Stories',
          body_text: 'Hear from our customers.',
          style: 'warm'
        }
      },
      {
        scene_number: 1,
        name: 'Testimonials',
        scene_type: 'text-only',
        start_frame: 150,
        end_frame: 1050,
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
        scene_type: 'text-only',
        start_frame: 1050,
        end_frame: 1200,
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
    category: 'general',
    framework: null,
    composition_id: 'DynamicScene',
    duration_seconds: 15,
    aspect_ratio: '9:16',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook',
        scene_type: 'text-only',
        start_frame: 0,
        end_frame: 90,
        parameters: {
          title: 'Stop Scrolling!',
          body_text: 'This will change everything.',
          style: 'attention-grabbing'
        }
      },
      {
        scene_number: 1,
        name: 'Value Proposition',
        scene_type: 'text-only',
        start_frame: 90,
        end_frame: 300,
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
        scene_type: 'text-only',
        start_frame: 300,
        end_frame: 450,
        parameters: {
          title: 'Act Now',
          body_text: 'Swipe up to learn more.',
          cta_button: 'Shop Now',
          style: 'urgent'
        }
      }
    ]
  },

  // ─── Sales Framework Templates ─────────────────────────────────────

  'quick-sell': {
    name: 'Quick Sell (PAS)',
    description: 'Problem-Agitate-Solve framework. Best for low-ticket under $100.',
    category: 'sales-framework',
    framework: 'PAS (Problem-Agitate-Solve)',
    composition_id: 'DynamicScene',
    duration_seconds: 240,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook - Pattern Interrupt',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 0,
        end_frame: 600,
        parameters: {
          title: 'Open with a bold, specific claim',
          body_text: 'State a surprising fact or contrarian take that stops the scroll. Make it personal to the viewer.',
        }
      },
      {
        scene_number: 1,
        name: 'Problem - Name the Pain',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 600,
        end_frame: 1800,
        parameters: {
          title: 'State the single biggest problem',
          body_text: "Describe the problem your audience faces daily. Be specific — use their exact words and frustrations.",
        }
      },
      {
        scene_number: 2,
        name: 'Agitate - Twist the Knife',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 1800,
        end_frame: 3300,
        parameters: {
          title: 'Show what happens if they do nothing',
          body_text: "Make the cost of inaction vivid. What gets worse? What do they miss out on? Paint the negative future.",
        }
      },
      {
        scene_number: 3,
        name: 'Solution - The Bridge',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 3300,
        end_frame: 4800,
        parameters: {
          title: 'Introduce your solution as the answer',
          body_text: "Position your product as the bridge from their pain to their desired outcome. Focus on the transformation, not features.",
        }
      },
      {
        scene_number: 4,
        name: 'Proof - Back It Up',
        scene_type: 'stats',
        animation_preset: 'fade-up',
        start_frame: 4800,
        end_frame: 6000,
        parameters: {
          title: 'Show results that prove it works',
          stats_text: '87% | success rate\n3x | faster results\n10K+ | happy customers',
          body_text: 'Replace these with your real metrics. Specificity builds trust.',
        }
      },
      {
        scene_number: 5,
        name: 'CTA - Clear Next Step',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 6000,
        end_frame: 7200,
        parameters: {
          title: 'Tell them exactly what to do next',
          body_text: "One clear action. Add urgency if genuine (limited time, limited spots). Remove risk with a guarantee.",
        }
      }
    ]
  },

  'story-sell': {
    name: 'Story Sell (Epiphany Bridge)',
    description: 'Brunson Epiphany Bridge framework. Best for mid-ticket $100-$500.',
    category: 'sales-framework',
    framework: 'Brunson Epiphany Bridge',
    composition_id: 'DynamicScene',
    duration_seconds: 720,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook - Curiosity Gap',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 0,
        end_frame: 900,
        parameters: {
          title: 'Tease the transformation story',
          body_text: "Open with 'How I went from [bad state] to [good state]' or a question that creates a curiosity gap.",
        }
      },
      {
        scene_number: 1,
        name: 'Origin Story - The Backstory',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 900,
        end_frame: 3600,
        parameters: {
          title: 'Share where you started',
          body_text: "Tell your origin story. Where were you before the breakthrough? Make it relatable — show you were just like them.",
        }
      },
      {
        scene_number: 2,
        name: 'The Wall - Rock Bottom',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 3600,
        end_frame: 6300,
        parameters: {
          title: 'Describe the moment everything changed',
          body_text: "What wall did you hit? What was the breaking point that forced you to find a new way? Make the audience feel it.",
        }
      },
      {
        scene_number: 3,
        name: 'Epiphany - The Breakthrough',
        scene_type: 'quote',
        animation_preset: 'fade-up',
        start_frame: 6300,
        end_frame: 9000,
        parameters: {
          title: 'The moment of realization',
          quote: "Describe the exact 'aha moment' that led to your solution. What did you discover that changed everything?",
          author: 'Your Name / Brand',
          body_text: 'This is the emotional turning point. The audience should feel the shift.',
        }
      },
      {
        scene_number: 4,
        name: 'Framework - The New Way',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 9000,
        end_frame: 12600,
        parameters: {
          title: 'Explain the framework or method',
          body_text: "Lay out the system you built from that epiphany. Give it a name. Show the 3-5 steps or principles that make it work.",
        }
      },
      {
        scene_number: 5,
        name: 'Results - Social Proof',
        scene_type: 'stats',
        animation_preset: 'fade-up',
        start_frame: 12600,
        end_frame: 15300,
        parameters: {
          title: 'Show what happened next',
          stats_text: '$250K | revenue generated\n500+ | students enrolled\n4.9★ | average rating',
          body_text: 'Share your results AND the results of others who followed your framework.',
        }
      },
      {
        scene_number: 6,
        name: 'Offer Stack - The Package',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 15300,
        end_frame: 18000,
        parameters: {
          title: 'Stack the value of your offer',
          body_text: "List everything they get. Assign a value to each element. Build up the total value before revealing your price.",
        }
      },
      {
        scene_number: 7,
        name: 'Close - The Decision',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 18000,
        end_frame: 21600,
        parameters: {
          title: 'Give them a clear choice',
          body_text: "Frame it as two paths: stay where they are, or take action. Add a guarantee to remove risk. Create genuine urgency.",
        }
      }
    ]
  },

  'authority-sell': {
    name: 'Authority Sell (Hormozi 5Ps)',
    description: "Hormozi 5P's framework. Best for any price point, proof-first approach.",
    category: 'sales-framework',
    framework: "Hormozi 5P's (Proof-Promise-Pain-Plan-Picture)",
    composition_id: 'DynamicScene',
    duration_seconds: 480,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Proof - Lead with Credibility',
        scene_type: 'stats',
        animation_preset: 'fade-up',
        start_frame: 0,
        end_frame: 1800,
        parameters: {
          title: 'Start with your strongest proof',
          stats_text: '$10M+ | revenue generated\n2,000+ | clients served\n97% | success rate',
          body_text: "Lead with results, not claims. Show numbers, screenshots, testimonials. The audience should think 'this person knows what they're talking about.'",
        }
      },
      {
        scene_number: 1,
        name: 'Promise - The Big Claim',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 1800,
        end_frame: 3600,
        parameters: {
          title: 'Make a bold, specific promise',
          body_text: "State exactly what you can do for them. Be specific: 'I will help you [achieve X] in [timeframe] without [common objection].'",
        }
      },
      {
        scene_number: 2,
        name: 'Pain - Why They Need This Now',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 3600,
        end_frame: 5400,
        parameters: {
          title: 'Identify the pain they feel today',
          body_text: "Name the 2-3 biggest frustrations your audience deals with. Use their language. Show you understand their world better than they do.",
        }
      },
      {
        scene_number: 3,
        name: 'Plan - The Roadmap',
        scene_type: 'progress-bars',
        animation_preset: 'fade-up',
        start_frame: 5400,
        end_frame: 8100,
        parameters: {
          title: 'Show the simple path forward',
          bars: [
            { label: 'Step 1: Assessment', value: 100 },
            { label: 'Step 2: Implementation', value: 75 },
            { label: 'Step 3: Optimization', value: 50 },
            { label: 'Step 4: Scale', value: 25 }
          ],
          body_text: 'Break your solution into 3-5 clear steps. Make it feel achievable and logical.',
        }
      },
      {
        scene_number: 4,
        name: 'Picture - The Dream Outcome',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 8100,
        end_frame: 10800,
        parameters: {
          title: 'Paint the after picture',
          body_text: "Describe their life after using your solution. Be vivid and specific. What does their Monday morning look like? How do they feel?",
        }
      },
      {
        scene_number: 5,
        name: 'Offer - What They Get',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 10800,
        end_frame: 12600,
        parameters: {
          title: 'Present the offer clearly',
          body_text: "Stack the value. List every component, bonus, and guarantee. Show the gap between total value and actual price.",
        }
      },
      {
        scene_number: 6,
        name: 'CTA - Remove All Risk',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 12600,
        end_frame: 14400,
        parameters: {
          title: 'Make the decision easy',
          body_text: "Strong guarantee + clear CTA + urgency. The risk of inaction should feel greater than the risk of buying.",
        }
      }
    ]
  },

  'education-sell': {
    name: 'Education Sell (Todd Brown E5)',
    description: 'Todd Brown E5 Method. Best for high-ticket $500+.',
    category: 'sales-framework',
    framework: 'Todd Brown E5 (Educate-to-Sell)',
    composition_id: 'DynamicScene',
    duration_seconds: 900,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Big Idea - The Unique Angle',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 0,
        end_frame: 2700,
        parameters: {
          title: 'Lead with your Big Idea',
          body_text: "Present one powerful, counterintuitive idea that reframes how your audience thinks about their problem. This isn't a feature — it's an intellectual hook.",
        }
      },
      {
        scene_number: 1,
        name: 'Education #1 - The Hidden Truth',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 2700,
        end_frame: 6300,
        parameters: {
          title: 'Teach something they did not know',
          body_text: "Share a genuine insight about their problem. Explain why what they've been doing hasn't worked — not because they're wrong, but because they were missing this piece.",
        }
      },
      {
        scene_number: 2,
        name: 'Education #2 - The Deeper Layer',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 6300,
        end_frame: 9900,
        parameters: {
          title: 'Build on the first insight',
          body_text: "Go deeper. Show the mechanism behind the insight. Use an analogy or case study to make it concrete and memorable.",
        }
      },
      {
        scene_number: 3,
        name: 'Education #3 - The Data',
        scene_type: 'bar-chart',
        animation_preset: 'fade-up',
        start_frame: 9900,
        end_frame: 13500,
        parameters: {
          title: 'Back it up with data',
          labels: ['Old Way', 'Industry Avg', 'Our Method'],
          datasets: [{ label: 'Results', data: [25, 45, 92] }],
          body_text: 'Present compelling data or research that validates your approach. Numbers create authority.',
        }
      },
      {
        scene_number: 4,
        name: 'Unique Mechanism - Why This Works',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 13500,
        end_frame: 17100,
        parameters: {
          title: 'Reveal your unique mechanism',
          body_text: "Name and explain the specific mechanism that makes your solution different from everything else. This is your moat — the reason only your approach delivers these results.",
        }
      },
      {
        scene_number: 5,
        name: 'Case Study - Real-World Proof',
        scene_type: 'quote',
        animation_preset: 'fade-up',
        start_frame: 17100,
        end_frame: 20700,
        parameters: {
          title: 'Show a detailed success story',
          quote: "Share a specific client's journey: where they started, what they did, and the results they achieved using your unique mechanism.",
          author: 'Client Name, Company',
          body_text: 'Detailed case studies are more convincing than generic testimonials.',
        }
      },
      {
        scene_number: 6,
        name: 'Offer Stack - Premium Positioning',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 20700,
        end_frame: 24300,
        parameters: {
          title: 'Present the complete offer',
          body_text: "Stack every component with its standalone value. Include bonuses that address objections. Position the price as an investment with clear ROI.",
        }
      },
      {
        scene_number: 7,
        name: 'CTA - Educated Decision',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 24300,
        end_frame: 27000,
        parameters: {
          title: 'Invite them to take the next step',
          body_text: "By now they're educated and convinced. Provide a clear next step — application, call booking, or purchase. Restate the guarantee.",
        }
      }
    ]
  },

  'short-form-social': {
    name: 'Short-Form Social (Hook-Retain-Reward)',
    description: 'Hormozi Hook-Retain-Reward for TikTok, Reels, Shorts. ~45 seconds.',
    category: 'social',
    framework: 'Hormozi Hook-Retain-Reward',
    composition_id: 'DynamicScene',
    duration_seconds: 45,
    aspect_ratio: '9:16',
    scenes: [
      {
        scene_number: 0,
        name: 'Hook - Stop the Scroll',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 0,
        end_frame: 90,
        parameters: {
          title: 'Grab attention in 3 seconds',
          body_text: "Use a bold claim, question, or visual interrupt. You have 3 seconds before they scroll. Make every word count.",
        }
      },
      {
        scene_number: 1,
        name: 'Value Drop - The Meat',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 90,
        end_frame: 630,
        parameters: {
          title: 'Deliver one powerful insight',
          body_text: "Give away your best tip, hack, or insight freely. Don't hold back — generosity builds trust and authority in short-form.",
        }
      },
      {
        scene_number: 2,
        name: 'Payoff - The Result',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 630,
        end_frame: 1080,
        parameters: {
          title: 'Show the payoff',
          body_text: "What happens when they apply your insight? Show the result, the transformation, or the proof that this works.",
        }
      },
      {
        scene_number: 3,
        name: 'CTA - Quick Action',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 1080,
        end_frame: 1350,
        parameters: {
          title: 'One simple call-to-action',
          body_text: "Follow for more, link in bio, comment 'YES' — pick one CTA. Keep it frictionless.",
        }
      }
    ]
  },

  'webinar-condensed': {
    name: 'Webinar Condensed (Perfect Webinar)',
    description: 'Brunson Perfect Webinar framework condensed to ~20 min. Best for high-ticket $500+.',
    category: 'sales-framework',
    framework: 'Brunson Perfect Webinar',
    composition_id: 'DynamicScene',
    duration_seconds: 1200,
    aspect_ratio: '16:9',
    scenes: [
      {
        scene_number: 0,
        name: 'Title - The Big Promise',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 0,
        end_frame: 1800,
        parameters: {
          title: 'State the webinar promise',
          body_text: "Your title should promise a specific outcome: 'How to [achieve X] without [pain point] in [timeframe].'",
        }
      },
      {
        scene_number: 1,
        name: 'Rapport - Build Connection',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 1800,
        end_frame: 4500,
        parameters: {
          title: 'Establish credibility and connection',
          body_text: "Briefly share who you are and why you're qualified. Focus on relatable struggles, not just achievements. Show you understand their world.",
        }
      },
      {
        scene_number: 2,
        name: 'Big Domino - The One Belief',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 4500,
        end_frame: 7200,
        parameters: {
          title: 'Identify the one belief to change',
          body_text: "What single belief, if they adopted it, would make them want your offer? This is the domino that knocks down all objections.",
        }
      },
      {
        scene_number: 3,
        name: 'Origin - Your Epiphany Story',
        scene_type: 'quote',
        animation_preset: 'fade-up',
        start_frame: 7200,
        end_frame: 10800,
        parameters: {
          title: 'Tell your transformation story',
          quote: "Share the moment you discovered the truth behind your framework. What was the epiphany that changed everything?",
          author: 'Your Name',
          body_text: "Make it emotional and relatable. They should see themselves in your 'before' story.",
        }
      },
      {
        scene_number: 4,
        name: 'Secret #1 - Vehicle',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 10800,
        end_frame: 14400,
        parameters: {
          title: 'Secret #1: The right vehicle',
          body_text: "Teach why your approach (the vehicle) is different and better than alternatives. Break the false belief about what they need to use to get results.",
        }
      },
      {
        scene_number: 5,
        name: 'Secret #2 - Internal Belief',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 14400,
        end_frame: 18000,
        parameters: {
          title: "Secret #2: Why it will work for them",
          body_text: "Address the internal false belief: 'This won't work for me because...' Show why their situation isn't different. Use a case study of someone like them.",
        }
      },
      {
        scene_number: 6,
        name: 'Secret #3 - External Belief',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 18000,
        end_frame: 21600,
        parameters: {
          title: "Secret #3: Why now is the time",
          body_text: "Break the external false belief: 'I don't have enough time/money/experience.' Show why the conditions are actually in their favor right now.",
        }
      },
      {
        scene_number: 7,
        name: 'Transition - From Teaching to Offer',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 21600,
        end_frame: 23400,
        parameters: {
          title: 'Bridge to the offer',
          body_text: "Summarize the 3 secrets and create desire: 'Now you know WHAT to do... let me show you HOW to do it as fast as possible.'",
        }
      },
      {
        scene_number: 8,
        name: 'Stack - Build the Value',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'left-heavy',
        start_frame: 23400,
        end_frame: 27000,
        parameters: {
          title: 'Stack every element of the offer',
          body_text: "List each component with its standalone value. Core program, bonuses, support, community — build up the total before revealing price.",
        }
      },
      {
        scene_number: 9,
        name: 'Price Reveal - The Anchor',
        scene_type: 'stats',
        animation_preset: 'fade-up',
        start_frame: 27000,
        end_frame: 29700,
        parameters: {
          title: 'Reveal the price against the value',
          stats_text: '$15,000 | total value\n$2,997 | normal price\n$997 | today only',
          body_text: "Show the gap between value delivered and price charged. Make it feel like a no-brainer investment.",
        }
      },
      {
        scene_number: 10,
        name: 'Urgency - Why Act Now',
        scene_type: 'text-only',
        animation_preset: 'fade-up',
        text_layout: 'centered',
        start_frame: 29700,
        end_frame: 32400,
        parameters: {
          title: 'Create genuine urgency',
          body_text: "Limited spots, bonus expiration, price increase — use real scarcity. Then add a strong guarantee to remove the risk of action.",
        }
      },
      {
        scene_number: 11,
        name: 'Final CTA - The Close',
        scene_type: 'text-only',
        animation_preset: 'typewriter',
        text_layout: 'centered',
        start_frame: 32400,
        end_frame: 36000,
        parameters: {
          title: 'Make the final call to action',
          body_text: "Restate the promise, the guarantee, and the urgency. Tell them exactly where to click and what happens next. Leave no ambiguity.",
        }
      }
    ]
  },
};

// Get all templates as a list
export function getAllTemplates() {
  return Object.entries(VIDEO_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    framework: template.framework,
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
    scene_type: scene.scene_type || 'text-only',
    name: scene.name,
    start_frame: scene.start_frame,
    end_frame: scene.end_frame,
    data: JSON.stringify({
      ...scene.parameters,
      ...(scene.animation_preset ? { animation_preset: scene.animation_preset } : {}),
      ...(scene.text_layout ? { text_layout: scene.text_layout } : {}),
      ...customData
    })
  }));
}

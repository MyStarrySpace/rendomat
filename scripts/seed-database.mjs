import { clientDb, videoDb, sceneDb } from '../server/database.mjs';

console.log('Seeding database with GoInvo demo...\n');

// Create GoInvo client
const goinvoId = clientDb.create({
  name: 'GoInvo',
  company: 'GoInvo',
  industry: 'Healthcare Design',
  portfolio_url: 'https://www.goinvo.com/work',
  website_url: 'https://www.goinvo.com',
  default_personas: ['vsl-expert', 'storyteller'],
});

console.log(`✓ Created client: GoInvo (ID: ${goinvoId})`);

// Create GoInvo showcase video
const videoId = videoDb.create({
  client_id: goinvoId,
  title: 'GoInvo - Designing the Future of Healthcare',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 75,
  aspect_ratio: '16:9',
  theme_id: 'minimal-mono',
  data: JSON.stringify({
    description: 'A showcase of GoInvo healthcare design work'
  })
});

console.log(`✓ Created video: GoInvo Showcase (ID: ${videoId})`);

// Scene definitions (30 fps) - showcasing GoInvo's design expertise
const scenes = [
  {
    scene_number: 0,
    name: 'Hook - The Challenge',
    scene_type: 'text-only',
    start_frame: 0,
    end_frame: 150, // 5 seconds
    data: JSON.stringify({
      title: 'Healthcare is broken by design',
      body_text: 'Complex systems. Confusing interfaces. Patients lost in the process.',
      animation_preset: 'dramatic'
    })
  },
  {
    scene_number: 1,
    name: 'Introduction - Who We Are',
    scene_type: 'text-only',
    start_frame: 150,
    end_frame: 390, // 8 seconds
    data: JSON.stringify({
      title: 'We are GoInvo',
      body_text: 'A healthcare design studio crafting human-centered experiences for the world\'s leading health organizations.',
      animation_preset: 'smooth'
    })
  },
  {
    scene_number: 2,
    name: 'Our Approach',
    scene_type: 'stats',
    start_frame: 390,
    end_frame: 720, // 11 seconds
    data: JSON.stringify({
      title: 'Design That Heals',
      stats_text: '20+ | Years of healthcare design\n100+ | Health organizations served\n1B+ | Patient lives impacted',
      animation_preset: 'stacking'
    })
  },
  {
    scene_number: 3,
    name: 'What We Do - Research',
    scene_type: 'text-only',
    start_frame: 720,
    end_frame: 960, // 8 seconds
    data: JSON.stringify({
      title: 'Deep Research',
      body_text: 'We embed with clinicians, patients, and administrators to understand the real problems.',
      animation_preset: 'cascade'
    })
  },
  {
    scene_number: 4,
    name: 'What We Do - Design',
    scene_type: 'text-only',
    start_frame: 960,
    end_frame: 1200, // 8 seconds
    data: JSON.stringify({
      title: 'Thoughtful Design',
      body_text: 'From patient portals to clinical workflows, we design systems that work for humans.',
      animation_preset: 'smooth'
    })
  },
  {
    scene_number: 5,
    name: 'Impact',
    scene_type: 'quote',
    start_frame: 1200,
    end_frame: 1560, // 12 seconds
    data: JSON.stringify({
      quote: 'GoInvo transformed how our patients interact with their health data. The impact has been measurable and profound.',
      author: 'Chief Digital Officer, Major Health System',
      animation_preset: 'elegant'
    })
  },
  {
    scene_number: 6,
    name: 'Services Overview',
    scene_type: 'stats',
    start_frame: 1560,
    end_frame: 1920, // 12 seconds
    data: JSON.stringify({
      title: 'Our Services',
      stats_text: 'UX Research | Understanding users deeply\nProduct Design | Interfaces that heal\nDesign Systems | Scalable, consistent experiences\nStrategy | Roadmaps for digital health',
      animation_preset: 'lyric'
    })
  },
  {
    scene_number: 7,
    name: 'CTA - Get Started',
    scene_type: 'text-only',
    start_frame: 1920,
    end_frame: 2250, // 11 seconds
    data: JSON.stringify({
      title: 'Ready to redesign healthcare?',
      body_text: 'Let\'s talk about your next project.\ngoinvo.com',
      animation_preset: 'burst'
    })
  }
];

// Create scenes
for (const scene of scenes) {
  const sceneId = sceneDb.create({
    video_id: videoId,
    ...scene
  });
  const duration = (scene.end_frame - scene.start_frame) / 30;
  console.log(`✓ Created scene ${scene.scene_number}: ${scene.name} (${duration.toFixed(1)}s) - ID: ${sceneId}`);
}

console.log('\n✅ Database seeded successfully with GoInvo demo!');
console.log('\nYou can now:');
console.log('1. Start the render server: npm run render-server');
console.log('2. Open the Next.js app: cd app && npm run dev');
console.log('3. View the GoInvo client and demo video\n');

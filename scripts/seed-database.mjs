import Database from 'better-sqlite3';
import path from 'node:path';
import { clientDb, videoDb, sceneDb, transitionDb } from '../server/database.mjs';

// Clear all existing data first
const dbPath = path.join(process.cwd(), 'data', 'vsl-generator.db');
const db = new Database(dbPath);
console.log('Clearing existing data...');
db.exec('DELETE FROM transitions');
db.exec('DELETE FROM scenes');
db.exec('DELETE FROM render_jobs');
db.exec('DELETE FROM audio_clips');
db.exec('DELETE FROM video_clips');
db.exec('DELETE FROM videos');
db.exec('DELETE FROM clients');
// Reset autoincrement counters
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('clients', 'videos', 'scenes', 'transitions', 'render_jobs', 'audio_clips', 'video_clips')");
db.close();

console.log('Seeding database with demo clients...\n');

// ============================================================================
// CLIENT 1: Aperture Science (Portal)
// ============================================================================
const apertureId = clientDb.create({
  name: 'Cave Johnson',
  company: 'Aperture Science',
  industry: 'Applied Sciences & Testing',
  portfolio_url: 'https://aperturescience.com/research',
  website_url: 'https://aperturescience.com',
  default_personas: ['vsl-expert', 'storyteller'],
});
console.log(`✓ Created client: Aperture Science (ID: ${apertureId})`);

const apertureVideoId = videoDb.create({
  client_id: apertureId,
  title: 'Aperture Science - Volunteer Testing Initiative',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 60,
  aspect_ratio: '16:9',
  theme_id: 'minimal-mono',
  data: JSON.stringify({ description: 'Recruitment video for Aperture Science testing programs' }),
});
console.log(`  ✓ Video: Volunteer Testing Initiative (ID: ${apertureVideoId})`);

const apertureScenes = [
  {
    scene_number: 0, name: 'Hook', scene_type: 'text-only',
    start_frame: 0, end_frame: 150,
    data: JSON.stringify({ title: 'Science isn\'t about why', body_text: 'It\'s about why not.', animation_preset: 'dramatic' }),
  },
  {
    scene_number: 1, name: 'Stats - Testing Legacy', scene_type: 'stats',
    start_frame: 150, end_frame: 420,
    data: JSON.stringify({ title: 'Testing Since 1947', stats_text: '10,000+ | Test subjects processed\n47 | Underground test chambers\n99.7% | Portal stability rate', animation_preset: 'stacking' }),
  },
  {
    scene_number: 2, name: 'Our Mission', scene_type: 'text-only',
    start_frame: 420, end_frame: 660,
    data: JSON.stringify({ title: 'Pushing the boundaries of science', body_text: 'From portal technology to repulsion gel, every breakthrough starts with a willing volunteer.', animation_preset: 'smooth' }),
  },
  {
    scene_number: 3, name: 'Testimonial', scene_type: 'quote',
    start_frame: 660, end_frame: 960,
    data: JSON.stringify({ quote: 'When life gives you lemons, don\'t make lemonade. Make life take the lemons back.', author: 'Cave Johnson, CEO', animation_preset: 'elegant' }),
  },
  {
    scene_number: 4, name: 'Benefits', scene_type: 'stats',
    start_frame: 960, end_frame: 1260,
    data: JSON.stringify({ title: 'Volunteer Benefits', stats_text: '$60 | Per test completed\nFree | Companion Cube upon request\nUnlimited | Access to the relaxation vault', animation_preset: 'cascade' }),
  },
  {
    scene_number: 5, name: 'CTA', scene_type: 'text-only',
    start_frame: 1260, end_frame: 1500,
    data: JSON.stringify({ title: 'Apply today', body_text: 'We do what we must, because we can.\naperturescience.com/volunteer', animation_preset: 'burst' }),
  },
];

for (const scene of apertureScenes) {
  sceneDb.create({ video_id: apertureVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(apertureVideoId, 'crossfade', 15);
console.log(`  ✓ ${apertureScenes.length} scenes + transitions created`);

// ============================================================================
// CLIENT 2: Umbrella Corporation (Resident Evil)
// ============================================================================
const umbrellaId = clientDb.create({
  name: 'Albert Wesker',
  company: 'Umbrella Corporation',
  industry: 'Pharmaceuticals & Biotech',
  portfolio_url: 'https://umbrella-corp.com/products',
  website_url: 'https://umbrella-corp.com',
  default_personas: ['vsl-expert'],
});
console.log(`\n✓ Created client: Umbrella Corporation (ID: ${umbrellaId})`);

const umbrellaVideoId = videoDb.create({
  client_id: umbrellaId,
  title: 'Umbrella Corp - Global Health Solutions',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 55,
  aspect_ratio: '16:9',
  theme_id: 'corporate-blue',
  data: JSON.stringify({ description: 'Corporate brand video for Umbrella pharmaceuticals division' }),
});
console.log(`  ✓ Video: Global Health Solutions (ID: ${umbrellaVideoId})`);

const umbrellaScenes = [
  {
    scene_number: 0, name: 'Opening', scene_type: 'text-only',
    start_frame: 0, end_frame: 180,
    data: JSON.stringify({ title: 'Our business is life itself', body_text: 'Umbrella Corporation. Protecting the future of humanity.', animation_preset: 'cinematic' }),
  },
  {
    scene_number: 1, name: 'Global Reach', scene_type: 'stats',
    start_frame: 180, end_frame: 450,
    data: JSON.stringify({ title: 'Global Presence', stats_text: '150+ | Countries served\n$13B | Annual research budget\n40,000 | Research scientists worldwide', animation_preset: 'stacking' }),
  },
  {
    scene_number: 2, name: 'Research Areas', scene_type: 'stats',
    start_frame: 450, end_frame: 720,
    data: JSON.stringify({ title: 'Research Divisions', stats_text: 'Virology | Advanced viral research & containment\nGenetics | Next-generation gene therapy\nBiodefense | Protecting against biological threats', animation_preset: 'cascade' }),
  },
  {
    scene_number: 3, name: 'Testimonial', scene_type: 'quote',
    start_frame: 720, end_frame: 1020,
    data: JSON.stringify({ quote: 'Umbrella\'s T-Virus vaccine program has saved an estimated 2.3 million lives in sub-Saharan Africa alone.', author: 'Dr. William Birkin, Chief Virologist', animation_preset: 'elegant' }),
  },
  {
    scene_number: 4, name: 'CTA', scene_type: 'text-only',
    start_frame: 1020, end_frame: 1260,
    data: JSON.stringify({ title: 'Building a healthier tomorrow', body_text: 'Partner with us to advance human health.\numbrella-corp.com', animation_preset: 'smooth' }),
  },
];

for (const scene of umbrellaScenes) {
  sceneDb.create({ video_id: umbrellaVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(umbrellaVideoId, 'crossfade', 15);
console.log(`  ✓ ${umbrellaScenes.length} scenes + transitions created`);

// ============================================================================
// CLIENT 3: Shinra Electric Power Company (FF7)
// ============================================================================
const shinraId = clientDb.create({
  name: 'Rufus Shinra',
  company: 'Shinra Electric Power Company',
  industry: 'Energy & Infrastructure',
  portfolio_url: 'https://shinra.com/mako-energy',
  website_url: 'https://shinra.com',
  default_personas: ['vsl-expert', 'storyteller'],
});
console.log(`\n✓ Created client: Shinra Electric Power Company (ID: ${shinraId})`);

const shinraVideoId = videoDb.create({
  client_id: shinraId,
  title: 'Shinra - Powering the Planet',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 50,
  aspect_ratio: '16:9',
  theme_id: 'vibrant-gradient',
  data: JSON.stringify({ description: 'Brand video for Shinra mako energy division' }),
});
console.log(`  ✓ Video: Powering the Planet (ID: ${shinraVideoId})`);

const shinraScenes = [
  {
    scene_number: 0, name: 'Hook', scene_type: 'text-only',
    start_frame: 0, end_frame: 150,
    data: JSON.stringify({ title: 'The planet provides', body_text: 'We deliver.', animation_preset: 'dramatic' }),
  },
  {
    scene_number: 1, name: 'Mako Energy', scene_type: 'text-only',
    start_frame: 150, end_frame: 390,
    data: JSON.stringify({ title: 'Mako Energy', body_text: 'Clean, limitless power extracted from the planet\'s own lifestream. Powering 98% of Midgar\'s grid.', animation_preset: 'smooth' }),
  },
  {
    scene_number: 2, name: 'By the Numbers', scene_type: 'stats',
    start_frame: 390, end_frame: 660,
    data: JSON.stringify({ title: 'Shinra By The Numbers', stats_text: '8 | Mako reactors operational\n12M | Homes powered daily\n$47B | Market capitalization', animation_preset: 'stacking' }),
  },
  {
    scene_number: 3, name: 'Future Vision', scene_type: 'quote',
    start_frame: 660, end_frame: 930,
    data: JSON.stringify({ quote: 'A new era of energy is not coming. It\'s already here.', author: 'President Rufus Shinra', animation_preset: 'cinematic' }),
  },
  {
    scene_number: 4, name: 'CTA', scene_type: 'text-only',
    start_frame: 930, end_frame: 1140,
    data: JSON.stringify({ title: 'Invest in the future', body_text: 'Shinra Electric Power Company\nNYSE: SNRA', animation_preset: 'reveal' }),
  },
];

for (const scene of shinraScenes) {
  sceneDb.create({ video_id: shinraVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(shinraVideoId, 'crossfade', 15);
console.log(`  ✓ ${shinraScenes.length} scenes + transitions created`);

// ============================================================================
// CLIENT 4: Vault-Tec Corporation (Fallout)
// ============================================================================
const vaultTecId = clientDb.create({
  name: 'Marketing Division',
  company: 'Vault-Tec Corporation',
  industry: 'Defense & Civil Engineering',
  portfolio_url: 'https://vault-tec.com/vaults',
  website_url: 'https://vault-tec.com',
  default_personas: ['vsl-expert'],
});
console.log(`\n✓ Created client: Vault-Tec Corporation (ID: ${vaultTecId})`);

const vaultTecVideoId = videoDb.create({
  client_id: vaultTecId,
  title: 'Vault-Tec - Prepare for the Future',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 45,
  aspect_ratio: '16:9',
  theme_id: 'artisanal-light',
  data: JSON.stringify({ description: 'Public awareness campaign for Vault-Tec shelter program' }),
});
console.log(`  ✓ Video: Prepare for the Future (ID: ${vaultTecVideoId})`);

const vaultTecScenes = [
  {
    scene_number: 0, name: 'Hook', scene_type: 'text-only',
    start_frame: 0, end_frame: 150,
    data: JSON.stringify({ title: 'When the bombs fall', body_text: 'Where will you be?', animation_preset: 'dramatic' }),
  },
  {
    scene_number: 1, name: 'Solution', scene_type: 'text-only',
    start_frame: 150, end_frame: 390,
    data: JSON.stringify({ title: 'Vault-Tec has the answer', body_text: 'State-of-the-art underground vaults designed to protect you and your family for generations.', animation_preset: 'smooth' }),
  },
  {
    scene_number: 2, name: 'Features', scene_type: 'stats',
    start_frame: 390, end_frame: 660,
    data: JSON.stringify({ title: 'Every Vault Includes', stats_text: '1,000 | Resident capacity\n100 | Years of supplies\n24/7 | G.E.C.K. life support systems', animation_preset: 'cascade' }),
  },
  {
    scene_number: 3, name: 'Testimonial', scene_type: 'quote',
    start_frame: 660, end_frame: 900,
    data: JSON.stringify({ quote: 'Vault-Tec. Because the future of civilization depends on the preparations you make today.', author: 'Vault-Tec Public Service Announcement', animation_preset: 'elegant' }),
  },
  {
    scene_number: 4, name: 'CTA', scene_type: 'text-only',
    start_frame: 900, end_frame: 1110,
    data: JSON.stringify({ title: 'Reserve your spot', body_text: 'Spaces are limited. Register today.\nvault-tec.com/register', animation_preset: 'burst' }),
  },
];

for (const scene of vaultTecScenes) {
  sceneDb.create({ video_id: vaultTecVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(vaultTecVideoId, 'crossfade', 15);
console.log(`  ✓ ${vaultTecScenes.length} scenes + transitions created`);

// ============================================================================
// CLIENT 5: Abstergo Industries (Assassin's Creed)
// ============================================================================
const abstergoId = clientDb.create({
  name: 'Warren Vidic',
  company: 'Abstergo Industries',
  industry: 'Consumer Technology & Research',
  portfolio_url: 'https://abstergo.com/animus',
  website_url: 'https://abstergo.com',
  default_personas: ['storyteller'],
});
console.log(`\n✓ Created client: Abstergo Industries (ID: ${abstergoId})`);

const abstergoVideoId = videoDb.create({
  client_id: abstergoId,
  title: 'Abstergo - The Animus Experience',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 50,
  aspect_ratio: '16:9',
  theme_id: 'ocean-blue-green',
  data: JSON.stringify({ description: 'Consumer product launch for the Animus VR platform' }),
});
console.log(`  ✓ Video: The Animus Experience (ID: ${abstergoVideoId})`);

const abstergoScenes = [
  {
    scene_number: 0, name: 'Hook', scene_type: 'text-only',
    start_frame: 0, end_frame: 150,
    data: JSON.stringify({ title: 'What if you could live history?', body_text: 'Not read it. Not watch it. Live it.', animation_preset: 'cinematic' }),
  },
  {
    scene_number: 1, name: 'Product Intro', scene_type: 'text-only',
    start_frame: 150, end_frame: 390,
    data: JSON.stringify({ title: 'Introducing Animus', body_text: 'Genetic memory technology that lets you experience the lives of your ancestors in full sensory detail.', animation_preset: 'reveal' }),
  },
  {
    scene_number: 2, name: 'Tech Specs', scene_type: 'stats',
    start_frame: 390, end_frame: 660,
    data: JSON.stringify({ title: 'Technology', stats_text: '99.97% | Memory synchronization accuracy\n8K | Per-eye visual resolution\n500+ | Years of explorable history', animation_preset: 'stacking' }),
  },
  {
    scene_number: 3, name: 'Testimonial', scene_type: 'quote',
    start_frame: 660, end_frame: 930,
    data: JSON.stringify({ quote: 'I walked through Renaissance Florence. I felt the sun on my skin. It was more real than any vacation I\'ve ever taken.', author: 'Beta Program Participant', animation_preset: 'elegant' }),
  },
  {
    scene_number: 4, name: 'CTA', scene_type: 'text-only',
    start_frame: 930, end_frame: 1140,
    data: JSON.stringify({ title: 'Pre-order now', body_text: 'History is in your DNA.\nabstergo.com/animus', animation_preset: 'tracking' }),
  },
];

for (const scene of abstergoScenes) {
  sceneDb.create({ video_id: abstergoVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(abstergoVideoId, 'crossfade', 15);
console.log(`  ✓ ${abstergoScenes.length} scenes + transitions created`);

// ============================================================================
// CLIENT 6: Shirley Xu (Design Portfolio VSL)
// ============================================================================
const shirleyId = clientDb.create({
  name: 'Shirley Xu',
  company: 'Shirley Xu Design',
  industry: 'Product Design & Systems Thinking',
  portfolio_url: 'https://shirleyxu.bio',
  website_url: 'https://shirleyxu.bio',
  default_personas: ['vsl-expert', 'storyteller'],
});
console.log(`\n✓ Created client: Shirley Xu (ID: ${shirleyId})`);

const shirleyVideoId = videoDb.create({
  client_id: shirleyId,
  title: 'Shirley Xu - Wicked Good Design for Wicked Problems',
  composition_id: 'DynamicScene',
  status: 'draft',
  duration_seconds: 90,
  aspect_ratio: '16:9',
  theme_id: 'minimal-mono',
  data: JSON.stringify({ description: 'Portfolio VSL showcasing Shirley Xu\'s design skills and projects' }),
});
console.log(`  ✓ Video: Wicked Good Design (ID: ${shirleyVideoId})`);

const shirleyScenes = [
  // --- Act 1: Hook & Identity (0-20s) ---
  {
    scene_number: 0, name: 'Hook - The Problem', scene_type: 'text-only',
    start_frame: 0, end_frame: 150, // 5s
    data: JSON.stringify({
      title: 'Some problems have no right answer',
      body_text: 'Only better or worse ones.',
      animation_preset: 'dramatic',
    }),
  },
  {
    scene_number: 1, name: 'Identity', scene_type: 'text-only',
    start_frame: 150, end_frame: 360, // 7s
    data: JSON.stringify({
      title: 'Shirley Xu',
      body_text: 'Product designer. Systems thinker. Builder of tools that make complex things clear.',
      animation_preset: 'reveal',
    }),
  },
  {
    scene_number: 2, name: 'Origin', scene_type: 'quote',
    start_frame: 360, end_frame: 600, // 8s
    data: JSON.stringify({
      quote: 'Someone didn\'t give up on me. That\'s why I build.',
      author: 'Shirley Xu',
      animation_preset: 'elegant',
    }),
  },

  // --- Act 2: Philosophy & Approach (20-50s) ---
  {
    scene_number: 3, name: 'Wicked Problems', scene_type: 'text-only',
    start_frame: 600, end_frame: 870, // 9s
    data: JSON.stringify({
      title: 'Wicked problems',
      body_text: 'The hardest design challenges are the ones where defining the problem is inseparable from solving it. That\'s where I work.',
      animation_preset: 'smooth',
    }),
  },
  {
    scene_number: 4, name: 'Systems Over Features', scene_type: 'text-only',
    start_frame: 870, end_frame: 1110, // 8s
    data: JSON.stringify({
      title: 'Systems over features',
      body_text: 'I don\'t design screens. I design feedback loops, information flows, and the structures that hold them together.',
      animation_preset: 'tracking',
    }),
  },
  {
    scene_number: 5, name: 'Research First', scene_type: 'text-only',
    start_frame: 1110, end_frame: 1350, // 8s
    data: JSON.stringify({
      title: 'Research before pixels',
      body_text: 'Every project starts with deep domain immersion. I read the papers, map the mechanisms, and find where communication breaks down.',
      animation_preset: 'cascade',
    }),
  },
  {
    scene_number: 6, name: 'The Gap', scene_type: 'quote',
    start_frame: 1350, end_frame: 1590, // 8s
    data: JSON.stringify({
      quote: 'There is a massive gap between finding a solution and communicating it. That gap is where design lives.',
      author: 'Design Philosophy',
      animation_preset: 'cinematic',
    }),
  },

  // --- Act 3: How I Work (50-75s) ---
  {
    scene_number: 7, name: 'Approach', scene_type: 'stats',
    start_frame: 1590, end_frame: 1890, // 10s
    data: JSON.stringify({
      title: 'How I Work',
      stats_text: 'Research | Deep-dive into the domain before touching pixels\nArchitect | Map systems, feedback loops, and information flows\nBuild | Full-stack implementation, not just mockups\nShip | Production systems used by real people',
      animation_preset: 'stacking',
    }),
  },
  {
    scene_number: 8, name: 'Range', scene_type: 'stats',
    start_frame: 1890, end_frame: 2160, // 9s
    data: JSON.stringify({
      title: 'Technical Range',
      stats_text: 'Interfaces | React, Next.js, TypeScript, Framer Motion\nVisualization | D3, Nivo, WebGL2, GLSL shaders\nSystems | Rust, WebAssembly, ECS architecture\nProduction | Remotion, FFmpeg, After Effects',
      animation_preset: 'cascade',
    }),
  },

  // --- Act 4: Close (75-90s) ---
  {
    scene_number: 9, name: 'What I Believe', scene_type: 'text-only',
    start_frame: 2160, end_frame: 2400, // 8s
    data: JSON.stringify({
      title: 'Clarity is the hardest thing to design',
      body_text: 'Deep content doesn\'t need complex interfaces. It needs someone who understands the content well enough to make it simple.',
      animation_preset: 'smooth',
    }),
  },
  {
    scene_number: 10, name: 'Promise', scene_type: 'quote',
    start_frame: 2400, end_frame: 2610, // 7s
    data: JSON.stringify({
      quote: 'I give people choices they wouldn\'t otherwise have, and help them align on shared outcomes when certainty isn\'t available.',
      author: 'Shirley Xu',
      animation_preset: 'elegant',
    }),
  },
  {
    scene_number: 11, name: 'CTA', scene_type: 'text-only',
    start_frame: 2610, end_frame: 2820, // 7s
    data: JSON.stringify({
      title: 'Wicked good design for wicked problems',
      body_text: 'shirleyxu.bio\ngithub.com/shirleyxu',
      animation_preset: 'flicker',
    }),
  },
];

for (const scene of shirleyScenes) {
  sceneDb.create({ video_id: shirleyVideoId, ...scene });
}
transitionDb.createDefaultsForVideo(shirleyVideoId, 'crossfade', 15);
console.log(`  ✓ ${shirleyScenes.length} scenes + transitions created`);

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('✅ Database seeded with 6 clients and 6 videos:');
console.log('='.repeat(60));
console.log(`  1. Aperture Science    — Volunteer Testing Initiative`);
console.log(`  2. Umbrella Corporation — Global Health Solutions`);
console.log(`  3. Shinra Electric     — Powering the Planet`);
console.log(`  4. Vault-Tec Corporation — Prepare for the Future`);
console.log(`  5. Abstergo Industries  — The Animus Experience`);
console.log(`  6. Shirley Xu          — Wicked Good Design ⭐`);
console.log('='.repeat(60));
console.log('\nYou can now:');
console.log('1. Start the render server: npm run render-server');
console.log('2. Open the Next.js app: cd app && npm run dev');
console.log('3. View clients and their demo videos\n');

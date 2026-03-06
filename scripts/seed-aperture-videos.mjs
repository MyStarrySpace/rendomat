import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'vsl-generator.db'));

function createVideo(clientId, title, themeId, aspectRatio, durationSec, scenesData) {
  const result = db.prepare(
    'INSERT INTO videos (client_id, title, composition_id, status, theme_id, aspect_ratio, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(clientId, title, 'DynamicScene', 'draft', themeId, aspectRatio, durationSec);
  const videoId = result.lastInsertRowid;

  let currentFrame = 0;
  for (let i = 0; i < scenesData.length; i++) {
    const s = scenesData[i];
    const endFrame = currentFrame + s.frames;
    db.prepare(
      'INSERT INTO scenes (video_id, scene_number, name, scene_type, start_frame, end_frame, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(videoId, i, s.name, s.type, currentFrame, endFrame, JSON.stringify(s.data));
    currentFrame = endFrame;
  }
  console.log(`Created video: ${title} (id: ${videoId}, ${scenesData.length} scenes)`);
  return videoId;
}

// Video 2: Portal Gun Product Launch
createVideo(1, 'Portal Gun - Product Launch', 'tech-dark', '16:9', 90, [
  { name: 'Hook', type: 'text-only', frames: 150, data: {
    title: 'What if you could be anywhere?',
    body_text: 'Introducing the Aperture Science Handheld Portal Device',
    animation_style: 'particles', animation_intensity: 'medium', animation_preset: 'dramatic', text_layout: 'centered'
  }},
  { name: 'The Problem', type: 'text-only', frames: 210, data: {
    title: 'Commuting is a waste of science',
    body_text: 'The average scientist wastes 47 minutes per day walking between labs. That is 47 minutes that could be spent doing science.',
    animation_style: 'grid-pulse', animation_intensity: 'low', animation_preset: 'smooth', text_layout: 'offset'
  }},
  { name: 'The Solution', type: 'text-only', frames: 240, data: {
    title: 'Point. Shoot. Arrive.',
    body_text: 'The Portal Gun creates a quantum-tunneled shortcut between any two surfaces made of moon rock or portal-conductive material.',
    animation_style: 'geometric', animation_intensity: 'medium', animation_preset: 'kinetic', text_layout: 'split'
  }},
  { name: 'Specs', type: 'stats', frames: 300, data: {
    title: 'Technical Specifications',
    stats_text: '0ms | Travel time between portals\n\u221E | Maximum portal distance\n1.4 kg | Device weight\n99.7% | Survival rate',
    animation_style: 'matrix', animation_intensity: 'low', animation_preset: 'cascade', text_layout: 'stacked'
  }},
  { name: 'Testimonial', type: 'quote', frames: 240, data: {
    quote: 'I have been testing the Portal Gun for months now. The portals work perfectly. The only side effect is a slight tingling sensation and occasional existential dread.',
    author: 'Test Subject #234 (Chell)',
    animation_style: 'aurora', animation_intensity: 'low', animation_preset: 'elegant', text_layout: 'bottom-left'
  }},
  { name: 'Safety', type: 'text-only', frames: 180, data: {
    title: 'Certified safe*',
    body_text: '*By Aperture Science internal standards. Do not look directly into operational end of device.',
    animation_style: 'bokeh', animation_intensity: 'low', animation_preset: 'minimal', text_layout: 'lower-third'
  }},
  { name: 'CTA', type: 'text-only', frames: 150, data: {
    title: 'Apply for early access',
    body_text: 'Limited to authorized test chambers. Cake will be served.*',
    animation_style: 'confetti', animation_intensity: 'high', animation_preset: 'burst', text_layout: 'full-bleed'
  }},
]);

// Video 3: GLaDOS AI Platform
createVideo(1, 'GLaDOS - AI-Powered Lab Management', 'corporate-blue', '16:9', 80, [
  { name: 'Hook', type: 'text-only', frames: 150, data: {
    title: 'Your lab needs a brain',
    body_text: 'And we built the smartest one.',
    animation_style: 'matrix', animation_intensity: 'medium', animation_preset: 'typewriter', text_layout: 'centered'
  }},
  { name: 'Problem', type: 'stats', frames: 270, data: {
    title: 'Lab management is broken',
    stats_text: '63% | Of experiments fail due to human error\n12 hrs | Average time lost to scheduling conflicts\n$4.2M | Yearly cost of inefficiency per facility',
    animation_style: 'grid-pulse', animation_intensity: 'low', animation_preset: 'stacking', text_layout: 'offset'
  }},
  { name: 'Introducing GLaDOS', type: 'text-only', frames: 210, data: {
    title: 'Genetic Lifeform and Disk Operating System',
    body_text: 'An AI that manages your entire facility. Test scheduling, resource allocation, subject tracking, and motivational announcements.',
    animation_style: 'geometric', animation_intensity: 'medium', animation_preset: 'spiral', text_layout: 'split'
  }},
  { name: 'Features', type: 'stats', frames: 300, data: {
    title: 'Core capabilities',
    stats_text: '24/7 | Facility monitoring and optimization\n0.003s | Decision-making response time\n100% | Uptime (neurotoxin backup power)\n\u221E | Patience with test subjects',
    animation_style: 'floating-shapes', animation_intensity: 'low', animation_preset: 'cascade', text_layout: 'stacked'
  }},
  { name: 'Quote', type: 'quote', frames: 240, data: {
    quote: 'GLaDOS has reduced our test completion time by 340%. She has also started writing poetry. It is actually quite good. And terrifying.',
    author: 'Doug Rattmann, Former Researcher',
    animation_style: 'aurora', animation_intensity: 'low', animation_preset: 'cinematic', text_layout: 'full-bleed'
  }},
  { name: 'CTA', type: 'text-only', frames: 150, data: {
    title: 'Schedule a demo',
    body_text: 'Let GLaDOS optimize your facility. She promises not to flood it with neurotoxin.',
    animation_style: 'bokeh', animation_intensity: 'medium', animation_preset: 'elegant', text_layout: 'centered'
  }},
]);

// Video 4: Repulsion Gel (Instagram Reel - vertical)
createVideo(1, 'Repulsion Gel - Move Different', 'vibrant-gradient', '9:16', 30, [
  { name: 'Hook', type: 'text-only', frames: 90, data: {
    title: 'BOUNCE',
    body_text: 'Higher. Faster. More science.',
    animation_style: 'confetti', animation_intensity: 'high', animation_preset: 'burst', text_layout: 'centered'
  }},
  { name: 'What', type: 'text-only', frames: 120, data: {
    title: 'Repulsion Gel',
    body_text: 'Originally a dietary supplement. Now a revolutionary mobility solution.',
    animation_style: 'waves', animation_intensity: 'medium', animation_preset: 'energetic', text_layout: 'stacked'
  }},
  { name: 'Stats', type: 'stats', frames: 150, data: {
    title: 'Performance',
    stats_text: '300% | Bounce height increase\n0 | Calories (now)\n\u221E | Fun factor',
    animation_style: 'geometric', animation_intensity: 'high', animation_preset: 'kinetic', text_layout: 'centered'
  }},
  { name: 'CTA', type: 'text-only', frames: 90, data: {
    title: 'Order now',
    body_text: 'Available in 5-gallon drums',
    animation_style: 'particles', animation_intensity: 'medium', animation_preset: 'dramatic', text_layout: 'full-bleed'
  }},
]);

// Video 5: Turret Product Line (Square - LinkedIn/IG)
createVideo(1, 'Aperture Turrets - Home Security Reimagined', 'artisanal-light', '1:1', 60, [
  { name: 'Hook', type: 'text-only', frames: 150, data: {
    title: 'Are you still there?',
    body_text: 'The friendliest home security system ever built.',
    animation_style: 'bokeh', animation_intensity: 'low', animation_preset: 'smooth', text_layout: 'centered'
  }},
  { name: 'Problem', type: 'text-only', frames: 180, data: {
    title: 'Traditional security is impersonal',
    body_text: 'Cameras just watch. Alarms just beep. You deserve a security system that cares.',
    animation_style: 'particles', animation_intensity: 'low', animation_preset: 'elegant', text_layout: 'offset'
  }},
  { name: 'Features', type: 'stats', frames: 240, data: {
    title: 'Sentry Turret v3.0',
    stats_text: '360\u00B0 | Detection radius\n65% | More bullets than v2.0\n99.1% | Target accuracy\n100% | Politeness rating',
    animation_style: 'floating-shapes', animation_intensity: 'medium', animation_preset: 'cascade', text_layout: 'stacked'
  }},
  { name: 'Testimonial', type: 'quote', frames: 210, data: {
    quote: 'I put one in my living room. It said hello to every guest. Then it opened fire. But very politely.',
    author: 'Satisfied Customer',
    animation_style: 'aurora', animation_intensity: 'low', animation_preset: 'cinematic', text_layout: 'bottom-left'
  }},
  { name: 'CTA', type: 'text-only', frames: 120, data: {
    title: 'Protect your home with science',
    body_text: 'Now available in designer colors: white, off-white, and eggshell.',
    animation_style: 'waves', animation_intensity: 'medium', animation_preset: 'burst', text_layout: 'full-bleed'
  }},
]);

console.log('\nDone! Added 4 new Aperture Science videos.');
db.close();

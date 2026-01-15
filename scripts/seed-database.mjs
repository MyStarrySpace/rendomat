import { clientDb, videoDb, sceneDb } from '../server/database.mjs';

console.log('Seeding database with Ultrahuman VSL...\n');

// Create Ultrahuman client
const ultrahumanId = clientDb.create({
  name: 'Ultrahuman',
  company: 'Ultrahuman',
  industry: 'Health Tech'
});

console.log(`✓ Created client: Ultrahuman (ID: ${ultrahumanId})`);

// Create Ultrahuman VSL video
const videoId = videoDb.create({
  client_id: ultrahumanId,
  title: 'Ultrahuman VSL - From Signals to Sense',
  composition_id: 'UltrahumanVSL',
  status: 'draft',
  duration_seconds: 345, // 5:45
  aspect_ratio: '16:9',
  data: {}
});

console.log(`✓ Created video: Ultrahuman VSL (ID: ${videoId})`);

// Scene definitions (30 fps)
const scenes = [
  {
    scene_number: 0,
    name: 'Cold Open',
    start_frame: 0,
    end_frame: 300, // 0:10
    data: { text: 'When health data multiplies, design changes.' }
  },
  {
    scene_number: 1,
    name: 'Respect the Ambition',
    start_frame: 300,
    end_frame: 1500, // 0:50
    data: { nodes: ['Ring', 'CGM', 'Blood', 'Environment'] }
  },
  {
    scene_number: 2,
    name: 'The Inflection Point',
    start_frame: 1500,
    end_frame: 3000, // 1:40
    data: {
      signals: [
        'Sleep ↓',
        'Glucose spike ↑',
        'Blood marker borderline',
        'Poor air quality'
      ]
    }
  },
  {
    scene_number: 3,
    name: 'Naming the Hidden Problem',
    start_frame: 3000,
    end_frame: 4800, // 2:40
    data: {}
  },
  {
    scene_number: 4,
    name: 'Dashboard-of-Dashboards Risk',
    start_frame: 4800,
    end_frame: 6000, // 3:20
    data: {}
  },
  {
    scene_number: 5,
    name: 'Reframing the Opportunity',
    start_frame: 6000,
    end_frame: 7800, // 4:20
    data: {
      stages: ['Signals', 'Interpretation', 'Decision', 'Action']
    }
  },
  {
    scene_number: 6,
    name: 'Why You\'re Reaching Out',
    start_frame: 7800,
    end_frame: 9300, // 5:10
    data: {}
  },
  {
    scene_number: 7,
    name: 'Soft Close',
    start_frame: 9300,
    end_frame: 10350, // 5:45
    data: {}
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

console.log('\n✅ Database seeded successfully!');
console.log('\nYou can now:');
console.log('1. Start the render server: npm run render-server');
console.log('2. Open the Next.js app: cd app && npm run dev');
console.log('3. Use the new client management interface\n');

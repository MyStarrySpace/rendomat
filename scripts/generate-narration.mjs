import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import elevenLabsPkg from 'elevenlabs-js';
const { ElevenLabsClient } = elevenLabsPkg;

async function generateNarration() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('\n⚠️  No ElevenLabs API key found');
    console.log('\nTo generate AI narration:');
    console.log('1. Sign up at https://elevenlabs.io (free tier available)');
    console.log('2. Get your API key from https://elevenlabs.io/app/settings/api-keys');
    console.log('3. Add it to your .env file:');
    console.log('   ELEVENLABS_API_KEY=your_actual_api_key');
    console.log('\n💡 The VSL video will work fine without narration!');
    console.log('   You can add voiceover later or use the on-screen text.\n');
    process.exit(0);
  }

  // Read the narration script
  const scriptPath = path.join(process.cwd(), 'scripts', 'ultrahuman-narration.json');
  const script = JSON.parse(await fs.readFile(scriptPath, 'utf8'));

  // Initialize ElevenLabs client
  const client = new ElevenLabsClient({ apiKey });

  // Voice ID for a professional, calm male voice
  // You can browse voices at: https://elevenlabs.io/voice-library
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice (default)

  console.log('Generating narration audio...');
  console.log(`Voice ID: ${voiceId}`);
  console.log(`Total scenes: ${script.scenes.length}`);

  // Create public audio directory if it doesn't exist
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  await fs.mkdir(audioDir, { recursive: true });

  // Combine all narration text
  const fullNarration = script.scenes
    .map(scene => scene.narration)
    .join(' ... '); // Add pauses between scenes

  try {
    console.log('\nGenerating full narration audio...');

    // Generate audio for the full narration
    const audio = await client.textToSpeech.convert(voiceId, {
      text: fullNarration,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    // Convert the audio stream to a buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save the audio file
    const outputPath = path.join(audioDir, 'ultrahuman-narration.mp3');
    await fs.writeFile(outputPath, audioBuffer);

    console.log(`\n✓ Audio generated successfully: ${outputPath}`);
    console.log(`  File size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

    // Also generate individual scene audio files for more precise control
    console.log('\nGenerating individual scene audio files...');

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      console.log(`  Scene ${scene.sceneId}: ${scene.name}...`);

      const sceneAudio = await client.textToSpeech.convert(voiceId, {
        text: scene.narration,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      const sceneChunks = [];
      for await (const chunk of sceneAudio) {
        sceneChunks.push(chunk);
      }
      const sceneBuffer = Buffer.concat(sceneChunks);

      const sceneOutputPath = path.join(audioDir, `scene-${scene.sceneId}.mp3`);
      await fs.writeFile(sceneOutputPath, sceneBuffer);

      console.log(`    ✓ Saved: scene-${scene.sceneId}.mp3 (${(sceneBuffer.length / 1024).toFixed(2)} KB)`);
    }

    console.log('\n✅ All narration audio files generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Move the audio files to your Next.js app/public directory');
    console.log('2. Update the UltrahumanVSL.tsx component to include the audio');
    console.log('3. Use Remotion\'s <Audio> component to sync audio with video');

  } catch (error) {
    console.error('\n❌ Error generating audio:');
    console.error(error.message);
    if (error.response) {
      console.error('API Response:', await error.response.text());
    }
    process.exit(1);
  }
}

// Run the generator
generateNarration().catch(console.error);

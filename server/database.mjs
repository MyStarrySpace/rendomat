import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.join(process.cwd(), 'data', 'vsl-generator.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      company TEXT NOT NULL,
      industry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      composition_id TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      duration_seconds INTEGER,
      aspect_ratio TEXT,
      data TEXT,
      output_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      scene_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      scene_type TEXT DEFAULT 'text-only',
      start_frame INTEGER NOT NULL,
      end_frame INTEGER NOT NULL,
      data TEXT,
      cache_path TEXT,
      cache_hash TEXT,
      cached_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      UNIQUE(video_id, scene_number)
    );

    CREATE TABLE IF NOT EXISTS render_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER,
      scene_id INTEGER,
      job_id TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'queued',
      progress REAL DEFAULT 0,
      error TEXT,
      output_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      from_scene_number INTEGER NOT NULL,
      to_scene_number INTEGER NOT NULL,
      transition_type TEXT DEFAULT 'crossfade',
      duration_frames INTEGER DEFAULT 20,
      config TEXT,
      cache_path TEXT,
      cache_hash TEXT,
      cached_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      UNIQUE(video_id, from_scene_number, to_scene_number)
    );

    CREATE TABLE IF NOT EXISTS audio_clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      original_filename TEXT,
      mime_type TEXT,
      file_size INTEGER,
      start_frame INTEGER NOT NULL DEFAULT 0,
      duration_frames INTEGER NOT NULL,
      source_duration_frames INTEGER NOT NULL,
      trim_start_frame INTEGER DEFAULT 0,
      trim_end_frame INTEGER,
      volume REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      normalized_path TEXT,
      original_filename TEXT,
      mime_type TEXT,
      file_size INTEGER,
      source_width INTEGER,
      source_height INTEGER,
      source_fps REAL,
      start_frame INTEGER NOT NULL DEFAULT 0,
      duration_frames INTEGER NOT NULL,
      source_duration_frames INTEGER NOT NULL,
      trim_start_frame INTEGER DEFAULT 0,
      trim_end_frame INTEGER,
      volume REAL DEFAULT 1.0,
      mute_audio INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_videos_client ON videos(client_id);
    CREATE INDEX IF NOT EXISTS idx_scenes_video ON scenes(video_id);
    CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_transitions_video ON transitions(video_id);
    CREATE INDEX IF NOT EXISTS idx_audio_clips_video ON audio_clips(video_id);
    CREATE INDEX IF NOT EXISTS idx_video_clips_video ON video_clips(video_id);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      stripe_session_id TEXT,
      video_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
  `);

  // Run migrations
  try {
    // Check if scene_type column exists, if not add it
    const tableInfo = db.prepare("PRAGMA table_info(scenes)").all();
    const hasSceneType = tableInfo.some(col => col.name === 'scene_type');

    if (!hasSceneType) {
      console.log('[database] Running migration: Adding scene_type column');
      db.exec(`ALTER TABLE scenes ADD COLUMN scene_type TEXT DEFAULT 'text-only'`);
    }

    // Check if render_progress column exists in videos table
    const videoTableInfo = db.prepare("PRAGMA table_info(videos)").all();
    const hasRenderProgress = videoTableInfo.some(col => col.name === 'render_progress');

    if (!hasRenderProgress) {
      console.log('[database] Running migration: Adding render_progress column');
      db.exec(`ALTER TABLE videos ADD COLUMN render_progress TEXT`);
    }

    // Check if theme_id column exists in videos table
    const hasThemeId = videoTableInfo.some(col => col.name === 'theme_id');

    if (!hasThemeId) {
      console.log('[database] Running migration: Adding theme_id column');
      db.exec(`ALTER TABLE videos ADD COLUMN theme_id TEXT DEFAULT 'tech-dark'`);
    }

    // Check if persona columns exist in clients table
    const clientTableInfo = db.prepare("PRAGMA table_info(clients)").all();
    const hasClientPersonas = clientTableInfo.some(col => col.name === 'default_personas');

    if (!hasClientPersonas) {
      console.log('[database] Running migration: Adding persona columns to clients table');
      db.exec(`ALTER TABLE clients ADD COLUMN default_personas TEXT`);
      db.exec(`ALTER TABLE clients ADD COLUMN default_behavior_overrides TEXT`);
    }

    // Check if persona columns exist in videos table (re-fetch after potential modifications)
    const videoTableInfo2 = db.prepare("PRAGMA table_info(videos)").all();
    const hasVideoPersonas = videoTableInfo2.some(col => col.name === 'personas');

    if (!hasVideoPersonas) {
      console.log('[database] Running migration: Adding persona columns to videos table');
      db.exec(`ALTER TABLE videos ADD COLUMN personas TEXT`);
      db.exec(`ALTER TABLE videos ADD COLUMN behavior_overrides TEXT`);
    }

    // Check if portfolio/research columns exist in clients table
    const clientTableInfo2 = db.prepare("PRAGMA table_info(clients)").all();
    const hasPortfolioUrl = clientTableInfo2.some(col => col.name === 'portfolio_url');

    if (!hasPortfolioUrl) {
      console.log('[database] Running migration: Adding portfolio and research columns to clients table');
      db.exec(`ALTER TABLE clients ADD COLUMN portfolio_url TEXT`);
      db.exec(`ALTER TABLE clients ADD COLUMN website_url TEXT`);
      db.exec(`ALTER TABLE clients ADD COLUMN cached_research TEXT`);
    }
  } catch (error) {
    console.error('[database] Migration error:', error);
  }

  console.log('[database] Initialized SQLite database at', dbPath);
}

initializeDatabase();

// Client operations
export const clientDb = {
  getAll() {
    return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(
      'INSERT INTO clients (name, company, industry, default_personas, default_behavior_overrides, portfolio_url, website_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.name,
      data.company,
      data.industry || null,
      data.default_personas ? JSON.stringify(data.default_personas) : null,
      data.default_behavior_overrides ? JSON.stringify(data.default_behavior_overrides) : null,
      data.portfolio_url || null,
      data.website_url || null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.company !== undefined) {
      updates.push('company = ?');
      values.push(data.company);
    }
    if (data.industry !== undefined) {
      updates.push('industry = ?');
      values.push(data.industry || null);
    }
    if (data.default_personas !== undefined) {
      updates.push('default_personas = ?');
      values.push(data.default_personas ? JSON.stringify(data.default_personas) : null);
    }
    if (data.default_behavior_overrides !== undefined) {
      updates.push('default_behavior_overrides = ?');
      values.push(data.default_behavior_overrides ? JSON.stringify(data.default_behavior_overrides) : null);
    }
    if (data.portfolio_url !== undefined) {
      updates.push('portfolio_url = ?');
      values.push(data.portfolio_url || null);
    }
    if (data.website_url !== undefined) {
      updates.push('website_url = ?');
      values.push(data.website_url || null);
    }
    if (data.cached_research !== undefined) {
      updates.push('cached_research = ?');
      values.push(data.cached_research ? JSON.stringify(data.cached_research) : null);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  }
};

// Video operations
export const videoDb = {
  getAll(clientId) {
    if (clientId) {
      return db.prepare('SELECT * FROM videos WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    }
    return db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO videos (client_id, title, composition_id, status, duration_seconds, aspect_ratio, data, theme_id, personas, behavior_overrides)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.client_id,
      data.title,
      data.composition_id,
      data.status || 'draft',
      data.duration_seconds || null,
      data.aspect_ratio || '16:9',
      data.data ? JSON.stringify(data.data) : null,
      data.theme_id || 'tech-dark',
      data.personas ? JSON.stringify(data.personas) : null,
      data.behavior_overrides ? JSON.stringify(data.behavior_overrides) : null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.data !== undefined) {
      updates.push('data = ?');
      values.push(JSON.stringify(data.data));
    }
    if (data.output_path !== undefined) {
      updates.push('output_path = ?');
      values.push(data.output_path);
    }
    if (data.theme_id !== undefined) {
      updates.push('theme_id = ?');
      values.push(data.theme_id);
    }
    if (data.personas !== undefined) {
      updates.push('personas = ?');
      values.push(data.personas ? JSON.stringify(data.personas) : null);
    }
    if (data.behavior_overrides !== undefined) {
      updates.push('behavior_overrides = ?');
      values.push(data.behavior_overrides ? JSON.stringify(data.behavior_overrides) : null);
    }
    if (data.render_progress !== undefined) {
      updates.push('render_progress = ?');
      values.push(data.render_progress);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE videos SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
  }
};

// Scene operations
export const sceneDb = {
  getAllForVideo(videoId) {
    return db.prepare('SELECT * FROM scenes WHERE video_id = ? ORDER BY scene_number').all(videoId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO scenes (video_id, scene_number, name, scene_type, start_frame, end_frame, data, cache_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id,
      data.scene_number,
      data.name,
      data.scene_type || 'text-only',
      data.start_frame,
      data.end_frame,
      data.data ? (typeof data.data === 'string' ? data.data : JSON.stringify(data.data)) : null,
      data.cache_hash || null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.scene_type !== undefined) {
      updates.push('scene_type = ?');
      values.push(data.scene_type);
    }
    if (data.data !== undefined) {
      updates.push('data = ?');
      values.push(typeof data.data === 'string' ? data.data : JSON.stringify(data.data));
    }
    if (data.start_frame !== undefined) {
      updates.push('start_frame = ?');
      values.push(data.start_frame);
    }
    if (data.end_frame !== undefined) {
      updates.push('end_frame = ?');
      values.push(data.end_frame);
    }
    if (data.scene_number !== undefined) {
      updates.push('scene_number = ?');
      values.push(data.scene_number);
    }
    if (data.cache_path !== undefined) {
      updates.push('cache_path = ?');
      values.push(data.cache_path);
    }
    if (data.cache_hash !== undefined) {
      updates.push('cache_hash = ?');
      values.push(data.cache_hash);
    }
    if (data.cached_at !== undefined) {
      updates.push('cached_at = ?');
      values.push(data.cached_at);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Invalidate cache when scene content is updated (and cache wasn't explicitly managed)
    if ((data.data !== undefined || data.scene_type !== undefined) && data.cache_path === undefined) {
      this.invalidateCache(id);
    }

    return this.getById(id);
  },

  updateCache(id, cachePath, cacheHash) {
    const stmt = db.prepare(`
      UPDATE scenes
      SET cache_path = ?, cache_hash = ?, cached_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(cachePath, cacheHash, id);
    return this.getById(id);
  },

  invalidateCache(id) {
    const stmt = db.prepare(`
      UPDATE scenes
      SET cache_path = NULL, cache_hash = NULL, cached_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  },

  delete(id) {
    db.prepare('DELETE FROM scenes WHERE id = ?').run(id);
  },

  recalculateFrames(videoId) {
    const scenes = db.prepare(
      'SELECT id, scene_number, start_frame, end_frame FROM scenes WHERE video_id = ? ORDER BY scene_number'
    ).all(videoId);

    let runningFrame = 0;
    for (const scene of scenes) {
      const duration = scene.end_frame - scene.start_frame;
      db.prepare(
        'UPDATE scenes SET start_frame = ?, end_frame = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(runningFrame, runningFrame + duration, scene.id);
      runningFrame += duration;
    }

    return db.prepare(
      'SELECT * FROM scenes WHERE video_id = ? ORDER BY scene_number'
    ).all(videoId);
  },

  reorderScene(sceneId, newSceneNumber) {
    const self = this;
    const reorder = db.transaction(() => {
      const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId);
      if (!scene) throw new Error('Scene not found');

      const oldSceneNumber = scene.scene_number;
      if (oldSceneNumber === newSceneNumber) {
        return db.prepare(
          'SELECT * FROM scenes WHERE video_id = ? ORDER BY scene_number'
        ).all(scene.video_id);
      }

      const videoId = scene.video_id;

      // Build scene_number -> scene_id map for transition remapping
      const allScenes = db.prepare(
        'SELECT id, scene_number FROM scenes WHERE video_id = ? ORDER BY scene_number'
      ).all(videoId);
      const sceneNumToId = new Map(allScenes.map(s => [s.scene_number, s.id]));

      // Load transitions before reorder
      const transitions = db.prepare(
        'SELECT * FROM transitions WHERE video_id = ?'
      ).all(videoId);

      // Map transitions to scene IDs
      const transitionsBySceneIds = transitions.map(t => ({
        id: t.id,
        fromId: sceneNumToId.get(t.from_scene_number),
        toId: sceneNumToId.get(t.to_scene_number),
      }));

      // Temporarily set moved scene to -1 to avoid UNIQUE conflict
      db.prepare(
        'UPDATE scenes SET scene_number = -1 WHERE id = ?'
      ).run(sceneId);

      // Shift other scenes one at a time to avoid UNIQUE constraint violations
      if (newSceneNumber < oldSceneNumber) {
        // Moving earlier: shift scenes in [new, old-1] up by 1, process from highest to lowest
        const toShift = db.prepare(
          'SELECT id, scene_number FROM scenes WHERE video_id = ? AND scene_number >= ? AND scene_number < ? ORDER BY scene_number DESC'
        ).all(videoId, newSceneNumber, oldSceneNumber);
        for (const s of toShift) {
          db.prepare('UPDATE scenes SET scene_number = ? WHERE id = ?').run(s.scene_number + 1, s.id);
        }
      } else {
        // Moving later: shift scenes in [old+1, new] down by 1, process from lowest to highest
        const toShift = db.prepare(
          'SELECT id, scene_number FROM scenes WHERE video_id = ? AND scene_number > ? AND scene_number <= ? ORDER BY scene_number ASC'
        ).all(videoId, oldSceneNumber, newSceneNumber);
        for (const s of toShift) {
          db.prepare('UPDATE scenes SET scene_number = ? WHERE id = ?').run(s.scene_number - 1, s.id);
        }
      }

      // Set moved scene to new number
      db.prepare(
        'UPDATE scenes SET scene_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(newSceneNumber, sceneId);

      // Recalculate frames
      self.recalculateFrames(videoId);

      // Remap transitions by scene ID
      const updatedScenes = db.prepare(
        'SELECT id, scene_number FROM scenes WHERE video_id = ? ORDER BY scene_number'
      ).all(videoId);
      const idToNewNum = new Map(updatedScenes.map(s => [s.id, s.scene_number]));

      for (const t of transitionsBySceneIds) {
        if (!t.fromId || !t.toId) continue;
        const newFrom = idToNewNum.get(t.fromId);
        const newTo = idToNewNum.get(t.toId);
        if (newFrom === undefined || newTo === undefined) continue;

        // Only keep transitions between adjacent scenes
        if (newTo === newFrom + 1) {
          db.prepare(
            'UPDATE transitions SET from_scene_number = ?, to_scene_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).run(newFrom, newTo, t.id);
        } else {
          db.prepare('DELETE FROM transitions WHERE id = ?').run(t.id);
        }
      }

      return db.prepare(
        'SELECT * FROM scenes WHERE video_id = ? ORDER BY scene_number'
      ).all(videoId);
    });
    return reorder();
  },
};

// Render job operations
export const renderJobDb = {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO render_jobs (video_id, scene_id, job_id, status, progress)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id || null,
      data.scene_id || null,
      data.job_id,
      data.status || 'queued',
      data.progress || 0
    );
    return result.lastInsertRowid;
  },

  update(jobId, data) {
    const updates = [];
    const values = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.progress !== undefined) {
      updates.push('progress = ?');
      values.push(data.progress);
    }
    if (data.error !== undefined) {
      updates.push('error = ?');
      values.push(data.error);
    }
    if (data.output_path !== undefined) {
      updates.push('output_path = ?');
      values.push(data.output_path);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(jobId);

    const stmt = db.prepare(`UPDATE render_jobs SET ${updates.join(', ')} WHERE job_id = ?`);
    stmt.run(...values);
  },

  getByJobId(jobId) {
    return db.prepare('SELECT * FROM render_jobs WHERE job_id = ?').get(jobId);
  }
};

// Transition operations
export const transitionDb = {
  getAllForVideo(videoId) {
    return db.prepare('SELECT * FROM transitions WHERE video_id = ? ORDER BY from_scene_number').all(videoId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM transitions WHERE id = ?').get(id);
  },

  getByScenes(videoId, fromSceneNumber, toSceneNumber) {
    return db.prepare(
      'SELECT * FROM transitions WHERE video_id = ? AND from_scene_number = ? AND to_scene_number = ?'
    ).get(videoId, fromSceneNumber, toSceneNumber);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO transitions (video_id, from_scene_number, to_scene_number, transition_type, duration_frames, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id,
      data.from_scene_number,
      data.to_scene_number,
      data.transition_type || 'crossfade',
      data.duration_frames || 20,
      data.config ? JSON.stringify(data.config) : null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.transition_type !== undefined) {
      updates.push('transition_type = ?');
      values.push(data.transition_type);
    }
    if (data.duration_frames !== undefined) {
      updates.push('duration_frames = ?');
      values.push(data.duration_frames);
    }
    if (data.config !== undefined) {
      updates.push('config = ?');
      values.push(data.config ? JSON.stringify(data.config) : null);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    // Invalidate cache when transition is updated
    updates.push('cache_path = NULL');
    updates.push('cache_hash = NULL');
    updates.push('cached_at = NULL');
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE transitions SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  updateCache(id, cachePath, cacheHash) {
    const stmt = db.prepare(`
      UPDATE transitions
      SET cache_path = ?, cache_hash = ?, cached_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(cachePath, cacheHash, id);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM transitions WHERE id = ?').run(id);
  },

  deleteAllForVideo(videoId) {
    db.prepare('DELETE FROM transitions WHERE video_id = ?').run(videoId);
  },

  // Create default transitions for a video (between all consecutive scenes)
  createDefaultsForVideo(videoId, defaultType = 'crossfade', defaultDuration = 20) {
    const scenes = db.prepare('SELECT scene_number FROM scenes WHERE video_id = ? ORDER BY scene_number').all(videoId);

    const created = [];
    for (let i = 0; i < scenes.length - 1; i++) {
      const fromScene = scenes[i].scene_number;
      const toScene = scenes[i + 1].scene_number;

      // Check if transition already exists
      const existing = this.getByScenes(videoId, fromScene, toScene);
      if (!existing) {
        const id = this.create({
          video_id: videoId,
          from_scene_number: fromScene,
          to_scene_number: toScene,
          transition_type: defaultType,
          duration_frames: defaultDuration,
        });
        created.push(id);
      }
    }
    return created;
  }
};

// Audio clip operations
export const audioClipDb = {
  getAllForVideo(videoId) {
    return db.prepare('SELECT * FROM audio_clips WHERE video_id = ? ORDER BY start_frame').all(videoId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM audio_clips WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO audio_clips (video_id, name, file_path, original_filename, mime_type, file_size, start_frame, duration_frames, source_duration_frames, trim_start_frame, trim_end_frame, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id,
      data.name,
      data.file_path,
      data.original_filename || null,
      data.mime_type || null,
      data.file_size || null,
      data.start_frame || 0,
      data.duration_frames,
      data.source_duration_frames,
      data.trim_start_frame || 0,
      data.trim_end_frame || null,
      data.volume ?? 1.0
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.start_frame !== undefined) { updates.push('start_frame = ?'); values.push(data.start_frame); }
    if (data.duration_frames !== undefined) { updates.push('duration_frames = ?'); values.push(data.duration_frames); }
    if (data.trim_start_frame !== undefined) { updates.push('trim_start_frame = ?'); values.push(data.trim_start_frame); }
    if (data.trim_end_frame !== undefined) { updates.push('trim_end_frame = ?'); values.push(data.trim_end_frame); }
    if (data.volume !== undefined) { updates.push('volume = ?'); values.push(data.volume); }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE audio_clips SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM audio_clips WHERE id = ?').run(id);
  },
};

// Video clip operations
export const videoClipDb = {
  getAllForVideo(videoId) {
    return db.prepare('SELECT * FROM video_clips WHERE video_id = ? ORDER BY start_frame').all(videoId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM video_clips WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO video_clips (video_id, name, file_path, normalized_path, original_filename, mime_type, file_size, source_width, source_height, source_fps, start_frame, duration_frames, source_duration_frames, trim_start_frame, trim_end_frame, volume, mute_audio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id,
      data.name,
      data.file_path,
      data.normalized_path || null,
      data.original_filename || null,
      data.mime_type || null,
      data.file_size || null,
      data.source_width || null,
      data.source_height || null,
      data.source_fps || null,
      data.start_frame || 0,
      data.duration_frames,
      data.source_duration_frames,
      data.trim_start_frame || 0,
      data.trim_end_frame || null,
      data.volume ?? 1.0,
      data.mute_audio ? 1 : 0
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.start_frame !== undefined) { updates.push('start_frame = ?'); values.push(data.start_frame); }
    if (data.duration_frames !== undefined) { updates.push('duration_frames = ?'); values.push(data.duration_frames); }
    if (data.trim_start_frame !== undefined) { updates.push('trim_start_frame = ?'); values.push(data.trim_start_frame); }
    if (data.trim_end_frame !== undefined) { updates.push('trim_end_frame = ?'); values.push(data.trim_end_frame); }
    if (data.volume !== undefined) { updates.push('volume = ?'); values.push(data.volume); }
    if (data.mute_audio !== undefined) { updates.push('mute_audio = ?'); values.push(data.mute_audio ? 1 : 0); }
    if (data.normalized_path !== undefined) { updates.push('normalized_path = ?'); values.push(data.normalized_path); }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE video_clips SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM video_clips WHERE id = ?').run(id);
  },
};

// User operations
export const userDb = {
  getById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  getByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  getByProvider(provider, providerId) {
    return db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId);
  },

  create(data) {
    const id = data.id || crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, image, provider, provider_id, credits)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.email,
      data.name || null,
      data.image || null,
      data.provider,
      data.provider_id,
      data.credits ?? 3
    );

    // Record signup bonus
    db.prepare(
      'INSERT INTO credit_transactions (user_id, amount, reason) VALUES (?, ?, ?)'
    ).run(id, 3, 'signup_bonus');

    return this.getById(id);
  },

  update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.image !== undefined) { updates.push('image = ?'); values.push(data.image); }
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
    if (data.credits !== undefined) { updates.push('credits = ?'); values.push(data.credits); }

    if (updates.length === 0) return this.getById(id);

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  upsert(data) {
    const existing = this.getByProvider(data.provider, data.provider_id);
    if (existing) {
      return this.update(existing.id, {
        name: data.name,
        image: data.image,
        email: data.email,
      });
    }
    return this.create(data);
  },

  adjustCredits(userId, amount, reason, extra = {}) {
    const txn = db.transaction(() => {
      const user = this.getById(userId);
      if (!user) throw new Error('User not found');
      if (amount < 0 && user.credits + amount < 0) {
        throw new Error('Insufficient credits');
      }

      db.prepare('UPDATE users SET credits = credits + ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(amount, userId);

      db.prepare(
        'INSERT INTO credit_transactions (user_id, amount, reason, stripe_session_id, video_id) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, amount, reason, extra.stripe_session_id || null, extra.video_id || null);

      return this.getById(userId);
    });
    return txn();
  },
};

// Credit transaction operations
export const creditTransactionDb = {
  getAllForUser(userId) {
    return db.prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM credit_transactions WHERE id = ?').get(id);
  },

  getByStripeSession(sessionId) {
    return db.prepare('SELECT * FROM credit_transactions WHERE stripe_session_id = ?').get(sessionId);
  },
};

export default db;

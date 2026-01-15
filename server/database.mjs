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

    CREATE INDEX IF NOT EXISTS idx_videos_client ON videos(client_id);
    CREATE INDEX IF NOT EXISTS idx_scenes_video ON scenes(video_id);
    CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
  `);

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
      'INSERT INTO clients (name, company, industry) VALUES (?, ?, ?)'
    );
    const result = stmt.run(data.name, data.company, data.industry || null);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE clients
      SET name = ?, company = ?, industry = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(data.name, data.company, data.industry || null, id);
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
      INSERT INTO videos (client_id, title, composition_id, status, duration_seconds, aspect_ratio, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.client_id,
      data.title,
      data.composition_id,
      data.status || 'draft',
      data.duration_seconds || null,
      data.aspect_ratio || '16:9',
      data.data ? JSON.stringify(data.data) : null
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
      INSERT INTO scenes (video_id, scene_number, name, start_frame, end_frame, data, cache_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id,
      data.scene_number,
      data.name,
      data.start_frame,
      data.end_frame,
      data.data ? JSON.stringify(data.data) : null,
      data.cache_hash || null
    );
    return result.lastInsertRowid;
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
  }
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

export default db;

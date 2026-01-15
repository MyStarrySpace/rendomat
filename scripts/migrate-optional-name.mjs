import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'data', 'vsl-generator.db');
const db = new Database(dbPath);

console.log('Migrating database to make client name optional...\n');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION;');

  // Create new clients table with optional name
  db.exec(`
    CREATE TABLE clients_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      company TEXT NOT NULL,
      industry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Copy data from old table to new table
  db.exec(`
    INSERT INTO clients_new (id, name, company, industry, created_at, updated_at)
    SELECT id, name, company, industry, created_at, updated_at
    FROM clients;
  `);

  // Drop old table and rename new one
  db.exec('DROP TABLE clients;');
  db.exec('ALTER TABLE clients_new RENAME TO clients;');

  // Commit transaction
  db.exec('COMMIT;');

  console.log('✓ Migration complete! Client name is now optional.');
} catch (error) {
  db.exec('ROLLBACK;');
  console.error('✗ Migration failed:', error.message);
  process.exit(1);
}

db.close();

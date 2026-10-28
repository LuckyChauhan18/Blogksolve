const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');

let dbInstance = null;
let isNativePostgres = false;

/**
 * Initializes and connects to PostgreSQL.
 * Uses native pg.Pool if process.env.DATABASE_URL is provided and reachable,
 * otherwise runs embedded WebAssembly PostgreSQL (PGlite) storing data in Backend/data/pgdata.
 */
const initPostgres = async () => {
  if (dbInstance) return dbInstance;

  const externalUrl = process.env.DATABASE_URL;

  if (externalUrl && !externalUrl.includes('placeholder')) {
    try {
      console.log('Connecting to external PostgreSQL server via Pool...');
      const pool = new Pool({ connectionString: externalUrl });
      const test = await pool.query('SELECT NOW() as current_time');
      console.log('Connected to External PostgreSQL:', test.rows[0].current_time);
      dbInstance = pool;
      isNativePostgres = true;
      await initSchema(pool);
      return pool;
    } catch (err) {
      console.warn('Could not connect to external PostgreSQL, falling back to embedded PostgreSQL:', err.message);
    }
  }

  // Embedded PostgreSQL engine (PGlite)
  const dataDir = path.join(__dirname, '..', 'data', 'pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Connecting to Embedded PostgreSQL (PGlite) stored at: ${dataDir}...`);
  const pgLite = new PGlite(dataDir);
  dbInstance = pgLite;
  isNativePostgres = false;

  await initSchema(pgLite);
  console.log('PostgreSQL schema and tables verified successfully!');
  return pgLite;
};

/**
 * Executes a SQL query with parameters regardless of pool or PGlite driver
 */
const query = async (text, params = []) => {
  if (!dbInstance) {
    await initPostgres();
  }
  return await dbInstance.query(text, params);
};

/**
 * Creates tables, foreign keys, and indexes if not already existing
 */
const initSchema = async (db) => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS blogs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      author_name VARCHAR(100) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      cover_image VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255);`,
    `CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS blog_tags (
      blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (blog_id, tag_id)
    );`,
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);`,
    `CREATE INDEX IF NOT EXISTS idx_comments_blog ON comments(blog_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);`,
    `CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`
  ];

  if (typeof db.exec === 'function') {
    await db.exec(statements.join('\n'));
  } else {
    for (const stmt of statements) {
      await db.query(stmt);
    }
  }
};

module.exports = {
  initPostgres,
  query
};

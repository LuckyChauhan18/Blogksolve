const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { initPostgres, query } = require('./config/postgres');

dotenv.config();

const seedPostgres = async () => {
  try {
    await initPostgres();

    // 1. Seed Admin User
    let adminResult = await query('SELECT * FROM users WHERE LOWER(email) = $1', ['admin@blogksolve.com']);
    let adminId;

    if (adminResult.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin@123', salt);
      const ins = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        ['Admin Lucky', 'admin@blogksolve.com', hash, 'admin']
      );
      adminId = ins.rows[0].id;
      console.log('✅ Admin user created in PostgreSQL: admin@blogksolve.com / Admin@123');
    } else {
      adminId = adminResult.rows[0].id;
      console.log('ℹ️ Admin user already exists in PostgreSQL.');
    }

    // 2. Seed Normal User
    let userResult = await query('SELECT * FROM users WHERE LOWER(email) = $1', ['user@blogksolve.com']);
    let userId;

    if (userResult.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('User@123', salt);
      const ins = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        ['Alex Reader', 'user@blogksolve.com', hash, 'user']
      );
      userId = ins.rows[0].id;
      console.log('✅ Normal user created in PostgreSQL: user@blogksolve.com / User@123');
    } else {
      userId = userResult.rows[0].id;
      console.log('ℹ️ Normal user already exists in PostgreSQL.');
    }

    // 3. Seed Sample Blogs if empty
    const blogCheck = await query('SELECT COUNT(*)::int as count FROM blogs');
    if (blogCheck.rows[0].count === 0) {
      const sampleBlogs = [
        {
          title: 'Modern Architecture Patterns with Node.js and PostgreSQL',
          author: 'Admin Lucky',
          userId: adminId,
          content: `Building scalable web applications requires a robust relational model. PostgreSQL provides unmatched ACID compliance, rich indexing capabilities (B-tree, GIN, GiST), JSONB support, and powerful analytical queries.\n\nIn this guide, we examine connection pooling with pg.Pool, relational schema design with foreign key constraints, and performance tuning for high-load production environments.`,
          summary: 'A deep dive into building resilient and scalable web architectures using Express and PostgreSQL.',
          tags: ['PostgreSQL', 'Nodejs', 'Architecture', 'Backend']
        },
        {
          title: 'The Art of Clean Frontends: Moving Beyond CSS Frameworks',
          author: 'Alex Reader',
          userId: userId,
          content: `Modern Vanilla CSS has evolved drastically with custom properties, flexbox, grid layouts, and hardware-accelerated animations. By establishing a unified design system with tokens, developers can produce ultra-fast, responsive user interfaces that stand out without the overhead of massive CSS utility frameworks.\n\nEmbrace glassmorphic accents, tailored typography, and smooth micro-interactions to deliver exceptional user journeys.`,
          summary: 'Discover how modern CSS design systems and purposeful micro-interactions create bespoke, memorable web experiences.',
          tags: ['Frontend', 'CSS', 'UI/UX', 'Design']
        },
        {
          title: 'Deep Dive into JWT Authentication & Role-Based Authorization',
          author: 'Admin Lucky',
          userId: adminId,
          content: `Security is paramount in web development. Learn how cryptographic signatures in JSON Web Tokens allow stateless session verification across distributed microservices, combined with robust role authorization checks to protect administrative routes.`,
          summary: 'Mastering authentication flow, secure token storage, and granular resource authorization.',
          tags: ['Security', 'Auth', 'JWT', 'Tutorial']
        }
      ];

      for (let item of sampleBlogs) {
        const blogIns = await query(
          `INSERT INTO blogs (title, content, summary, author_name, user_id, status)
           VALUES ($1, $2, $3, $4, $5, 'approved')
           RETURNING id`,
          [item.title, item.content, item.summary, item.author, item.userId]
        );
        const newBlogId = blogIns.rows[0].id;

        // Add tags
        for (let tagName of item.tags) {
          const tRes = await query(
            `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [tagName]
          );
          await query(
            `INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newBlogId, tRes.rows[0].id]
          );
        }

        // Add 1st-level comment and 2nd-level reply on the first blog!
        if (item.title.includes('PostgreSQL')) {
          const c1 = await query(
            `INSERT INTO comments (blog_id, user_id, parent_id, content)
             VALUES ($1, $2, NULL, $3)
             RETURNING id`,
            [newBlogId, userId, 'Fantastic explanation of PostgreSQL connection pooling and indexing! Really helped me understand the architecture.']
          );

          // Nested 2nd-level reply
          await query(
            `INSERT INTO comments (blog_id, user_id, parent_id, content)
             VALUES ($1, $2, $3, $4)`,
            [
              newBlogId,
              adminId,
              c1.rows[0].id,
              'Thank you Alex! Connection pooling keeps active database connections reusable and lightning fast under heavy load.'
            ]
          );
        }
      }
      console.log('✅ Sample blogs, tags, and threaded nested comments seeded into PostgreSQL!');
    } else {
      console.log(`ℹ️ PostgreSQL already contains ${blogCheck.rows[0].count} blogs.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('PostgreSQL Seed error:', err);
    process.exit(1);
  }
};

seedPostgres();

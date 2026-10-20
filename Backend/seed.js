const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Blog = require('./models/Blog');
const User = require('./models/User');

dotenv.config();

const seedDB = async () => {
  try {
    await connectDB();

    // 1. Seed Default Admin & Normal User
    let adminUser = await User.findOne({ email: 'admin@blogksolve.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Lucky',
        email: 'admin@blogksolve.com',
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@blogksolve.com / Admin@123');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    let normalUser = await User.findOne({ email: 'user@blogksolve.com' });
    if (!normalUser) {
      normalUser = await User.create({
        name: 'Alex Reader',
        email: 'user@blogksolve.com',
        password: 'User@123',
        role: 'user'
      });
      console.log('✅ Normal user created: user@blogksolve.com / User@123');
    } else {
      console.log('ℹ️ Normal user already exists.');
    }

    // 2. Seed Initial Blogs if empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.create([
        {
          title: 'Modern Architecture Patterns with Node.js and MongoDB',
          author: adminUser.name,
          user: adminUser._id,
          content: `Building modern web applications requires a thoughtful balance between developer agility, scalability, and code cleanliness. In this article, we explore how combining Express.js with MongoDB enables rapid prototyping while maintaining high throughput.\n\nKey advantages include schema flexibility, native JSON support, and straightforward horizontal scaling. As we evolve towards multi-tiered microservices, decoupling the presentation layer from the data persistence layer remains foundational.`,
          summary: 'A deep dive into building resilient and scalable web architectures using modern JavaScript and document databases.'
        },
        {
          title: 'The Art of Clean Frontends: Moving Beyond CSS Frameworks',
          author: normalUser.name,
          user: normalUser._id,
          content: `Modern Vanilla CSS has evolved drastically with custom properties, grid layouts, and hardware-accelerated animations. By establishing a unified design system with tokens, developers can produce ultra-fast, responsive user interfaces that stand out without the overhead of massive CSS utility frameworks.\n\nEmbrace glassmorphic accents, tailored typography, and smooth micro-interactions to deliver exceptional user journeys.`,
          summary: 'Discover how modern CSS design systems and purposeful micro-interactions create bespoke, memorable web experiences.'
        }
      ]);
      console.log('✅ Sample blogs seeded with user references.');
    } else {
      console.log(`ℹ️ Database already has ${blogCount} blogs.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Blog = require('./models/Blog');

dotenv.config();

const sampleBlogs = [
  {
    title: 'Modern Architecture Patterns with Node.js and MongoDB',
    author: 'Lucky Chauhan',
    content: `Building modern web applications requires a thoughtful balance between developer agility, scalability, and code cleanliness. In this article, we explore how combining Express.js with MongoDB enables rapid prototyping while maintaining high throughput.\n\nKey advantages include schema flexibility, native JSON support, and straightforward horizontal scaling. As we evolve towards multi-tiered microservices, decoupling the presentation layer from the data persistence layer remains foundational.`,
    summary: 'A deep dive into building resilient and scalable web architectures using modern JavaScript and document databases.'
  },
  {
    title: 'The Art of Clean Frontends: Moving Beyond CSS Frameworks',
    author: 'Sarah Chen',
    content: `Modern Vanilla CSS has evolved drastically with custom properties, grid layouts, and hardware-accelerated animations. By establishing a unified design system with tokens, developers can produce ultra-fast, responsive user interfaces that stand out without the overhead of massive CSS utility frameworks.\n\nEmbrace glassmorphic accents, tailored typography, and smooth micro-interactions to deliver exceptional user journeys.`,
    summary: 'Discover how modern CSS design systems and purposeful micro-interactions create bespoke, memorable web experiences.'
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    const count = await Blog.countDocuments();
    if (count === 0) {
      await Blog.insertMany(sampleBlogs);
      console.log('Sample blogs seeded successfully!');
    } else {
      console.log(`Database already has ${count} blogs, skipping seed.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();

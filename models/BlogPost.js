const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  content: String,
  excerpt: String,
  author: String,
  category: String,
  tags: [String],
  featured: { type: Boolean, default: false },
  image: String,
  views: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('BlogPost', blogPostSchema);

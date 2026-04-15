const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  fullName: String,
  role: { type: String, enum: ['SuperAdmin', 'Admin', 'Manager'], default: 'Admin' },
  permissions: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

module.exports = mongoose.model('Admin', adminSchema);

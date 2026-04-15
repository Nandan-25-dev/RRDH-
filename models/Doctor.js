const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  specialization: String,
  phone: String,
  email: { type: String, unique: true },
  licenseNumber: { type: String, unique: true },
  experience: Number,
  bio: String,
  password: String,
  profileImage: String,
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  consultationFee: Number,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);

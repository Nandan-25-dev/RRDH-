const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: String,
  firstName: String,
  lastName: String,
  phone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: String,
  medicalHistory: String,
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  registeredAt: { type: Date, default: Date.now },
  lastVisit: Date,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Patient', patientSchema);

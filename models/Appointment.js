const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true },
  patientId: mongoose.Schema.Types.ObjectId,
  patientName: String,
  patientPhone: String,
  patientEmail: String,
  doctorId: mongoose.Schema.Types.ObjectId,
  doctorName: String,
  date: Date,
  time: String,
  department: String,
  service: String,
  reason: String,
  medications: String,
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'], default: 'Pending' },
  notes: String,
  reminders: [{ sentAt: Date, type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for faster queries
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

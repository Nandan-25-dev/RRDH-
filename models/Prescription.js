const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: mongoose.Schema.Types.ObjectId,
  patientId: mongoose.Schema.Types.ObjectId,
  doctorId: mongoose.Schema.Types.ObjectId,
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  followUp: Date,
  notes: String,
  attachmentUrl: String,
  issuedAt: { type: Date, default: Date.now }
});

// Add indexes for faster queries
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ issuedAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);

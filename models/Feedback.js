const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  patientId: mongoose.Schema.Types.ObjectId,
  patientName: String,
  email: String,
  type: { type: String, enum: ['Service', 'Doctor', 'Facility', 'Staff', 'General'], default: 'General' },
  rating: { type: Number, min: 1, max: 5 },
  subject: String,
  message: String,
  departmentId: mongoose.Schema.Types.ObjectId,
  doctorId: mongoose.Schema.Types.ObjectId,
  attachments: [String],
  status: { type: String, enum: ['New', 'Reviewed', 'Resolved', 'Closed'], default: 'New' },
  response: String,
  respondedBy: String,
  respondedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: mongoose.Schema.Types.ObjectId,
  recipientType: { type: String, enum: ['Patient', 'Doctor', 'Admin'], default: 'Patient' },
  type: { type: String, enum: ['Appointment', 'Payment', 'Message', 'Reminder', 'System'] },
  title: String,
  message: String,
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  readAt: Date,
  sentAt: { type: Date, default: Date.now },
  expiresAt: Date
});

// Add indexes for faster queries
notificationSchema.index({ recipientId: 1, sentAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

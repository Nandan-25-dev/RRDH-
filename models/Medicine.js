const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  manufacturer: String,
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  dosage: String,
  type: { type: String, enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'] },
  description: String,
  sideEffects: String,
  warnings: String,
  expiryDate: Date,
  batchNumber: String,
  stockAlert: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medicine', medicineSchema);

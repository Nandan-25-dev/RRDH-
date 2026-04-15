const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  appointmentId: mongoose.Schema.Types.ObjectId,
  patientId: mongoose.Schema.Types.ObjectId,
  patientName: String,
  amount: Number,
  description: String,
  paymentMethod: { type: String, enum: ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Stripe'], default: 'Cash' },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  stripePaymentId: String,
  transactionId: String,
  dueDate: Date,
  paidDate: Date,
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for faster queries
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

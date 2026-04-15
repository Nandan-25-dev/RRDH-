const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [{
    itemType: { type: String, enum: ['Service', 'Medicine'] },
    itemId: mongoose.Schema.Types.ObjectId,
    name: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number
  }],
  subtotal: Number,
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: Number,
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Online', 'Cheque'], default: 'Cash' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Refunded'], default: 'Pending' },
  dueDate: Date,
  paidDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

module.exports = mongoose.model('Invoice', invoiceSchema);

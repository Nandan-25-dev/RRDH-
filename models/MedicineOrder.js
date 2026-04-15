const mongoose = require('mongoose');

const medicineOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  medicines: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    name: String,
    quantity: { type: Number, required: true },
    dosage: String,
    price: Number,
    subtotal: Number
  }],
  totalAmount: Number,
  orderStatus: { type: String, enum: ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash on Delivery', 'Online', 'Card', 'UPI'] },
  deliveryAddress: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  prescriptionAttached: Boolean,
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicineOrder', medicineOrderSchema);

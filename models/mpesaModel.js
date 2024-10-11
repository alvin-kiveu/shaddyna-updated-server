const mongoose = require('mongoose');

// Define the schema for the mpesa
const mpesaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  accountReference: {
    type: String,
    required: true
  },
  TransactionID: {
    type: String,
    default: '' // Initially empty, to be updated after the transaction is completed
  },
  CheckoutRequestID: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// Create the model using the schema
const Mpesa = mongoose.model('mpesa', mpesaSchema);

module.exports = Mpesa;

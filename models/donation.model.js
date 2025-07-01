import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [1, 'Donation amount must be at least 1'],
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR'], // Extend as needed
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true,
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'Netbanking', 'Wallet', 'Other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
    description: 'If true, donor name is hidden from NGO in dashboard/emails',
  },
  message: {
    type: String, // Optional note from donor
  },
  receiptUrl: {
    type: String, // Optional: link to payment receipt
  },
  donatedAt: {
    type: Date,
    default: Date.now,
  },
  // purpose means if donated to project/campaign then its Id
  campaignId:{
    type:String,
  },
  feedback: {
    type: String, // Optional feedback from donor after donation
    maxlength: 500, // Limit feedback length
    trim: true, // Remove leading/trailing whitespace
  },
}, {
  timestamps: true
});

const DonationModel = mongoose.model('Donation', donationSchema);
export default DonationModel;

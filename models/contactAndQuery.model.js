import mongoose from "mongoose";

const contactAndQuerySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'admin'],
    required: true,
  },
  phone:{
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['general', 'phone', 'partnership', 'report'],
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  createdAt: {
    type:String,
    trim: true,
  },
  feedback:{
    type: String,
    trim: true,
  },
});

const ContactAndQueryModel = mongoose.model("ContactAndQuery", contactAndQuerySchema);
export default ContactAndQueryModel;
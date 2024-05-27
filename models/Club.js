const mongoose = require('mongoose')

const clubSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: 'Please provide a user'
    },
    name: {
      type: String,
      required: 'Please provide a name for the club you want to create',
      trim: true,
      unique: 'A club with this name already exists',
      min: 3,
      max: 200,
      text: true
    },
    description: {
      type: String,
      required: 'Please provide a description for the club you want to create',
      trim: true,
      min: 50,
      max: 1000,
      text: true
    },
    executives: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Executive'
    },
    followers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Follow'
    },
    reviews: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    assets: {
      banner: { url: String, secure_url: String, signature: String },
      image: { url: String, secure_url: String, signature: String }
    },
    approval: {
      type: String,
      default: 'pending',
      enum: ['pending', 'approved', 'disapproved']
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

clubSchema.index({ name: 'text', description: 'text' })

mongoose.model('Club', clubSchema)
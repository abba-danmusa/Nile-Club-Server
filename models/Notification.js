const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    type: {
      type: String,
      enum: ['Post', 'Event'],
      required: true
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'type',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Notification', notificationSchema)
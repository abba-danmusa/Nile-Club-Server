const mongoose = require('mongoose')

const followSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: 'Please provide a club'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: 'Please provide a user'
    },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Follow', followSchema)
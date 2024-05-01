const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
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
    content: {
      type: String,
      trim: true,
      required: 'Please write some comments'
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Comment', commentSchema)
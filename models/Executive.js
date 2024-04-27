const mongoose = require('mongoose')

const executivesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    },
    role: {
      type: String,
      required: 'Please provide a role for the executive'
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Executive', executivesSchema)
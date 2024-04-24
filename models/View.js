const mongoose = require('mongoose')

const viewSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: 'Please provide a chat id'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: 'Please provide the user id'
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('View', viewSchema)
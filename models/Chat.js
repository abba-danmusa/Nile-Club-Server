const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: 'Please provide a club'
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: 'Please provide a user'
    },
    viewedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    id: Number,
    client_offset: String,
    content: String,
    timeSent: Date,
    // isMyMessage: Boolean
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

let cache = {}
chatSchema.pre('save', async function (next) {
  const user = this
  if (!user.isModified('id')) {
    return next()
  }

  if (!cache.id) {
    cache.id = await this.constructor.countDocuments()
  }
  cache.id++
  user.id = cache.id
  next()
})

mongoose.model('Chat', chatSchema)
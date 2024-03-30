const mongoose = require('mongoose')
            
const categorySchema = new mongoose.Schema({title: String})
const imagesSchema = new mongoose.Schema(
  {
    url: String,
    secure_url: String,
    signature: String
  }
)

const videosSchema = new mongoose.Schema(
  {
    url: String,
    secure_url: String,
    signature: String
  }
)

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    category: mongoose.Schema.Types.Array,
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assets: {
      images: [imagesSchema],
      videos: [videosSchema]
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Event', eventSchema)
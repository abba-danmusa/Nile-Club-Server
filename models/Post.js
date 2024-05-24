const mongoose = require('mongoose')
            
const categorySchema = new mongoose.Schema({ title: String })

const assetsSchema = new mongoose.Schema(
  {
    url: String,
    secure_url: String,
    signature: String,
    public_id: String,
    resource_type: String,
    type: String,
    format: String,
    version: Number,
    width: Number,
    height: Number,
    bytes: Number,
    duration: Number,
    created_at: Date,
    access_mode: String,
    id: String,
    folder_id: String
  }
)

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      required: 'Please input some content'
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
    category: [categorySchema],
    assets: [assetsSchema],
    likes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Like'
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

mongoose.model('Post', postSchema)
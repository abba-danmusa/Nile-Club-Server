const mongoose = require('mongoose')

const Event = mongoose.model('Event')

exports.getFeeds = async (req, res) => {
  const feeds = await Event.find({})

  res.status(200).json({
    status: 'success',
    message: 'feeds retrieved successfully',
    feeds
  })
}
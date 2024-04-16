const mongoose = require('mongoose')

const Event = mongoose.model('Event')

exports.getFeeds = async (req, res) => {
  const feeds = await Event.aggregate([
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    { $sort: { createdAt: -1 } }
  ])

  res.status(200).json({
    status: 'success',
    message: 'feeds retrieved successfully',
    feeds
  })
}
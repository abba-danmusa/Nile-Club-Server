const mongoose = require('mongoose')

const ObjectId = require('mongodb').ObjectId

const Notification = mongoose.model('Notification')

exports.getNotifications = async (req, res) => {
  
  const userId = new ObjectId(req.user._id)

  const notifications = await Notification.aggregate([
    {
      $match: {
        user: userId
      }
    },
    {
      $lookup: {
        from: 'events',
        localField: 'content',
        foreignField: '_id',
        as: 'events'
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'content',
        foreignField: '_id',
        as: 'posts'
      }
    },
    { $unwind: { path: '$events', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$posts', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    { $unwind: '$club'}
  ])

  res.status(200).json({
    status: 'success',
    message: 'Retrieved successfully',
    notifications
  })
}
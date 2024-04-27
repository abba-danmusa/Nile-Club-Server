const mongoose = require('mongoose')

const ObjectId = require('mongodb').ObjectId

const Event = mongoose.model('Event')

exports.getFeeds = async (req, res) => {
  const feeds = await Event.aggregate([
    {
      $lookup: {
        from: 'clubs',
        let: { userId: new ObjectId(req.user._id), clubId: '$club' },
        pipeline: [
          { $match: { $expr: ['$_id', '$$clubId'] } },
          {
            $lookup: {
              from: 'follows',
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ['$club', '$$clubId'] } },
                      { $expr: { $eq: ['$user', '$$userId'] } },
                    ]
                  }
                }
              ],
              as: 'follows'
            },
          },
          {
            $unwind: {
              path: '$follows',
              preserveNullAndEmptyArrays: true
            }
          }
        ],
        as: 'club'
      }
    },
    {
      $unwind: '$club'
    },
    { $sort: { createdAt: -1 } }
  ])

  res.status(200).json({
    status: 'success',
    message: 'feeds retrieved successfully',
    feeds
  })
}
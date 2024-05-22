const mongoose = require('mongoose')

const ObjectId = require('mongodb').ObjectId

const Event = mongoose.model('Event')

exports.getFeeds = async (req, res) => {
  
  const userId = req.user._id;

  const feeds = await Event.aggregate([
    // Match events based on certain criteria if needed
    // {
    //   $match: { /* Your criteria here */ }
    // },
    // Populate the club field to get club details
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    // Unwind the club array to flatten it
    { $unwind: '$club' },
    // Add a field like: true if the user likes the event
    {
      $lookup: {
        from: 'likes',
        let: { eventId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$event', '$$eventId'] },
                  { $eq: ['$user', userId] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'like'
      }
    },
    {
      $addFields: {
        like: {
          $cond: {
            if: { $gt: [{ $size: '$like' }, 0] },
            then: true, else: false
          }
        }
      }
    },
    // Add a field follow: true if the user follows the club
    {
      $lookup: {
        from: 'follows',
        let: { clubId: '$club._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$club', '$$clubId'] },
                  { $eq: ['$user', userId] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'follow'
      }
    },
    {
      $addFields: {
        follow: {
          $cond: {
            if: { $gt: [{ $size: '$follow' }, 0] },
            then: true, else: false
          }
        }
      }
    },
    // Lookup the first 5 users who liked each event
    {
      $lookup: {
        from: 'likes',
        let: { eventId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$event', '$$eventId'] }
            }
          },
          { $limit: 5 }, // Limit to the first 5 likes
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: '$user._id',
              firstName: '$user.firstName',
              lastName: '$user.lastName',
              asset: '$user.asset'
            }
          }
        ],
        as: 'likes'
      }
    },
    // Add a field to count the total number of likes for each event
    {
      $addFields: {
        totalLikes: { $size: '$likes' }
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

exports.discover = async (req, res) => {
  const discover = await Clubs
}
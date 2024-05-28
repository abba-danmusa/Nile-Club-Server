const mongoose = require('mongoose')

const Event = mongoose.model('Event')
const Like = mongoose.model('Like')
const Club = mongoose.model('Club')

const ObjectId = require('mongodb').ObjectId

/**
 * Creates a new event.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Promise}
 */
exports.createEvent = async (req, res) => {
  
  const clubId = new ObjectId(req.user.club)

  const clubIsApproved = await Club.findOne({
    _id: clubId,
    approval: 'approved'
  })

  if (!clubIsApproved) {
    return res.status(200).json({
      status: 'success',
      message: 'You cannot create an event until your club is approved',
    })
  }

  req.body.creator = req.user._id
  req.body.club = req.user.club

  const event = new Event(req.body)

  const followers = await Follow.find(
    { club: clubId, user: { $ne: req.user._id } },
    { _id: 1 }
  )

  const bulkOps = followers.map(follower => ({
    insertOne: {
      document: {
        user: follower._id,
        club: req.user.club,
        type: 'Event',
        content: event._id,
        isRead: false,
      }
    }
  }))

  const eventPromise = event.save()
  const notificationsPromise = Notification.bulkWrite(bulkOps)

  const [newEvent] = await Promise.all([eventPromise, notificationsPromise])

  res.status(200).json({
    status: "success",
    message: "Event successfully created",
    event: newEvent,
  });
};

exports.updateEvent = async (req, res) => {
  const {_id, ...fieldsToUpdate} = req.body
  req.body._id = undefined

  await Event.findOneAndUpdate(
    { _id: new ObjectId(_id) },
    { ...fieldsToUpdate },
    { new: true, runValidators: true }
  )
  res.status(200).json({
    status: 'success',
    message: 'Event updated successfully'
  })
}

exports.addToSetLike = async (req, res) => {
  const eventId = req.body.eventId

  let unlike
  let like

  unlike = await Like.findOneAndDelete({
    event: new ObjectId(eventId),
    user: new ObjectId(req.user._id)
  })

  if (!unlike) {
    like = new Like({ event: eventId, user: req.user._id })
    await like.save()
  }

  res.status(200).json({
    status: 'success',
    message: `Success`,
    like
  })
}

exports.getEvents = async (req, res) => {
  const clubId = req.user.club
  const userId = req.user._id
  
  if (!clubId) {
    return res.status(402).json({
      status: 'success',
      message: 'You are not allowed to perform this operation'
    })
  }

  const events = await Event.aggregate([
    // Match events based on certain criteria if needed
    {
      $match: { club: new ObjectId(clubId) }
    },
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
    }
  ])
  res.status(200).json({
    status: 'success',
    message: 'Events retrieved successfully',
    events
  })
}

const mongoose = require('mongoose')
const cloudinary = require('../helpers/cloudinary')
const router = require('../routes/club')

const ObjectId = require('mongodb').ObjectId

const Club = mongoose.model('Club')
const Event = mongoose.model('Event')
const Follow = mongoose.model('Follow')
const Review = mongoose.model('Review')
const Comment = mongoose.model('Comment')
const Executive = mongoose.model('Executive')

exports.createClub = async (req, res) => {
  
  // getting the data from the user input (from the club creator)
  const { name, description, assets } = req.body
  
  // creating and saving the club to the database
  const club = new Club({ name, description, assets, user: req.user._id })
  await club.save()

  // Be the executive of your club
  const executive = new Executive({
    user: req.user._id,
    club: club?._id,
    role: 'President'
  })
  // Follow your club
  const follower = new Follow({ club: club?._id, user: req.user._id })
  // save the newly created club in the user doc
  req.user.club = club._id

  // save them all to the database
  await Promise.all([executive.save(), follower.save(), req.user.save()])

  // responding to the user the status of their request. And if there is an error, our error handler will catch it and respond accordingly
  res.status(200).json({
    status:'success',
    message: 'Your application has been sent successfully and is now awaiting approval',
    club,
    user: req.user
  })
}

exports.followingClub = async (req, res) => {
  const following = await Follow.findOne({
    user: req.user._id,
    club: req.query.clubId
  })
  res.status(200).json({
    status:'success',
    message: 'following',
    following
  })
}

exports.followClub = async (req, res) => {
  
  const clubId = req.body.clubId

  const following = await Follow.findOneAndDelete({
    club: new ObjectId(clubId),
    user: req.user._id
  })

  if (following) {
    return res.status(200).json({
      status: 'success',
      message: 'Un followed',
      following
    })
  }
  
  const follow = new Follow({ club: clubId, user: req.user._id })
  await follow.save()
  res.status(200).json({
    status: 'success',
    message: 'following', // DON'T CHANGE THIS MESSAGE; THE APP DEPENDS ON IT
    follow
  })
}

exports.getClub = async (req, res) => {
  
  const clubId = req.query.clubId
  const [club] = await Club.aggregate([
    { $match: { _id: new ObjectId(clubId) } },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: 'club',
        as: 'events',
      }
    },
    {
      $lookup: {
        from: 'clubs',
        pipeline: [
          { $match: {} }
        ],
        as: 'featuredClubs',
      }
    },
    {
      $lookup: {
        from: 'follows',
        let: {
          clubId: new ObjectId(clubId),
          userId: new ObjectId(req.user._id)
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$club', '$$clubId'] },
                  { $eq: ['$user', '$$userId'] } // doesn't work? userId
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'follows'
      }
    },
    {
      $addFields: {
        follows: {
          $cond: {
            if: { $gt: [{ $size: '$follows' }, 0] },
            then: true, else: false
          }
        }
      }
    },
    {
      $lookup: {
        from: 'follows',
        let: { clubId: new ObjectId(clubId) },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$club', '$$clubId']}
            }
          },
        ],
        as: 'members',
      }
    },
    {
      $lookup: {
        from: 'executives',
        let: { clubId: new ObjectId(clubId) },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$club", "$$clubId"] }
            }
          },
          {
            $project: {
              user: 1,
              club: 1,
              role: 1
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' }
        ],
        as: 'executives'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'club',
        as: 'reviews'
      }
    },
    // Unwind the reviews array
    { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
    // Group reviews by club ID and calculate the average review score
    {
      $group: {
        _id: '$_id',
        ratings: { $avg: '$reviews.review' }, // Calculate the average review score
        numberOfReviews: { $sum: 1},
        club: { $first: '$$ROOT' }, // Include the entire club document
        // reviews: { $push: '$reviews' }, // Add the reviews array to the group
      }
    },
    {
      $replaceRoot: { newRoot: { $mergeObjects: ['$club', '$$ROOT'] } }
    },
    {
      $project: {
        club: 0,
      },

    }
  ])

  res.status(200).json({
    status: 'success',
    message: 'Club retrieved successfully',
    club
  })
}

exports.createComment = async (req, res) => {
  const comment = new Comment({ user: req.user._id, ...req.body })
  await comment.save()

  res.status(200).json({
    status: 'success',
    message: 'Comment created successfully',
    comment
  })
}

exports.getComments = async (req, res) => {
  const comments = await Comment.aggregate([
    {
      $match: {
        club: new ObjectId(req.query.clubId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ])

  res.status(200).json({
    status: 'success',
    message: 'Comments retrieved successfully',
    comments
  })
}

exports.featuredClubs = async (req, res) => {
  
  const featuredClubs = await Club.aggregate([
    {
      $match: {approval: 'approved'}
    },
  ])

  res.status(200).json({
    status: 'success',
    message: 'Featured clubs retrieved successfully',
    featuredClubs
  })
}

exports.newsAndAnnouncement = async (req, res) => {
  const feeds = await Event.aggregate([
    {
      $match: {
        $expr: { $eq: ['$club', new ObjectId(req.query.clubId)] }
      },
    },
    // Add a field like: true if the user likes the event
    {
      $lookup: {
        from: 'likes',
        let: { eventId: '$_id', userId: new ObjectId(req.user._id) },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$event', '$$eventId'] },
                  { $eq: ['$user', '$$userId'] }
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
    message: 'News and Announcements retrieved successfully',
    feeds
  })
}

exports.getMembers = async (req, res) => {
  const clubId = req.query.clubId
  console.log(clubId)
  const members = await Follow.aggregate([
    { $match: { club: new ObjectId( clubId || req.user.club) } }, // Match followers of the specified club
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    }, // Populate the user field
    { $unwind: '$user' }, // Unwind the user array
    {
      $lookup: {
        from: 'executives',
        let: { userId: '$user._id', clubId: '$club' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$userId'] },
                  { $eq: ['$club', '$$clubId'] },
                ]
              }
            }
          }
        ],
        as: 'role'
      }
    }, // Lookup the role in the executives collection
    {
      $unwind: { path: '$role', preserveNullAndEmptyArrays: true }
    }, // Unwind the role array
    {
      $addFields: {
        'user.role': '$role.role' // Add the role field to the user object
      }
    },
    {
      $project: {
        'role': 0 // Exclude the role field from the output
      }
    }
  ])
  
  res.status(200).json({
    status: 'success',
    message: 'Members retrieved successfully',
    members
  })
}

exports.assignRole = async (req, res) => {
  let executive = await Executive.findOneAndUpdate(
    { user: req.body.userId, club: req.user.club },
    { role: req.body.role },
    { runValidators: true, new: true }
  ).exec()

  if (!executive) {
    executive = new Executive({
      user: req.body.userId,
      club: req.user.club,
      role: req.body.role
    })
    await executive.save()
  }

  res.status(200).json({
    status: 'success',
    message: 'Role assigned successfully',
    executive
  })
}

exports.review = async (req, res) => {
  const { clubId: club, review: rating } = req.body
  const user = req.user._id
  const hasReview = await Review.findOne({
    user: new ObjectId(req.user._id),
    club: new ObjectId(club)
  })
  if (hasReview) {
    return res.status(402).json({
      status: 'error',
      message: 'Sorry, you can only rate a club once',
      review: hasReview
    })
  }
  const review = new Review({ user, club, review: rating })
  await review.save()
  res.status(200).json({
    status: 'success',
    message: 'Thanks for the rate!',
    review
  })
}

exports.getClubs = async (req, res) => {
  
  const clubs = await Club.aggregate([
    {
      $match: { approval: 'pending' }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {$unwind: '$user'}
  ])

  res.status(200).json({
    status: 'success',
    message: 'retrieved successfully',
    clubs
  })
}

exports.approveClub = async (req, res) => {
  const clubId = req.body.clubId
  await Club.findOneAndUpdate(
    { _id: new ObjectId(clubId) },
    { approval: 'approved' },
    { new: true, runValidators: true }
  )

  res.status(200).json({
    status: 'success',
    message: 'Approved successfully',
  })
}

exports.cloudinarySignature = async (req, res) => {
  const timestamp = Math.round((new Date).getTime() / 1000)

  const signature = cloudinary.utils.api_sign_request({
    timestamp: timestamp,
    source: 'uw',
    folder: 'businesses_menu'
  }, process.env.CLOUDINARY_SECRET_API)

  res.status(200).json({
    status: 'success',
    message: 'Signature generated successfully',
    signature,
    timestamp
  })
}
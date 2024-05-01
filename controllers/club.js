const mongoose = require('mongoose')
const cloudinary = require('../helpers/cloudinary')

const ObjectId = require('mongodb').ObjectId

const Club = mongoose.model('Club')
const Event = mongoose.model('Event')
const Follow = mongoose.model('Follow')
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
    club
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
          userId: new ObjectId(req.user._id),
          clubId: new ObjectId(clubId)
        },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$user', '$$userId'] } },
                { $expr: { $eq: ['$club', '$$clubId'] } }
              ]
            }
          },
        ],
        as: 'member',
      }
    },
    {
      $unwind: { path: '$member', preserveNullAndEmptyArrays: true }
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
      $match: {}
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
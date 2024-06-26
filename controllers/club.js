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

exports.editClub = async (req, res) => {
  const { _id, ...updatedFields } = req.body
  
  const club = await Club.findOneAndUpdate(
    { _id: new ObjectId(_id) },
    { ...updatedFields },
    { runValidators: true, new: true }
  ).exec()
  
  res.status(200).json({
    status: 'success',
    message: 'Club updated successfully',
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
    await Executive.findOneAndDelete({
      club: new ObjectId(clubId),
      user: req.user._id
    })
    return res.status(200).json({
      status: 'success',
      message: 'Unfollowed successfully',
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
        from: 'posts',
        localField: '_id',
        foreignField: 'club',
        as: 'posts',
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
      $match: { approval: 'approved' }
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
        numberOfReviews: { $sum: 1 },
        club: { $first: '$$ROOT' }, // Include the entire club document
      }
    },
    {
      $replaceRoot: { newRoot: { $mergeObjects: ['$club', '$$ROOT'] } }
    },
    {
      $project: {
        club: 0,
      },
    },
    // Sort the results based on the ratings in descending order
    {
      $sort: { ratings: -1 }
    }
  ])

  res.status(200).json({
    status: 'success',
    message: 'Featured clubs retrieved successfully',
    featuredClubs
  })
}

exports.newsAndAnnouncement = async (req, res) => {

  const clubId = new ObjectId(req.query.clubId)
  const userId = new ObjectId(req.user._id)

  const eventsPipeline = [
    { $match: { club: clubId } },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    { $unwind: '$club' },
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
            then: true,
            else: false
          }
        }
      }
    },
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
            then: true,
            else: false
          }
        }
      }
    },
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
          { $limit: 5 },
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
    {
      $addFields: {
        totalLikes: { $size: '$likes' }
      }
    },
    {
      $addFields: {
        itemType: 'event'
      }
    }
  ]

  const postsPipeline = [
    { $match: { club: clubId } },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    { $unwind: '$club' },
    {
      $lookup: {
        from: 'likes',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$post', '$$postId'] },
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
            then: true,
            else: false
          }
        }
      }
    },
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
            then: true,
            else: false
          }
        }
      }
    },
    {
      $lookup: {
        from: 'likes',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] }
            }
          },
          { $limit: 5 },
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
    {
      $addFields: {
        totalLikes: { $size: '$likes' }
      }
    },
    {
      $addFields: {
        itemType: 'post'
      }
    }
  ]

  const combinedPipeline = [
    {
      $unionWith: {
        coll: 'posts',
        pipeline: postsPipeline
      }
    },
    { $sort: { createdAt: -1 } }
  ]

  const feeds = await Event.aggregate([
    ...eventsPipeline,
    ...combinedPipeline
  ])

  res.status(200).json({
    status: 'success',
    message: 'News and Announcements retrieved successfully',
    feeds
  })
}

exports.getMembership = async (req, res) => {
  const userId = req.user._id
  const membership = await Follow.aggregate([
    {
      $match: {
        user: new ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      }
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    { $unwind: '$club' },
    {
      $lookup: {
        from: 'executives',
        let: { userId: '$user._id', clubId: '$club._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$userId'] },
                  { $eq: ['$club', '$$clubId'] }
                ]
              }
            }
          }
        ],
        as: 'role'
      }
    },
    {
      $unwind: {
        path: '$role',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        'user.role': '$role.role'
      }
    },
    { $sort: { createdAt: -1 } }
  ])
  
  res.status(200).json({
    status: 'success',
    message: 'Club membership retrieved successfully',
    membership
  })
}

exports.getMembers = async (req, res) => {
  const clubId = req.query.clubId !== 'undefined' ? req.query.clubId : req.user.club;
  const searchQuery = req.query.search || ''; // Get the search query from the request query parameter
  console.log(searchQuery)
  const members = await Follow.aggregate([
    { $match: { club: new ObjectId(clubId) } }, // Match followers of the specified club
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
      $match: {
        // Match user's first name or last name with the search query (case-insensitive)
        $or: [
          { 'user.firstName': { $regex: searchQuery, $options: 'i' } },
          { 'user.lastName': { $regex: searchQuery, $options: 'i' } }
        ]
      }
    }, // Filter users based on the search query
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
      $unwind: {
        path: '$role',
        preserveNullAndEmptyArrays: true
      }
    }, // Unwind the role array
    {
      $addFields: {
        'user.role': '$role.role' // Add the role field to the user object
      }
    },
    {
      $group: {
        _id: '$user._id',
        user: { $first: '$user' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    message: 'Members retrieved successfully',
    members
  });
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

exports.clubAnalytics = async (req, res) => {

  const clubId = new ObjectId(req.user.club)

  const [analytics] = await Club.aggregate([
  {
    $match: { _id: clubId }
  },
  {
    $lookup: {
      from: "follows",
      localField: "_id",
      foreignField: "club",
      as: "members"
    }
  },
  {
    $lookup: {
      from: "posts",
      localField: "_id",
      foreignField: "club",
      as: "posts"
    }
  },
  {
    $lookup: {
      from: "events",
      localField: "_id",
      foreignField: "club",
      as: "events"
    }
  },
  {
    $lookup: {
      from: "likes",
      let: { clubId: "$_id", posts: "$posts", events: "$events" },
      pipeline: [
        {
          $match: {
            $or: [
              { post: { $exists: true } },
              { event: { $exists: true } }
            ],
            $expr: {
              $or: [
                { $in: ["$post", "$$posts._id"] },
                { $in: ["$event", "$$events._id"] }
              ]
            }
          }
        }
      ],
      as: "likes"
    }
  },
  {
    $lookup: {
      from: "reviews",
      localField: "_id",
      foreignField: "club",
      as: "reviews",
      pipeline: [
        { $sort: { createdAt: -1 } },
        { $limit: 15 },
        { $project: { review: 1, _id: 0 } }
      ]
    }
  },
  {
    $unwind: "$members"
  },
  {
    $group: {
      _id: "$_id",
      totalMembers: { $sum: 1 },
      totalPosts: { $first: "$posts" },
      totalEvents: { $first: "$events" },
      totalLikes: { $first: "$likes" },
      last15Reviews: { $first: "$reviews.review" },
      newMembersPerMonth: {
        $push: {
          month: {
            $dateToString: {
              format: "%Y-%m",
              date: "$members.createdAt"
            }
          }
        }
      }
    }
  },
  {
    $project: {
      _id: 1,
      totalMembers: 1,
      totalPosts: { $size: "$totalPosts" },
      totalEvents: { $size: "$totalEvents" },
      totalLikes: { $size: "$totalLikes" },
      last15Reviews: 1,
      newMembersPerMonth: 1
    }
  },
  {
    $unwind: "$newMembersPerMonth"
  },
  {
    $group: {
      _id: "$_id",
      totalMembers: { $first: "$totalMembers" },
      totalPosts: { $first: "$totalPosts" },
      totalEvents: { $first: "$totalEvents" },
      totalLikes: { $first: "$totalLikes" },
      last15Reviews: { $first: "$last15Reviews" },
      newMembersPerMonth: {
        $push: {
          month: "$newMembersPerMonth",
          count: { $sum: 1 }
        }
      }
    }
  },
  {
    $project: {
      _id: 1,
      totalMembers: 1,
      totalPosts: 1,
      totalEvents: 1,
      totalLikes: 1,
      last15Reviews: 1,
      newMembersPerMonth: {
        $slice: [
          {
            $reverseArray: "$newMembersPerMonth"
          },
          5
        ]
      }
    }
  }
  ])

  const [members] = await Club.aggregate([
    {
      $match: { _id: clubId }
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "club",
        as: "members"
      }
    },
    {
      $unwind: "$members"
    },
    {
      $group: {
        _id: "$_id",
        newMembersPerMonth: {
          $push: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$members.createdAt"
              }
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        newMembersPerMonth: 1
      }
    },
    {
      $unwind: "$newMembersPerMonth"
    },
    {
      $group: {
        _id: {
          clubId: "$_id",
          month: "$newMembersPerMonth.month"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.clubId",
        newMembersPerMonth: {
          $push: {
            month: "$_id.month",
            count: "$count"
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        newMembersPerMonth: {
          $slice: [
            {
              $reverseArray: "$newMembersPerMonth"
            },
            5
          ]
        }
      }
    }
  ])


  res.status(200).json({
    status: 'success',
    message: 'Retrieved successfully',
    analytics,
    newMembersPerMonth: members.newMembersPerMonth
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
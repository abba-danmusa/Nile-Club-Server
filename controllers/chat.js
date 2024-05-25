const mongoose = require('mongoose')

const Chat = mongoose.model('Chat')
const Follow = mongoose.model('Follow')

const ObjectId = require('mongodb').ObjectId

exports.getChats = async (req, res) => {
  const { user } = req

  const userId = new ObjectId(user._id)

  const chats = await Follow.aggregate([
    {
      $match: { user: userId }
    },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    {
      $unwind: '$club'
    },
    {
      $addFields: { userId }
    },
    {
      $lookup: {
        from: 'chats',
        let: { clubId: '$club._id', userId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$room', '$$clubId'] },
                  {
                    $or: [
                      { $eq: [{ $type: '$viewedBy' }, 'missing'] },
                      {
                        $not: {
                          $in: [userId, { $ifNull: ['$viewedBy', []] }]
                        }
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'sender'
            }
          },
          { $unwind: '$sender' },
          {
            $set: {
              viewed: { $in: [userId, { $ifNull: ['$viewedBy', []] }] }
            }
          },
          {
            $project: {
              sender: 1,
              content: 1,
              room: 1,
              timeSent: 1,
              createdAt: 1,
              updatedAt: 1,
              viewed: 1
            }
          }
        ],
        as: 'unviewedChats'
      }
    },
    {
      $lookup: {
        from: 'chats',
        let: { clubId: '$club._id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$room', '$$clubId'] } } },
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'sender'
            }
          },
          { $unwind: '$sender' },
          { $sort: { createdAt: -1 } },
        ],
        as: 'chats'
      }
    },
    {
      $project: {
        club: 1,
        members: 1, // Include members array
        unviewedChats: 1,
        chats: {
          $map: {
            input: '$chats',
            as: 'chat',
            in: {
              $mergeObjects: [
                '$$chat',
                {
                  viewed: { $in: [userId, { $ifNull: ['$$chat.viewedBy', []] }] }
                }
              ]
            }
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$club',
            {
              members: '$members', // Include members array
              unviewedChats: '$unviewedChats',
              chats: '$chats'
            }
          ]
        }
      }
    }
  ]);

  
  res.status(200).json({
    status: 'success',
    message: 'Chats retrieved successfully',
    chats
  })
}

exports.getNotifications = async (req, res) => {
  
  const { user } = req

  const userId = new ObjectId(user._id)

  const [notifications] = await Follow.aggregate([
    {
      $match: { user: userId }
    },
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    {
      $unwind: '$club'
    },
    {
      $addFields: { userId }
    },
    {
      $lookup: {
        from: 'chats',
        let: { clubId: '$club._id', userId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$room', '$$clubId'] },
                  {
                    $or: [
                      { $eq: [{ $type: '$viewedBy' }, 'missing'] },
                      {
                        $not: {
                          $in: ['$$userId', { $ifNull: ['$viewedBy', []] }]
                        }
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            $set: {
              viewed: { $in: ['$$userId', { $ifNull: ['$viewedBy', []] }] }
            }
          },
          {
            $project: {
              sender: 1,
              content: 1,
              room: 1,
              timeSent: 1,
              createdAt: 1,
              updatedAt: 1,
              viewed: 1
            }
          }
        ],
        as: 'unviewedChats'
      }
    },
    {
      $project: {
        _id: 0,
        unviewedChatsCount: { $size: '$unviewedChats' }
      }
    },
    {
      $group: {
        _id: null,
        totalUnviewedChats: { $sum: '$unviewedChatsCount' }
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    message: 'Retrieved successfully',
    notifications
  })
}
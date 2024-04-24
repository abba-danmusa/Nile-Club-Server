const mongoose = require('mongoose')

const Chat = mongoose.model('Chat')
const Follow = mongoose.model('Follow')

const ObjectId = require('mongodb').ObjectId

exports.getChats = async (req, res) => {
  const { user } = req

  const chats = await Follow.aggregate([
    {
      $match: {user: new ObjectId(user._id)}
    },
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
        from: "chats",
        let: { clubId: "$club._id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$room", "$$clubId"] }
            }
          },
          {
            $project: {
              sender: '$sender',
              content: 1,
              room: 1,
              timeSent: 1,
              createdAt: 1,
              updatedAt: 1
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "sender",
              foreignField: "_id",
              as: "sender"
            }
          },
          { $unwind: '$sender' },
        ],
        as: "chats"
      }
    },
    // { $sort: { "chats.createdAt": -1 } }
  ])

  res.status(200).json({
    status: 'success',
    message: 'Chats retrieved successfully',
    chats
  })
}
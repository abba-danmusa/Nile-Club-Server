const mongoose = require('mongoose')

const Chat = mongoose.model('Chat')
const Follow = mongoose.model('Follow')

const ObjectId = require('mongodb').ObjectId

exports.getChats = async (req, res) => {
  const { user } = req

  // const chats = await Follow.aggregate([
  //   {
  //     $match: {user: new ObjectId(user._id)}
  //   },
  //   {
  //     $lookup: {
  //       from: 'clubs',
  //       localField: 'club',
  //       foreignField: '_id',
  //       as: 'club'
  //     }
  //   },
  //   { $unwind: '$club' },
  //   {
  //     $lookup: {
  //       from: "chats",
  //       let: { clubId: "$club._id" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: { $eq: ["$room", "$$clubId"] }
  //           }
  //         },
  //         {
  //           $project: {
  //             sender: '$sender',
  //             content: 1,
  //             room: 1,
  //             timeSent: 1,
  //             createdAt: 1,
  //             updatedAt: 1
  //           }
  //         },
  //         {
  //           $lookup: {
  //             from: "users",
  //             localField: "sender",
  //             foreignField: "_id",
  //             as: "sender"
  //           }
  //         },
  //         { $unwind: '$sender' },
  //       ],
  //       as: "chats"
  //     }
  //   },
  //   // { $sort: { "chats.createdAt": -1 } }
  // ])

  // const chats = await Follow.aggregate([
  //   // Match follow documents for the specified user
  //   {
  //     $match: { user: new ObjectId(user._id) }
  //   },
  //   // Lookup clubs based on followed club IDs
  //   {
  //     $lookup: {
  //       from: 'clubs',
  //       localField: 'club',
  //       foreignField: '_id',
  //       as: 'club'
  //     }
  //   },
  //   // Unwind the club array
  //   {
  //     $unwind: '$club'
  //   },
  //   // Define the userId variable to be used in the pipeline
  //   {
  //     $set: {
  //       userId: new ObjectId(user._id)
  //     }
  //   },
  //   // Lookup chats where the sender is not the user and the user has not viewed the chat
  //   {
  //     $lookup: {
  //       from: 'chats',
  //       let: { clubId: '$club._id', userId: '$userId' },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ['$room', '$$clubId'] },
  //                 { $ne: ['$sender', '$$userId'] },
  //                 {
  //                   $or: [
  //                     { $eq: [{ $type: '$viewedBy' }, 'missing'] },
  //                     { $not: { $in: [{ $ifNull: ['$viewedBy', []] }, ['$$userId']] } }
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         },
  //         // Add viewed field based on the presence of userId in viewedBy array
  //         {
  //           $set: {
  //             viewed: { $in: ['$$userId', { $ifNull: ['$viewedBy', []] }] }
  //           }
  //         },
  //         // Project only necessary fields
  //         {
  //           $project: {
  //             sender: 1,
  //             content: 1,
  //             room: 1,
  //             timeSent: 1,
  //             createdAt: 1,
  //             updatedAt: 1,
  //             viewed: 1 // Include the viewed field
  //           }
  //         }
  //       ],
  //       as: 'chats'
  //     }
  //   },
  //   // Group by club ID and push unviewed chats into an array
  //   {
  //     $group: {
  //       _id: '$_id',
  //       club: { $first: '$club' },
  //       unviewedChats: { $push: '$unviewedChats' },
  //       chats: { $first: '$chats' } // Include chats array
  //     }
  //   },
  //   // Replace club array with the club object
  //   {
  //     $replaceRoot: {
  //       newRoot: {
  //         $mergeObjects: [
  //           '$club',
  //           {
  //             unviewedChats: { $arrayElemAt: ['$unviewedChats', 0] },
  //             chats: '$chats' // Include chats array
  //           }
  //         ]
  //       }
  //     }
  //   }
  // ])

  // const chats = await Follow.aggregate([
  //   // Match follow documents for the specified user
  //   {
  //     $match: { user: new ObjectId(user._id) }
  //   },
  //   // Lookup clubs based on followed club IDs
  //   {
  //     $lookup: {
  //       from: 'clubs',
  //       localField: 'club',
  //       foreignField: '_id',
  //       as: 'club'
  //     }
  //   },
  //   // Unwind the club array
  //   {
  //     $unwind: '$club'
  //   },
  //   // Define the userId variable to be used in the pipeline
  //   {
  //     $set: {
  //       userId: new ObjectId(user._id)
  //     }
  //   },
  //   // Lookup chats where the user has not viewed the chat
  //   {
  //     $lookup: {
  //       from: 'chats',
  //       let: { clubId: '$club._id', userId: '$userId' },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ['$room', '$$clubId'] },
  //                 {
  //                   $or: [
  //                     { $eq: [{ $type: '$viewedBy' }, 'missing'] },
  //                     { $not: { $in: [{ $ifNull: ['$viewedBy', []] }, ['$$userId']] } }
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         },
  //         // Add viewed field based on the presence of userId in viewedBy array
  //         {
  //           $set: {
  //             viewed: { $in: ['$$userId', { $ifNull: ['$viewedBy', []] }] }
  //           }
  //         },
  //         // Project only necessary fields
  //         {
  //           $project: {
  //             sender: 1,
  //             content: 1,
  //             room: 1,
  //             timeSent: 1,
  //             createdAt: 1,
  //             updatedAt: 1,
  //             viewed: 1 // Include the viewed field
  //           }
  //         }
  //       ],
  //       as: 'unviewedChats'
  //     }
  //   },
  //   // Group by club ID and push unviewed chats into an array
  //   {
  //     $group: {
  //       _id: '$_id',
  //       club: { $first: '$club' },
  //       unviewedChats: { $first: '$unviewedChats' } // Include unviewedChats array
  //     }
  //   },
  //   // Lookup all chats in the club
  //   {
  //     $lookup: {
  //       from: 'chats',
  //       localField: 'club._id',
  //       foreignField: 'room',
  //       as: 'chats'
  //     }
  //   },
  //   // Project necessary fields
  //   {
  //     $project: {
  //       club: 1,
  //       unviewedChats: 1,
  //       chats: 1 // Include chats array
  //     }
  //   },
  //   // Replace club array with the club object
  //   {
  //     $replaceRoot: {
  //       newRoot: {
  //         $mergeObjects: [
  //           '$club',
  //           {
  //             unviewedChats: '$unviewedChats',
  //             chats: '$chats'
  //           }
  //         ]
  //       }
  //     }
  //   }
  // ])

  // const chats = await Follow.aggregate([
  //   // Match follow documents for the specified user
  //   {
  //     $match: { user: new ObjectId(user._id) }
  //   },
  //   // Lookup clubs based on followed club IDs
  //   {
  //     $lookup: {
  //       from: 'clubs',
  //       localField: 'club',
  //       foreignField: '_id',
  //       as: 'club'
  //     }
  //   },
  //   // Unwind the club array
  //   {
  //     $unwind: '$club'
  //   },
  //   // Define the userId variable to be used in the pipeline
  //   {
  //     $addFields: {
  //       userId: new ObjectId(user._id)
  //     }
  //   },
  //   // Lookup chats where the user has not viewed the chat
  //   {
  //     $lookup: {
  //       from: 'chats',
  //       let: { clubId: '$club._id', userId: '$userId' },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ['$room', '$$clubId'] },
  //                 {
  //                   $or: [
  //                     { $eq: [{ $type: '$viewedBy' }, 'missing'] },
  //                     { $not: { $in: [{ $ifNull: ['$viewedBy', []] }, ['$$userId']] } }
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         },
  //         // Add viewed field based on the presence of userId in viewedBy array
  //         {
  //           $set: {
  //             viewed: { $in: ['$$userId', { $ifNull: ['$viewedBy', []] }] }
  //           }
  //         },
  //         // Project only necessary fields
  //         {
  //           $project: {
  //             sender: 1,
  //             content: 1,
  //             room: 1,
  //             timeSent: 1,
  //             createdAt: 1,
  //             updatedAt: 1,
  //             viewed: 1 // Include the viewed field
  //           }
  //         }
  //       ],
  //       as: 'unviewedChats'
  //     }
  //   },
  //   // Group by club ID and push unviewed chats into an array
  //   {
  //     $group: {
  //       _id: '$_id',
  //       club: { $first: '$club' },
  //       unviewedChats: { $first: '$unviewedChats' } // Include unviewedChats array
  //     }
  //   },
  //   // Lookup all chats in the club
  //   {
  //     $lookup: {
  //       from: 'chats',
  //       localField: 'club._id',
  //       foreignField: 'room',
  //       as: 'chats'
  //     }
  //   },
  //   // Define the userId variable again
  //   {
  //     $addFields: {
  //       userId: new ObjectId(user._id)
  //     }
  //   },
  //   // Project necessary fields
  //   {
  //     $project: {
  //       club: 1,
  //       unviewedChats: 1,
  //       chats: {
  //         // Add viewed field to each chat in the chats array
  //         $map: {
  //           input: '$chats',
  //           as: 'chat',
  //           in: {
  //             $mergeObjects: [
  //               '$$chat',
  //               {
  //                 viewed: { $in: [new ObjectId(user._id), { $ifNull: ['$$chat.viewedBy', []] }] }
  //               }
  //             ]
  //           }
  //         }
  //       }
  //     }
  //   },
  //   // Replace club array with the club object
  //   {
  //     $replaceRoot: {
  //       newRoot: {
  //         $mergeObjects: [
  //           '$club',
  //           {
  //             unviewedChats: '$unviewedChats',
  //             chats: '$chats'
  //           }
  //         ]
  //       }
  //     }
  //   }
  // ])

  const userId = new ObjectId(user._id)

  const chats = await Follow.aggregate([
    // Match follow documents for the specified user
    {
      $match: { user: userId }
    },
    // Lookup clubs based on followed club IDs
    {
      $lookup: {
        from: 'clubs',
        localField: 'club',
        foreignField: '_id',
        as: 'club'
      }
    },
    // Unwind the club array
    {
      $unwind: '$club'
    },
    // Define the userId variable to be used in the pipeline
    {
      $addFields: { userId }
    },
    // Lookup chats where the user has not viewed the chat
    {
      $lookup: {
        from: 'chats',
        let: { clubId: '$club._id', userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$room', '$$clubId'] },
                  {
                    $or: [
                      { $eq: [{ $type: '$viewedBy' }, 'missing'] },
                      { $not: { $in: [{ $ifNull: ['$viewedBy', []] }, [userId]] } }
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
          { $unwind: '$sender'},
          // Add viewed field based on the presence of userId in viewedBy array
          {
            $set: {
              viewed: { $in: [userId, { $ifNull: ['$viewedBy', []] }] }
            }
          },
          // Project only necessary fields
          {
            $project: {
              sender: 1,
              content: 1,
              room: 1,
              timeSent: 1,
              createdAt: 1,
              updatedAt: 1,
              viewed: 1 // Include the viewed field
            }
          }
        ],
        as: 'unviewedChats'
      }
    },
    // Lookup all chats in the club
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
          { $unwind: '$sender'}
        ],
        as: 'chats'
      }
    },
    // Project only necessary fields
    {
      $project: {
        club: 1,
        unviewedChats: 1,
        chats: {
          // Add viewed field to each chat in the chats array
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
    // Replace club array with the club object
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$club',
            {
              unviewedChats: '$unviewedChats',
              chats: '$chats'
            }
          ]
        }
      }
    }
  ])
  
  res.status(200).json({
    status: 'success',
    message: 'Chats retrieved successfully',
    chats
  })
}

exports.markChatsRead = async (req, res) => {
  
}
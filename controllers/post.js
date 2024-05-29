const mongoose = require("mongoose")

const ObjectId = require('mongodb').ObjectId

const Post = mongoose.model('Post')
const Like = mongoose.model('Like')
const Club = mongoose.model('Club')
const Follow = mongoose.model('Follow')
const Notification = mongoose.model('Notification')

exports.createPost = async (req, res) => {
  
  const clubId = new ObjectId(req.user.club)

  const clubIsApproved = await Club.findOne({
    _id: clubId,
    approval: 'approved'
  })

  if (!clubIsApproved) {
    return res.status(200).json({
      status: 'success',
      message: 'You cannot create a post until your club is approved',
    })
  }

  req.body.club = req.user.club
  req.body.creator = req.user._id

  const post = new Post(req.body)

  const followers = await Follow.find(
    { club: clubId, user: { $ne: req.user._id } },
    { user: 1 }
  )

  console.log(followers)
  
  const bulkOps = followers.map(follower => ({
    insertOne: {
      document: {
        user: follower.user,
        club: req.user.club,
        type: 'Post',
        content: post._id,
        isRead: false,
      }
    }
  }))

  const postPromise = post.save()
  const notificationsPromise = Notification.bulkWrite(bulkOps)

  const [newPost] = await Promise.all([postPromise, notificationsPromise])

  res.status(200).json({
    status: 'success',
    message: 'Post created successfully',
    post: newPost
  })
}

exports.updatePost = async (req, res) => {
  const { _id, ...fieldsToUpdate } = req.body
  req.body._id = undefined

  await Post.findOneAndUpdate(
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
  const postId = req.body.postId

  let unlike
  let like

  unlike = await Like.findOneAndDelete({
    post: new ObjectId(postId),
    user: new ObjectId(req.user._id)
  })

  if (!unlike) {
    like = new Like({ post: postId, user: req.user._id })
    await like.save()
  }

  res.status(200).json({
    status: 'success',
    message: `Success`,
    like
  })
}
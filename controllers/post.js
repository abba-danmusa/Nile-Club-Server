const mongoose = require("mongoose")

const ObjectId = require('mongodb').ObjectId

const Post = mongoose.model('Post')
const Like = mongoose.model('Like')
const Club = mongoose.model('Club')

exports.createPost = async (req, res) => {
  const clubIsApproved = await Club.findOne({
    _id: new ObjectId(req.user.club),
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
  await post.save()

  res.status(200).json({
    status: 'success',
    message: 'Post created successfully',
    post
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
  const postId = req.body.eventId

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
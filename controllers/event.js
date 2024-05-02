const mongoose = require('mongoose')

const Event = mongoose.model('Event')
const Like = mongoose.model('Like')

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
  req.body.creator = req.user._id
  req.body.club = req.user.club
  
  const event = new Event(req.body)
  await event.save()

  res.status(200).json({
    status: "success",
    message: "Event successfully created",
    event,
  });
};

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

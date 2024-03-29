const mongoose = require('mongoose')

const Event = mongoose.model('Event')

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
  req.body.club = req.user._id
  const category = req.body.category
  req.body.category = undefined
  
  const event = new Event({...req.body, category: category.map(item => item)})
  await event.save()

  res.status(200).json({
    status: "success",
    message: "Event successfully created",
    event,
  });
};

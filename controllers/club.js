const mongoose = require('mongoose')
const Club = mongoose.model('Club')
const cloudinary = require('../helpers/cloudinary')

exports.createClub = async(req, res) => {
  // getting the data from the user input (from the club creator)
  const { name, description, assets } = req.body
  
  // creating and saving the club to the database
  const club = new Club({ name, description, assets, user: req.user._id })
  await club.save()

  // responding to the user the status of their request. And if there is an error, our error handler will catch it and respond accordingly
  res.status(200).json({
    status:'success',
    message: 'Your application has been sent successfully and is now awaiting approval',
    club
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
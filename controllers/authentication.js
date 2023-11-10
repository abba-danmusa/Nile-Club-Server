const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const mail = require('../handlers/mail')
const codeRain = require('coderain')
const User = mongoose.model('User')

exports.signup = async (req, res) => {
  const user = new User(req.body)
  await user.save()
  res.status(200).json({
    status: 'success',
    message: `An email with a verification code has been sent to ${req.body.email}`,
    // TODO
    user // remove after testing
  })
}

exports.signin = async (req, res) => {
  let { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'User with the given email does not exist! Please sign up.'
    })
  }
  await user.comparePassword(password)
  const token = jwt.sign({ userId: user._id }, process.env.SECRET)
  res.status(200).json({
    status: 'success',
    message: 'Sign in successfully',
    user,
    token
  })
}

exports.sendVerificationCode = async (req, res, next) => {
  const cr = new codeRain('999999') // generate a unique auth code
  const verificationCode = cr.next()
  const verificationCodeExpires = Date.now() + 1200000 // expires after an hour
  req.body.verificationCode = verificationCode
  req.body.verificationCodeExpires = verificationCodeExpires
  const verificationCodeURL = `https://${req.headers.host}/verification/code/${verificationCode}`
  const user = req.body.email
  await mail.send({
    user,
    subject: 'Verification Code',
    verificationCodeURL,
    verificationCode,
    filename: 'verification-code'
  })
  next()
}

exports.requireAuth = async (req, res, next) => {
  const { authorization } = req.headers
  // authorization === 'Bearer laksjdflaksdjasdfklj'

  if (!authorization) {
    return res.status(401).json({
      status: 'error',
      message: 'You must be logged in.'
    })
  }

  const token = authorization.replace('Bearer ', '')
  jwt.verify(token, process.env.SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).json({ status: 'error', message: err.message })
    }

    const { userId } = payload

    const user = await User.findById(userId)
    req.user = user
    next()
  })
}
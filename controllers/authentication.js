const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const mail = require('../handlers/mail')
const codeRain = require('coderain')
const User = mongoose.model('User')

exports.signup = async (req, res) => {
  const email = req.body.email

  const user = new User(req.body)
  await user.save()
  res.status(200).json({
    status: 'success',
    message: `An email with a verification code has been sent to ${email}`,
    // TODO
    user // remove after testing
  })
}

exports.signin = async (req, res) => {
  let { email, password } = req.body
  const user = await User.findOne({email})
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'User with the given email does not exist! Please sign up.'
    })
  }
  if (user.verificationCode) {
    return res.status(402).json({
      status: 'error',
      message: 'Please verify your email. check your email for the verification code or get a new one',
    })
  }
  
  const userFirstName = user.firstName
  if (!userFirstName) {
    return res.status(405).json({
      status: 'error',
      message: 'Please, we\'d love to know more about you. enter your email to continue'
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
  const email = req.body.email
  const userExist = await User.findOne({ email })

  if (userExist && userExist.verificationCode) {
    return res.status(409).json({
      status: 'error',
      message: 'You\'ve already signed up. Please verify your email to continue'
    })
  } else if (userExist && !userExist.password) {
    return res.status(403).json({
      status: 'error',           
      message: 'You need to create a password before you can continue'
    })
  } else if (userExist && !userExist.firstName) {
    return res.status(405).json({
      status: 'error',
      message: 'Please, we\'d love to know more about you. Let\'s start from here'
    })
  } else if (userExist) {
    return res.status(408).json({
      status: 'error',
      message: 'User already exists. Please sign in.'
    })
  }

  const cr = new codeRain('999999') // generate a unique auth code
  const verificationCode = cr.next()
  const verificationCodeExpires = Date.now() + 1200000 // expires after an hour
  req.body.verificationCode = verificationCode
  req.body.verificationCodeExpires = verificationCodeExpires
  const verificationCodeURL = `https://${req.headers.host}/verification/code/${verificationCode}`

  await mail.send({
    user: req.body.email,
    subject: 'Verification Code',
    verificationCodeURL,
    verificationCode,
    filename: 'verification-code'
  })
  next()
}

exports.resendVerificationCode = async (req, res, next) => {
  const email = req.body.email
  const userExist = await User.findOne({ email })

  if (!userExist) {
    return res.status(409).json({
      status: 'error',
      message: 'User does not exist. Please sign up.'
    })
  }

  const cr = new codeRain('999999') // generate a unique auth code
  const verificationCode = cr.next()
  const verificationCodeExpires = Date.now() + 1200000 // expires after an hour
  req.body.verificationCode = verificationCode
  req.body.verificationCodeExpires = verificationCodeExpires
  const verificationCodeURL = `https://${req.headers.host}/verification/code/${verificationCode}`

  await mail.send({
    user: req.body.email,
    subject: 'Verification Code',
    verificationCodeURL,
    verificationCode,
    filename: 'verification-code'
  })
  next()
}

exports.saveVerificationCode = async (req, res) => {
  const { verificationCode, verificationCodeExpires, email } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'No user found with the provided email. Please signup'
    })
  }
  if (!(user.verificationCode && user.verificationCodeExpires)) {
    return res.status(400).json({
      status: 'error',
      message: 'Email already verified. Please sign in',
    })
  }
  await User.findOneAndUpdate(
    { email },
    { $set: { verificationCode, verificationCodeExpires } },
    {new: true, runValidators: true}
  )
  res.status(200).json({
    status: 'success',
    message: `A new verification code has been sent to ${email}`
  })
}

exports.verifyVerificationCode = async (req, res) => {
  const {verificationCode} = req.body
  const user = await User.findOne({
    verificationCode,
    verificationCodeExpires: { $gt: Date.now() }
  })
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired verification code. Please generate a new code and try again'
    })
  }
  user.verificationCode = undefined //delete the v. code from user collection
  user.verificationCodeExpires = undefined //delete v. code expiry date
  await user.save()
  res.status(200).json({
    status: 'success',
    message: 'Email Verification Successful. You can now login'
  })
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

exports.createPassword = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({email})
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Please provide a valid email address'
    })
  }
  user.password = password
  await user.save()
  res.status(200).json({
    status:'success',
    message: 'Password successfully created'
  })
}

exports.changePassword = async (req, res) => {
  const { password, newPassword } = req.body
  const user = await User.findById(req.user._id)

  await user.comparePassword(password)
  user.password = newPassword
  await user.save()

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
    user: req.user
  })
}

exports.about = async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    faculty,
    department,
    year,
    matriculationNumber
  } = req.body

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        firstName,
        lastName,
        faculty,
        department,
        year,
        matriculationNumber
      }
    },
    { new: true, runValidators: true }
  )

  res.status(200).json({
    status: 'success',
    message: 'Profile successfully updated'
  })
}

exports.editAbout = async (req, res) => {
  const { _id, ...updatedProfile } = req.body
  const user = await User.findOneAndUpdate(
    { _id },
    { ...updatedProfile },
    { new: true, runValidators: true }
  )
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    user
  })
}

exports.getUser = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.status(200).json({
    status: 'success',
    message: 'User retrieved successfully',
    user
  })
}
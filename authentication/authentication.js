const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const User = mongoose.model('User')

exports.requireAuthentication = async (req, res, next) => {
  const { authorization } = req.headers
  // authorization === 'Bearer laksjdflaksdjasdfklj'

  if (!authorization) {
    return res.status(401).send({
      status: 'error',
      message: 'Your session has expired, please login again.'
    })
  }

  const token = authorization.replace('Bearer ', '')
  jwt.verify(token, process.env.SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).send({
        status: 'error',
        message: 'invalid token or password.'
      })
    }

    const { userId } = payload

    const user = await User.findById(userId)
    if (!user) {
      return res.status(401).send({
        status: 'error',
        message: 'Invalid token or user no longer exists.'
      })
    }
    req.user = user
    next()
  })
}
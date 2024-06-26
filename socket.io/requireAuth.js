const mongoose = require('mongoose')
const User = mongoose.model('User')
const jwt = require('jsonwebtoken')

function requireAuthentication(socket, next) {
  try {
    const token = socket.handshake.auth.token
    jwt.verify(token, process.env.SECRET, async (err, payload) => {
      if (err) {
        // TODO
        // send error message to client
        return
      }

      const {userId} = payload
      const user = await User.findById(userId)

      if (!user) {
        // TODO
        // send error to the client
      }
      socket.user = user
      next()
    })
  } catch (error) {
    // TODO
    // Send the error to the current user
    console.log(error)
  }
}

module.exports = requireAuthentication
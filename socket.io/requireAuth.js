const mongoose = require('mongoose')
const User = mongoose.model('User')
const jwt = require('jsonwebtoken')

function requireAuthentication(socket, next) {
  
  const token = socket.handshake.auth.token
  jwt.verify(token, process.env.SECRET, async (err, payload) => {
    if (err) {
      // TODO
      // send error message to client
    }

    const { userId } = payload
    const user = await User.findById(userId)

    if (!user) {
      // TODO
      // send error to the client
    }
    socket.user = user
    next()
  })
}

module.exports = requireAuthentication
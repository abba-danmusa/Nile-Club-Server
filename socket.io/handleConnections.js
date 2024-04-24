const mongoose = require('mongoose')
// const { getChats } = require('../controllers/chat')
const Chat = mongoose.model('Chat')
const Follow = mongoose.model('Follow')

const ObjectId = require('mongodb').ObjectId

module.exports = (io, socket) => {
  
  const joinRoom = async _data => {
    try {
      const user = socket.user

      let rooms = await Follow.find({ user: new ObjectId(user._id) })
      rooms = rooms.map(room => room.club.toString())
      // rooms.push(socket.user._id.toString()) 
      console.log(rooms)
      // Add the user to the room(s)
      socket.join(rooms)
      // io.to(socket.user.club).emit('incoming chat', {greetings: 'hello'})
      console.log(`${user.firstName} has joined room ${rooms}`)
    } catch (error) {
      console.log(error)
    }
  }

  const chatMessage = async (chat, room) => {
    console.log(chat)
    let message
    try {
      message = new Chat({ ...chat, room, sender: socket.user._id })
      io.to(message.room.toString()).emit('incoming chat', message)
      await message.save()
    } catch (error) {
      // TODO
      // Send the error to the client saying their message couldn't be delivered
      console.log(error)
      return
    }
  }

  const getChats = async () => {
    const chats = await Follow.aggregate([
      {
        $match: { user: new ObjectId(socket.user._id) }
      },
      {
        $lookup: {
          from: 'clubs',
          localField: 'club',
          foreignField: '_id',
          as: 'club'
        }
      },
      { $unwind: '$club' },
      {
        $lookup: {
          from: "chats",
          localField: "club._id",
          foreignField: "room",
          as: "chats"
        }
      },
      { $sort: { "chats.createdAt": -1 } }
    ])
    io.to(socket.user.club).emit('chats', chats)
  }

  socket.on('join room', joinRoom)
  socket.on('incoming chat', chatMessage)
  socket.on('room', getChats)
}
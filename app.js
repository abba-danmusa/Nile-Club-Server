const express = require("express")
const path = require('path')
const bodyParser = require("body-parser")
const errorHandlers = require('./handlers/errorHandlers')
const cors = require('cors')
const compression = require('compression')
const { createServer } = require("http")
const { Server } = require("socket.io")

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(compression()) // compress response bodies
app.use(express.json())

// tell express to use our routes
app.use('/authentication/', require('./routes/authentication'))
app.use('/club/', require('./routes/club'))
app.use('/event/', require('./routes/event'))
app.use('/feed/', require('./routes/feed'))

// if the above routes didn't work, 404 them and forward to error handlers
app.use(errorHandlers.notFound)

// one of the error handlers will see if these errors are just validation errors
app.use(errorHandlers.validationErrors)

// otherwise 
if (process.env.NODE_ENV === 'development') {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors)
}

// production error handler
app.use(errorHandlers.productionErrors)

// setup socket.io
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
})

// import socket.io controllers

module.exports = httpServer
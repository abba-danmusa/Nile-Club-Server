const mongoose = require('mongoose')

// import enviromental variables
require('dotenv').config({ path: 'variables.env' })

mongoose.set("strictQuery", true)
// resolves future deprecation issue with Mongoose v7

// Connects to the database and handles any bad connections
mongoose.connect(process.env.DATABASE)
mongoose.Promise = global.Promise // Tells mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`)
})

mongoose.connection.once('open', () => {
  console.log('connected to mongoose');
})

// import all models
require('./models/User')
require('./models/Club')
require('./models/Chat')
require('./models/View')
require('./models/Like')
require('./models/Post')
require('./models/Event')
require('./models/Review')
require('./models/Follow')
require('./models/Comment')
require('./models/Executive')
require('./models/Notification')

// start the app
const app = require('./app')
app.listen(process.env.PORT || 7777, () => {
  console.log(`Server running on PORT ${process.env.PORT}`)
})
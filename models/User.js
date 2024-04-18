const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    admin: Boolean,
    email: {
      type: String,
      required: 'Please provide your school email',
      unique: 'Email already in use'
    },
    password: String,
    faculty: String,
    department: String,
    year: String,
    matriculationNumber: String,
    verificationCode: {
      type: Number,
      unique: 'Please try signing up again'
    },
    verificationCodeExpires: Date,
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    }
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

userSchema.pre('save', function(next) {
  const user = this
  if (!user.isModified('password')) {
    return next()
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err)
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err)
      }
      user.password = hash
      next()
    })
  })
})

userSchema.methods.comparePassword = function(candidatePassword) {
  const user = this

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject({status: 401, message: 'You have to create a password'})
      }

      if (!isMatch) {
        return reject({status: 400, message: 'Incorrect Password'})
      }

      resolve(true)
    })
  })
}

// userSchema.virtual('club', {
  
// })

mongoose.model('User', userSchema)
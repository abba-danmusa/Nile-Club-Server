const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: 'Please provide your school email',
      unique: 'Email already in use'
    },
    password: {
      type: String,
    },
    department: {
      type: String,
    },
    year: {
      type: String,
    },
    verificationCode: {
      type: Number,
      unique: 'Please try signing up again'
    },
    verificationCodeExpires: Date
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
        return reject(err)
      }

      if (!isMatch) {
        return reject({status: 400, message: 'Incorrect Password'})
      }

      resolve(true)
    })
  })
}

mongoose.model('User', userSchema)
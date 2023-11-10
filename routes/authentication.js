const express = require('express')
const { catchErrors } = require('../handlers/errorHandlers')
const router = express.Router()
const authentication = require('../controllers/authentication')

router.post(
  '/signup',
  catchErrors(authentication.sendVerificationCode), // send v. code to user
  catchErrors(authentication.signup) // signup user
)

router.post('/signin', catchErrors(authentication.signin))

module.exports = router
const express = require('express')
const { catchErrors } = require('../handlers/errorHandlers')
const router = express.Router()
const authentication = require('../controllers/authentication')

router.post(
  '/signup',
  catchErrors(authentication.sendVerificationCode), // sends v. code to users
  catchErrors(authentication.signup) // signup users
)

router.post(
  '/resend',
  catchErrors(authentication.sendVerificationCode),
  catchErrors(authentication.resendVerificationCode)
)

router.post('/signin', catchErrors(authentication.signin))
router.post('/verification', catchErrors(authentication.verifyVerificationCode))

module.exports = router
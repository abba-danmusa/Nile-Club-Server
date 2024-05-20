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
  catchErrors(authentication.resendVerificationCode),
  catchErrors(authentication.saveVerificationCode),
)

router.post('/about', catchErrors(authentication.about))
router.post('/signin', catchErrors(authentication.signin))
router.post('/password/create', catchErrors(authentication.createPassword))
router.post('/verification', catchErrors(authentication.verifyVerificationCode))

// PUT routes
router.put('/about', authentication.editAbout)
router.put('/password',
  catchErrors(authentication.requireAuth),
  catchErrors(authentication.changePassword)
)

// GET ROUTES
router.get(
  '/user',
  catchErrors(authentication.requireAuth),
  catchErrors(authentication.getUser)
)

module.exports = router
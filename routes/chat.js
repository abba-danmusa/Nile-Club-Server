const express = require('express')
const { catchErrors } = require('../handlers/errorHandlers')
const router = express.Router()
const chat = require('../controllers/chat')
const { requireAuthentication } = require('../authentication/authentication')

router.use("/", catchErrors(requireAuthentication))

router.get('/', catchErrors(chat.getChats))
router.get('/notification', catchErrors(chat.getNotifications))

module.exports = router
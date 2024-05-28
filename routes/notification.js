const express = require("express")
const router = express.Router()

const { requireAuthentication } = require("../authentication/authentication")
const { catchErrors } = require("../handlers/errorHandlers")
const notification = require("../controllers/notifications")

// base = '/notification/'

router.use("/", catchErrors(requireAuthentication))

router.get('/', catchErrors(notification.getNotifications))

module.exports = router

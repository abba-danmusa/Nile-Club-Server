/**
 * Defines Express routes and middleware for handling events.
 *
 * Imports required modules and controllers.
 * Applies authentication middleware to all routes.
 * Defines a POST route for creating events.
 */
const express = require("express")
const router = express.Router()

const { requireAuthentication } = require("../authentication/authentication")
const { catchErrors } = require("../handlers/errorHandlers")
const event = require("../controllers/event")

// base = '/event/'

router.use("/", catchErrors(requireAuthentication))

router.post("/", catchErrors(event.createEvent))

module.exports = router

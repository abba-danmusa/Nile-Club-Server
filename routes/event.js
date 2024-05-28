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

// POST routes
router.post("/", catchErrors(event.createEvent))
router.post('/like', catchErrors(event.addToSetLike))

// PUT routes
router.put('/', catchErrors(event.updateEvent))

// GET routes
router.get('/', catchErrors(event.getEvents))

module.exports = router

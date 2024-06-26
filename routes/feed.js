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
const { getFeeds, discover } = require("../controllers/feeds")

// base = '/feed/'

router.use("/", catchErrors(requireAuthentication))

router.get("/", catchErrors(getFeeds))
router.get('/discover', catchErrors(discover))

module.exports = router

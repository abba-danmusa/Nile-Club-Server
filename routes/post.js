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
const post = require("../controllers/post")

// base = '/event/'

router.use("/", catchErrors(requireAuthentication))

// POST routes
router.post("/", catchErrors(post.createPost))
router.post('/like', catchErrors(post.addToSetLike))

// PUT routes
router.put('/', catchErrors(post.updatePost))

// GET routes
router.get('/', catchErrors(post.getPosts))

module.exports = router

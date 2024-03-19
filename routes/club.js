const express = require('express')

const router = express.Router()
const { requireAuthentication } = require('../authentication/authentication')
const { catchErrors } = require('../handlers/errorHandlers')
const club = require('../controllers/club')

// telling the club routes to always require authentication before it processes any request from this route '/club/'
router.use('/', catchErrors(requireAuthentication))

// POST ROUTES
// all our post routes (/club) sits here up to where get routes starts
router.post('/', catchErrors(club.createClub))

// GET ROUTES
// all our get routes (/club) sits here
router.get('/cloudinary/signature', catchErrors(club.cloudinarySignature))

// exporting the router so we can use it in app.js
module.exports = router
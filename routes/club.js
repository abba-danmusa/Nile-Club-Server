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
router.post('/review', catchErrors(club.review))
router.post('/role', catchErrors(club.assignRole))
router.post('/follow', catchErrors(club.followClub))
router.post('/approval', catchErrors(club.approveClub))
router.post('/comment', catchErrors(club.createComment))

// PUT ROUTES
router.put('/', catchErrors(club.editClub))

// GET ROUTES
// all our get routes (/club) sits here
router.get('/', catchErrors(club.getClub))
router.get('/member', catchErrors(club.getMembers))
router.get('/approval', catchErrors(club.getClubs))
router.get('/comment', catchErrors(club.getComments))
router.get('/follow', catchErrors(club.followingClub))
router.get('/feature', catchErrors(club.featuredClubs))
router.get('/analytic', catchErrors(club.clubAnalytics))
router.get('/membership', catchErrors(club.getMembership))
router.get('/feed', catchErrors(club.newsAndAnnouncement))
router.get('/cloudinary/signature', catchErrors(club.cloudinarySignature))

// exporting the router so we can use it in app.js
module.exports = router
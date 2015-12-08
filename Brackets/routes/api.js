var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');//require('../models/user.js');
var Tournament = mongoose.model('Tournament');
var Round = mongoose.model('Round');
var Match = mongoose.model('Match');
var jwt = require('express-jwt');
var passport = require('passport');

// configure auth
var configAuth = require('../config/auth');
var SECRET = configAuth.local.secret;
var auth = jwt({secret: SECRET, userProperty: 'payload'});

//
// API
//

// register a user
router.post('/auth/register', passport.authenticate('local-register', {
    successRedirect: '/index.html',
    failureRedirect: '/login.html'
}));


/*router.post('/auth/register', function (req, res) 
{   
    if(!req.body.username || !req.body.password)
	{
		return res.status(400).json({ message: 'Please fill out all fields' });
	}
    console.log("here");
	// find or create the user with the given username
    User.findOrCreate({username: req.body.username}, function(err, user, created) 
    {
        if (created) 
        {
            // if this username is not taken, then create a user record
            user.name = req.body.name;
            user.setPassword(req.body.password);
            user.save(function(err) 
            {
				if (err) 
				{
				    res.sendStatus("403");
				    return;
				}
		        // create a token
				var token = User.generateToken(user.name);
		        // return value is JSON containing the user's name and token
		        res.json({name: user.name, token: token});
		    });
		} 
		else 
		{
		    // return an error if the username is taken
		    res.sendStatus("403");
		}
    });
});*/

// login a local user using passport
router.post('/auth/login/local', passport.authenticate('local', {
    successRedirect: '/index.html',
    failureRedirect: '/login.html'
}));

// login a user
/*router.post('/auth/login/local', function(req, res, next)
{
	if(!req.body.username || !req.body.password)
	{
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err, user, info)
	{
	if(err)
	{ 
		return next(err); 
	}

    console.log("<user>: " + user);
    console.log("<info>: " + info);

	if(user)
	{
		return res.json({token: User.generateToken(user.username)});
	} 
	else 
	{
		return res.status(401).json(info);
	}
	})(req, res, next);
});*/

// logout a user
router.get('/auth/logout', function (req, res)
{
    req.logout();
    res.redirect('/login.html');
})

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
router.get('/auth/login/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
/*router.get('/auth/login/facebook/callback', passport.authenticate('facebook'), function (req, res)
{
    console.log("According the legend this will get called at callback");
    console.log("<req>: " + JSON.stringify(req.user));
});*/

router.get('/auth/login/facebook/callback', passport.authenticate('facebook', { successRedirect: '/index.html',
                                    failureRedirect: '/login.html' }));

// get the current state of a tournament in JSON form
router.get('/tournament/:tournament_id', function (req, res)
{
    Tournament.findById(req.params.tournament_id, function (err, tournament)
    {
        if(err)
        {
            res.sendStatus(400);
            return;
        }
        if(tournament === null)
        {
            res.sendStatus(404);
            return;
        }

        var result = {};
        result._id = tournament._id;
        result.date = tournament.date;
        result.begun = tournament.begun;
        result.players = tournament.players;
        tournament.getRounds(function (rounds)
        {
            result.rounds = rounds;
            res.end(JSON.stringify(result));
            return;
        });
    });
});

// create a new tournament hosted by the user
// data = {
//      title:  (title of the tournament)
//  }
router.post('/tournament/create', auth, function (req, res)
{
    console.log("Attempting to create tournament");
    if(!req.body.title)
    {
        return res.status(400).json({ message: 'Please provide username and title' });
    }

    User.verifyToken(req.headers.authorization, function (decoded)
    {
        if(!decoded)
        {
            res.sendStatus(401);
            return;
        }
        console.log("Verifying Token");
        console.log("<decoded>: " + JSON.stringify(decoded));
        User.find({username: decoded.username}, function (err, user)
        {
            if(err)
            {
                res.sendStatus(400);
                return;
            }
            if(!user)
            {
                res.sendStatus(404);
                return;
            }

            var newTournament = new Tournament();
            newTournament.title = req.body.title;
            var date = new Date();
            newTournament.date = date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear() +
                " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            newTournament.host = user.username;
            newTournament.begun = false;
            newTournament.save(function(err)
            {
                if(err)
                {
                    res.sendStatus(400);
                    return;
                }
                res.end("OK");
            });
        });
    });
});

// add a new player string to the identified tournament
router.post('/tournament/:tournament_id/addplayer', function (req, res)
{
    Tournament.findById(req.params.tournament_id, function (err, tournament)
    {
        if(err)
        {
            res.sendStatus(400);
            return;
        }
        if(!tournament)
        {
            res.sendStatus(404);
            return;
        }

        if(!req.body.player)
        {
            return res.status(400);
        }
        else
        {
            tournament.addPlayer(req.body.player, function(success)
            {
                if(success)
                {
                    res.sendStatus(200);
                    return;
                }
                else
                {
                    res.sendStatus(403);
                    return;
                }
            });
        }
    });
});

//------------------------------------------------------------
//  Test API for blog, dev only, will be deleted
//------------------------------------------------------------
router.get('/testTournament', function (req, res)
{
    console.log("TESTING TOURNAMENT CREATION");

    var newTournament = new Tournament();
    var date = new Date();
    newTournament.date = date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear() +
        " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    newTournament.begun = false;
    newTournament.save(function(err)
    {
        if(err)
        {
            res.sendStatus(400);
            return;
        }
        res.end("OK");
    });

    newTournament.addPlayer("Josh");
    newTournament.addPlayer("Clayton");
    newTournament.addPlayer("Macquel");
    newTournament.addPlayer("Alisha");
    newTournament.addPlayer("Jared");
    newTournament.startTournament();
});

router.get('/clearData', function (req, res)
{
    console.log("CLEARING DATABASE");

    Tournament.find({}).remove().exec();
    Round.find({}).remove().exec();
    Match.find({}).remove().exec();

    res.end("OK");
});

router.post('/testUser', isLoggedIn, function (req, res)
{
    console.log("<Request>: " + JSON.stringify(req.headers) + "\nBody: " + JSON.stringify(req.body));
    console.log("<SUCCESS>");
    res.end("OK");
});

router.get('/testFacebookUser', isLoggedIn, function (req, res)
{
    console.log("<testFacebookUser>");
    console.log("<Request>: " + JSON.stringify(req.headers) + "\nBody: " + req.user);
    
});

function isLoggedIn(req, res, next)
{
    console.log("isLoggedIn");
    console.log("<User>: " + JSON.stringify(req.user));
    if (req.isAuthenticated())
        return next();

    console.log("not logged in");
    res.redirect('/login.html');
};

router.post('/createNewPost', auth, function (req, res)
{
    console.log("creating new post");
    
    var newEntry = new Entry();
    newEntry.author = req.body.author;
    newEntry.title = req.body.title;
    newEntry.date = req.body.date;
    newEntry.tags = req.body.tags;
    newEntry.body = req.body.body;

    newEntry.save(function(err) 
    {
        if (err)
        {
        	res.sendStatus("500");
			return;
        }
        res.end("OK");
    });
});

router.post('/createSecret', function (req, res)
{
	console.log("creating new secret");

	var newSecret = new Secret();
	newSecret._id = req.body._id;
	newSecret.secret = req.body.secret;

	newSecret.save(function(err)
	{
		if (err)
		{
			res.sendStatus("500");
			return;
		}
		res.end("OK");
	});
});


//------------------------------------------------------------
// End dev API section
//------------------------------------------------------------

module.exports = router;

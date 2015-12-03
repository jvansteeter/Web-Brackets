var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Tournament = mongoose.model('Tournament');
var Round = mongoose.model('Round');
var Match = mongoose.model('Match');
var Entry = mongoose.model('Entry');
var Secret = mongoose.model('Secret');
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
router.post('/auth/register', function (req, res) 
{
	console.log("attempting to register a new user");
    
    if(!req.body.username || !req.body.password)
	{
		return res.status(400).json({ message: 'Please fill out all fields' });
	}

	// find or create the user with the given username
    User.findOrCreate({username: req.body.username}, function(err, user, created) 
    {
        if (created) 
        {
            // if this username is not taken, then create a user record
            user.name = req.body.name;
            user.set_password(req.body.password);
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
});

// login a user
router.post('/auth/login/local', function(req, res, next)
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

	if(user)
	{
		return res.json({token: User.generateToken(user.username)});
	} 
	else 
	{
		return res.status(401).json(info);
	}
	})(req, res, next);
});

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
router.get('/auth/login/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
router.get('/auth/login/facebook/callback',
	passport.authenticate('facebook', { successRedirect: '/index.html',
                                      failureRedirect: '/login.html' }));

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
            throw err;
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

// get all items for the user
router.get('/api/items', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, find all the user's items and return them
	    Item.find({user:user.id}, function(err, items) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
		// return value is the list of items as JSON
		res.json({items: items});
	    });
        } else {
            res.sendStatus(403);
        }
    });
});

// add an item
router.post('/api/items', function (req,res) {
    // validate the supplied token
    // get indexes
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, create the item for the user
	    Item.create({title:req.body.item.title,completed:false,user:user.id}, function(err,item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
		res.json({item:item});
	    });
        } else {
            res.sendStatus(403);
        }
    });
});

// get an item
router.get('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, then find the requested item
            Item.findById(req.params.item_id, function(err, item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
                // get the item if it belongs to the user, otherwise return an error
                if (item.user != user) {
                    res.sendStatus(403);
		    return;
                }
                // return value is the item as JSON
                res.json({item:item});
            });
        } else {
            res.sendStatus(403);
        }
    });
});

// update an item
router.put('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, then find the requested item
            Item.findById(req.params.item_id, function(err,item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
                // update the item if it belongs to the user, otherwise return an error
                if (item.user != user.id) {
                    res.sendStatus(403);
		    return;
                }
                item.title = req.body.item.title;
                item.completed = req.body.item.completed;
                item.save(function(err) {
		    if (err) {
			res.sendStatus(403);
			return;
		    }
                    // return value is the item as JSON
                    res.json({item:item});
                });
	    });
        } else {
            res.sendStatus(403);
        }
    });
});

// delete an item
router.delete('/api/items/:item_id', function (req,res) {
    // validate the supplied token
    user = User.verifyToken(req.headers.authorization, function(user) {
        if (user) {
            // if the token is valid, then find the requested item
            Item.findByIdAndRemove(req.params.item_id, function(err,item) {
		if (err) {
		    res.sendStatus(403);
		    return;
		}
                res.sendStatus(200);
            });
        } else {
            res.sendStatus(403);
        }
    });
});

module.exports = router;

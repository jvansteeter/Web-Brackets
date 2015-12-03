var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var configAuth = require('./auth');

// used to serialize the user for the session
passport.serializeUser(function(user, done) 
{
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) 
{
    User.findById(id, function(err, user) 
    {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function (username, password, done)
{
	console.log("in passport.js");
	User.findOne({ username: username }, function (err, user)
	{
		if (err)
		{
			return done(err);
		}
		if(!user)
		{
			return done(null, false, { message: 'Incorrect username.' });
		}
		if(!user.checkPassword(password))
		{
			return done(null, false, { message: 'Incorrectpassword.' });
		}
		console.log("returning user");
		return done(null, user);
	});
}));

passport.use(new FacebookStrategy(
{
    clientID: configAuth.facebook.clientID,
    clientSecret: configAuth.facebook.clientSecret,
    callbackURL: configAuth.facebook.callbackURL
},
function(token, refreshToken, profile, done) 
{
	console.log("I gotta see this: " + JSON.stringify(profile));
    // asynchronous
    process.nextTick(function() 
    {
        // find the user in the database based on their facebook id
        User.findOne({ 'facebook.id' : profile.id }, function(err, user) 
        {
            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
                return done(err);

            // if the user is found, then log them in
            if (user) 
            {
                return done(null, user); // user found, return that user
            } 
            else 
            {
                // if there is no user found with that facebook id, create them
                var newUser            = new User();

                // set all of the facebook information in our user model
                newUser.facebook.id    = profile._json.id; // set the users facebook id                   
                newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                newUser.facebook.name  = profile._json.name; // look at the passport user profile to see how names are returned
            
                // save our user to the database
                newUser.save(function(err) 
                {
                    if (err)
                        throw err;
                    // if successful, return the new user
                    return done(null, newUser);
                });
            }
        });
    });

}));

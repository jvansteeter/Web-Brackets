var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var configAuth = require('./auth');

// used to serialize the user for the session
passport.serializeUser(function(user, done) 
{
    console.log("<Serializing user>: " + user);
    done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) 
{
    console.log("<Deserializing user>");
    User.findById(id, function(err, user) 
    {
        done(err, user);
    });
});

passport.use('local-register', new LocalStrategy(function (username, password, done) 
{
    console.log("Authenticate with local-register");
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({ username: username }, function(err, user) 
    {
        // if there are any errors, return the error
        if (err)
            return done(err);

        // check to see if theres already a user with that email
        if (user) 
        {
            return done(null, false, {message: "username already taken"});
        } 
        else 
        {
            // if there is no user with that email
            // create the user
            var newUser = new User();

            // set the user's local credentials
            newUser.username = username;
            console.log("<about to set password>");
            newUser.setPassword(password); 
            console.log("<Set password complete>");

            // save the user
            newUser.save(function(err) 
            {
                if (err)
                    throw err;
                return done(null, newUser);
            });
        }

    });

}));

passport.use('local', new LocalStrategy(function (username, password, done)
{
	console.log("Authenticating locally");
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
		//console.log("returning user");
		return done(null, user);
	});
}));

passport.use('facebook', new FacebookStrategy(
{
    clientID: configAuth.facebook.clientID,
    clientSecret: configAuth.facebook.clientSecret,
    callbackURL: configAuth.facebook.callbackURL
},
function(token, refreshToken, profile, done) 
{
	console.log("Authenticating with facebook");
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
                newUser.username = profile._json.name; // also make the profile name their username for Brackets
            
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

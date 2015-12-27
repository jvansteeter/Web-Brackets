var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var secretSchema = new mongoose.Schema(
{
    _id : String, 
    config : 
    {
    	clientID: String,
    	secret: String,
    	callbackURL: String
    }
});

// Return the local auth secret hash
/*secretSchema.methods.local = function() 
{
    Secret.findOne({_id: "local"},function(err,secret) 
    {
	    return secret.secret;
	});
};

// Return the local auth secret hash
secretSchema.methods.facebook = function() 
{
    Secret.findOne({_id: "facebook"},function(err,secret) 
    {
	    return secret.secret;
	});
};*/

mongoose.model('Secret', secretSchema);
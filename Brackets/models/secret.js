var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var secretSchema = new mongoose.Schema(
{
    _id : String, 
    secret : String
});

// Return the local auth secret hash
secretSchema.statics.local = function() 
{
    Secret.findOne({_id: "local"},function(err,secret) 
    {
	    return secret.secret;
	});
};

// Return the local auth secret hash
secretSchema.statics.facebook = function() 
{
    Secret.findOne({_id: "facebook"},function(err,secret) 
    {
	    return secret.secret;
	});
};

mongoose.model('Secret', secretSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Match = mongoose.model('Match')

var roundSchema = new mongoose.Schema(
{
	tournament_id : String,
	roundNum: Number,
    matches: []
});

roundSchema.methods.getMatches = function(roundId, callback)
{
	console.log("<Getting Matches>");
	
	for(var i = 0; i < matches.length; i++)
	{
		Match.findById(matches[i], function(err, match)
		{

		});
	}
};


mongoose.model('Round', roundSchema);
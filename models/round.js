var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Match = mongoose.model('Match')

var roundSchema = new mongoose.Schema(
{
	tournament_id : String,
	roundNum: Number,
    matches: [],
    active: Boolean
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

roundSchema.methods.addPlayer = function (player, matchNum, playerNum)
{
	console.log("<Adding " + player + " into the next round>: " + matchNum + " : " + playerNum);

	Match.find({_id: {$in: this.matches }}, function (err, matches)
	{
		if(playerNum === 1)
		{
			matches[matchNum].player1 = player;
			matches[matchNum].save();
		}
		if(playerNum === 2)
		{
			matches[matchNum].player2 = player;
			matches[matchNum].save();
		}
	});
};

roundSchema.methods.activate = function ()
{
	console.log("<Activating round>: " + this.roundNum);
	this.active = true;
	Match.find({_id: {$in: this.matches }, player2: {$exists: false }}, function (err, matches)
	{
		console.log("<I found these matches in active>: " + matches);
		/*for(var i = 0; i < matches.length; i++)
		{
			console.log("<setting " + matches[i].player1 + " to winner of match>: " + matches[i]);
			matches[i].winner = matches[i].player1;
			matches[i].save();
		}*/
	});
};

mongoose.model('Round', roundSchema);
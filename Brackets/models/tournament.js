var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = mongoose.model('User');
var Match = mongoose.model('Match');
var Round = mongoose.model('Round');

var tournamentSchema = new mongoose.Schema(
{
    date: String,
    players: [],
    begun: Boolean,
    rounds: []
});

function shuffle(array) 
{
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) 
  {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// add a player to the tournament roster
tournamentSchema.methods.addPlayer = function(username) 
{
	if(!this.begun)
	{
		this.players.push(username);
		return true;
	}
	else
	{
		return false;
	}
};

// get list of all players currently registered
tournamentSchema.methods.getPlayers = function()
{
	return this.players;
};

// begin the tournament and generate the bracket
tournamentSchema.methods.startTournament = function()
{
	begun = true;
	shuffle(this.players);

	// hard code the first round
	var firstRound = new Round();
	var roundNum = 1;
	firstRound.tournament_id = this._id;
	firstRound.roundNum = 1;

	for(var i = 0; i < this.players.length; i += 2)
	{
		var newMatch = new Match();
		match.tournament_id = this.tournament_id;
		match.roundNum = roundNum;
		match.player1 = this.players[i];
		if((i + 1) > this.players.length)
		{
			match.player2 = null;
		}
		else
		{
			match.player2 = player[i + 1];
		}

		newMatch.save(function(err)
		{
			if(err)
				throw err;
			firstRound.matchs.push(newMatch);
		});
	}

	firstRound.save(function(err)
	{
		if(err)
			throw err;
	});

	var numPlayers = this.players.length;
	if((numPlayers % 2) === 1)
		numPlayers++;

	// dynamically produce the rest of the bracket with blank matches
	for(var i = (numPlayers / 2); i !== 1; i /= 2)
	{
		roundNum++;
		var newRound = new Round();
		newRound.tournament_id = this._id;
		newRound.roundNum = roundNum;

		if((i % 2) === 1)
			i++;
		for(var j = i / 2; j < i; j++)
		{
			var newMatch = new Match();
			newMatch.tournament_id = this._id;
			newMatch.roundNum = roundNum;
			newMatch.save(function(err)
			{
				if(err)
					throw err;
				newRound.matches.push(newMatch);
			});
		}
		newRound.save(function(err)
		{
			if(err)
				throw err;
		});
	}

	
}

mongoose.model('Tournament', tournamentSchema);
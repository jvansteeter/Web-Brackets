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
tournamentSchema.methods.addPlayer = function(username, callback) 
{
	if(!this.begun)
	{
		this.players.push(username);
		callback(true);
	}
	else
	{
		callback(false);
	}
};

// get list of all players currently registered
tournamentSchema.methods.getPlayers = function()
{
	return this.players;
};

tournamentSchema.methods.getRounds = function(callback)
{
	Round.find({_id: {$in: this.rounds}}, function (err, roundInfo)
	{
		if(err)
			throw err;
		if(roundInfo === null)
		{
			callback(null);
			return;
		}

		// find and query the matchIds of all the found rounds
		var matchIds = [];
		for(var i = 0; i < roundInfo.length; i++)
		{
			for(var j = 0; j < roundInfo[i].matches.length; j++)
			{
				matchIds.push(roundInfo[i].matches[j]);
			}
		}
		Match.find({_id: {$in: matchIds}}, function (err, matchInfo)
		{
			if(err)
			{
				callback(null)
			}
			if(matchInfo === null)
			{
				callback(null);
				return;
			}
			
			var result = [];
			for(var i = 0; i < roundInfo.length; i++)
			{
				result.push([]);
			}
			for(var i = 0; i < matchInfo.length; i++)
			{
				var index = matchInfo[i].roundNum - 1;
				var match = {};
				match.player1 = matchInfo[i].player1;
				if('player2' in matchInfo[i])
				{
					match.player2 = matchInfo[i].player2;
				}
				if('winner' in matchInfo[i])
				{
					match.winner = matchInfo[i].winner;
				}
				result[index].push(match);
			}
			callback(result);
		});
	});
};

// begin the tournament and generate the bracket
tournamentSchema.methods.startTournament = function()
{
	this.begun = true;
	shuffle(this.players);

	// hard code the first round
	var firstRound = new Round();
	var roundNum = 1;
	firstRound.tournament_id = this._id;
	firstRound.roundNum = 1;

	for(var i = 0; i < this.players.length; i += 2)
	{
		var newMatch = new Match();
		newMatch.tournament_id = this._id;
		newMatch.roundNum = roundNum;
		newMatch.player1 = this.players[i];
		if((i + 1) >= this.players.length)
		{
			newMatch.winner = this.players[i];
		}
		else
		{
			newMatch.player2 = this.players[i + 1];
		}

		newMatch.save(function(err)
		{
			if(err)
				throw err;
		});
		firstRound.matches.push(newMatch._id);
	}

	firstRound.save(function(err)
	{
		if(err)
			throw err;
	});
	this.rounds.push(firstRound._id);

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
			});
			newRound.matches.push(newMatch._id);
		}
		newRound.save(function(err)
		{
			if(err)
				throw err;
		});
		this.rounds.push(newRound._id);
	}
}

mongoose.model('Tournament', tournamentSchema);
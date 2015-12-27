var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = mongoose.model('User');
var Match = mongoose.model('Match');
var Round = mongoose.model('Round');

var tournamentSchema = new mongoose.Schema(
{
	title: String,
    date: String,
    host: String,
    players: [],
    begun: Boolean,
    active: Boolean,
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

// switch the tournament activity value to false
tournamentSchema.methods.deactivate = function()
{
	this.active = false;
};

// private function used to assemble a complete tournament JSON object
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
	console.log("<In Tournament Model starting Tournament>");

	this.begun = true;
	shuffle(this.players);

	// hard code the first round
	var firstRound = new Round();
	var roundNum = 1;
	firstRound.tournament_id = this._id;
	firstRound.roundNum = 1;
	firstRound.active = true;

	var matchNum = 1;
	for(var i = 0; i < this.players.length; i += 2)
	{
		var newMatch = new Match();
		newMatch.tournament_id = this._id;
		newMatch.roundNum = roundNum;
		newMatch.matchNum = matchNum++;
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
		newRound.active = false;

		var matchNum = 1;
		if((i % 2) === 1)
			i++;
		for(var j = i / 2; j < i; j++)
		{
			var newMatch = new Match();
			newMatch.tournament_id = this._id;
			newMatch.roundNum = roundNum;
			newMatch.matchNum = matchNum++;
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

	//Any players that received a bye, automatically advance to the next round
	advanceWinners(this.rounds);
};

tournamentSchema.methods.advancePlayer = function (player, cb)
{
	console.log("<In Tournament.js attempting to advance a player, this is going to suck!>");

	var round_ids = [];
	for(var i = 0; i < this.rounds.length; i++)
	{
		round_ids.push(this.rounds[i]);
	}
	Round.find({_id: {$in: round_ids }}, function (err, rounds)
	{
		if(err)
			throw err;

		var activeRound;
		for(var i = 0; i < rounds.length; i++)
		{
			if(rounds[i].active)
			{
				activeRound = rounds[i];
				break;
			}
		}
		//
		Match.find({_id: {$in: activeRound.matches }}, function (err, matches)
		{
			console.log("<This active round has # matches>: " + matches.length);
			if(err)
				throw err;

			for(var i = 0; i < matches.length; i++)
			{
				if(matches[i].player1 === player || matches[i].player2 === player)
				{
					console.log("<Advancing " + player + ">");
					matches[i].winner = player;
					matches[i].save();

					// if there was only one match this round, the tournament is now complete
					/*if(matches.length === 1)
					{
						console.log("<Deactivating Tournament>");
						tournament.deactivate();
						console.log("<Tournament active>: " + tournament.active);
					}*/
					break;
				}
			}

			console.log("<Completed advancing " + player + " now working on advancing winners>");
			advanceWinners(round_ids);
			if(matches.length === 1)
			{
				console.log("<Deactivating Tournament>");
				cb(true);
			}
			else
			{
				cb(false);
			}
		});
	});
};

var advanceWinners = function (round_ids)
{
	console.log("<Advancing Winners>");
	Round.find({_id: {$in: round_ids }}, function (err, rounds)
	{
		console.log("<Found Rounds>: " + JSON.stringify(rounds));
		var activeRoundNum;
		for(var i = 0; i < rounds.length; i++)
		{
			if(rounds[i].active)
			{
				console.log("<I have found the active round>: " + i);
				activeRoundNum = i;
				break;
			}
		}
		Match.find({_id: {$in: rounds[activeRoundNum].matches }}, function (err, matches)
		{
			if(err)
				throw err;

			var finishedMatches = 0;
			for(var i = 0; i < matches.length; i++)
			{
				if(matches[i].winner != null)
				{
					finishedMatches++;
					if((activeRoundNum + 1) < rounds.length)
					{
						var nextMatch = Math.floor(i / 2);
						var playerSeat;
						if(i % 2)
						{
							playerSeat = 2;
						}
						else
						{
							playerSeat = 1;
						}
						rounds[activeRoundNum + 1].addPlayer(matches[i].winner, nextMatch, playerSeat);
						rounds[activeRoundNum + 1].save();
					}
				}
			}
			console.log("<This round has " + matches.length + " matches and " + finishedMatches + " finished matches>");
			if(finishedMatches === matches.length)
			{
				console.log("<Therefore I am going to deactive this round>");
				// deactivate this round and activate the next round if there is one
				rounds[activeRoundNum].active = false;
				rounds[activeRoundNum].save();
				if((activeRoundNum + 1) < rounds.length)
				{
					rounds[activeRoundNum + 1].activate();
				}
			}
			
		});
	});
};

mongoose.model('Tournament', tournamentSchema);
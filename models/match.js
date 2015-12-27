var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var matchSchema = new mongoose.Schema(
{
	tournament_id : String,
	roundNum: Number,
	matchNum: Number,
    player1: String,
    player2: String,
    winner: String
});

mongoose.model('Match', matchSchema);
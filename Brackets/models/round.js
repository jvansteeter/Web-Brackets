var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roundSchema = new mongoose.Schema(
{
	tournament_id : String,
	roundNum: Number,
    matches: []
});


mongoose.model('Round', roundSchema);
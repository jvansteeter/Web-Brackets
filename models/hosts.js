var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hostsSchema = new mongoose.Schema(
{
    host: String,
    tournament_id: String
});

mongoose.model('Hosts', hostsSchema);
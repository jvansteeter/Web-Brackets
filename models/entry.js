var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var findOrCreate = require('mongoose-findorcreate');

var entrySchema = new mongoose.Schema(
{
    author : String, 
    title : String,
    date : String,
    tags : [],
    body : String
});

// add findOrCreate
entrySchema.plugin(findOrCreate);

mongoose.model('Entry', entrySchema);
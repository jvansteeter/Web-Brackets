var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// setup bcrypt
var bcrypt = require('bcrypt');
var SALT = bcrypt.genSaltSync();

var userSchema = new mongoose.Schema(
{
    username: {type: String, index: true, unique: true},
    name: String,
    password_hash: String,
    facebook: 
    {
        id: String,
        token: String,
        name: String,
    },
    tournaments_played: []
});

// hash the password
userSchema.methods.setPassword = function(password) 
{
    //this.password_hash = bcrypt.hashSync(password, SALT);
    console.log("<In setPassword>");
    this.password_hash = bcrypt.hashSync(password, SALT, null);
};

// check the password
userSchema.methods.checkPassword = function(password) 
{
    return bcrypt.compareSync(password,this.password_hash);
};

mongoose.model('User', userSchema);
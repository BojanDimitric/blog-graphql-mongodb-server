const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    mail: String,
    pass: String
});

module.exports = mongoose.model('User', userSchema);
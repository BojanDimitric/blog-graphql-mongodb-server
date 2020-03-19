const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    category: String,
    title: String,
    body: String,
    blog: String
});

module.exports = mongoose.model('Post', postSchema);
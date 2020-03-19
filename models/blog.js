const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blogSchema = new Schema({
    name: String,
    user: String
});

module.exports = mongoose.model('Blog', blogSchema);
const mongoose = require('mongoose');

const Scema = mongoose.Schema;

const commentSchema = new Scema({
    comment: String,
    post: String
});

module.exports = mongoose.model('Comment', commentSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true,
        trim: Date.now,
    },
    conversation_id: {
        type: String,
        required: true,
        trim: true,
    },
    user_mood: {
        type: String,
        required: true,
        trim: true,
    }
});

module.exports = mongoose.model('Conversation', schema);
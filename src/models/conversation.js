const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    conversation_id: {
        type: String,
        required: true,
        trim: true,
    },
    last_node_visited: {
        type: String,
        required: false,
        trim: true,
    },
    user_mood: {
        type: String,
        trim: true,
    },
    user_did_routine: {
        type: Boolean,
    },
    mood_before_routine: {
        type: String,
        trim: true,
    },
    mood_after_routine: {
        type: String,
        trim: true,
    },
    text_to_remember: {
        type: String,
    },
});

module.exports = mongoose.model('Conversation', schema);
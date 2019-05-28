const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phonenumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    routine: {
        type: String,
        required: true,
        trim: true,
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    },
});

module.exports = mongoose.model('User', schema);
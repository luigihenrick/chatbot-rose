require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;
const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGO_URL);

// Carrega os Models
const User = require('./src/models/user');
const Conversation = require('./src/models/conversation');

app.use(bodyParser.json());
app.use(express.static('public'));

// Carrega as Rotas
const indexRoute = require('./src/routes/index');
const conversationRoute = require('./src/routes/conversation');

app.use('/', indexRoute);
app.use('/conversation', conversationRoute);
app.listen(port, () => console.log(`Running on port ${port}`));
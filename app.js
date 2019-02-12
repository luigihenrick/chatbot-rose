require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const TelegramBot = require( `node-telegram-bot-api` )
const port = process.env.PORT || 3000;
const app = express();
const bot = new TelegramBot( process.env.BOT_TOKEN, { polling: true } )
const assistant = new AssistantV1({
  iam_apikey: process.env.API_KEY,
  url: 'https://gateway.watsonplatform.net/assistant/api',
  version: process.env.VERSION,
});

var context = {};
var chatId = 0;

app.use(bodyParser.json());

bot.on('new_chat_members', (msg) => {
  bot.sendMessage(msg.chat.id, `Olá ${msg.from.first_name}, sou a Rose! Conte-nos um pouco sobre você, quantos anos tem ou o que gosta de fazer.`);
});

bot.on('message', (msg) => {
  chatId = msg.chat.id; 
  sendMessageToAssistant(msg.text, context);
});

const sendMessageToAssistant = (text, context) => {
  let params = { input: { text }, workspace_id: process.env.WORKSPACE_ID, context };

  assistant.message(params, (err, response) => {
    if (err) sendMessageToBot(`Erro ao processar requisição: ${err}`);
    context = response.context;
    sendMessageToBot(response.output.text[0]);
  });
};

const sendMessageToBot = (msg) => bot.sendMessage(chatId, msg);

app.listen(port, () => console.log(`Running on port ${port}`));
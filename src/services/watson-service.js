require('dotenv').config();
const assistantV1 = require('watson-developer-cloud/assistant/v1');
const userService = require('./user-service');
const conversationService = require('./conversation-service');

const watsonAssistant = new assistantV1({
    iam_apikey: process.env.API_KEY,
    url: process.env.URL,
    version: process.env.VERSION,
});

async function sendMessage(params) {
    if (params.input.text === '{{LOGGED_USER}}') { 
        return await mapUserEntities(params);
    } else if (params.input.text === '{{NEW_TALK}}') {
        return startNewTalk(params);
    } else {
        return sendMessagePromisse(params);
    }
};

function startNewTalk(params){
    params.input = {};
    params.context = {};

    return sendMessagePromisse(params)
    .then((response) => {
        params.input.text = '{{NEW_TALK}}';
        params.context = response.context;
        return sendMessagePromisse(params);
    })
}

async function mapUserEntities(params){
    var user = await userService.getUser(params.conversation.user_id);
    params.input = {};
    params.context = {};

    return sendMessagePromisse(params)
    .then((response) => {
        params.input.text = '{{LOGGED_USER}}';
        params.context = response.context;
        return sendMessagePromisse(params);
    })
    .then((response) => {
        params.input.text = user.name;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
    .then((response) => {
        params.input.text = user.phonenumber;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
    .then((response) => {
        params.input.text = user.routine;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
}

function sendMessagePromisse(params) {
    return new Promise((resolve, reject) => {
        watsonAssistant.message(params, (err, response) => {
            if(err) reject(err);
            
            if (response.output.nodes_visited[response.output.nodes_visited.length - 1] === process.env.NEW_USER_NODE) {
                userService.addUser(params);
            }

            if (response.context.telefone) {
                conversationService.saveConversation(response).then((conv) => {
                    resolve({
                        text: response.output.text,
                        conversation: conv,
                        context: response.context
                    });
                })
            } else {
                resolve({
                    text: response.output.text,
                    context: response.context
                });
            }
        })
    })
}

module.exports = { sendMessage };
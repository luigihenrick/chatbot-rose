const AssistantV1 = require('watson-developer-cloud/assistant/v1');

const watsonAssistant = new AssistantV1({
    iam_apikey: process.env.API_KEY,
    url: process.env.URL,
    version: process.env.VERSION,
});

watsonAssistant.sendMessage = async (params) => {
    if (params.input.text === '{{LOGGED_USER}}') { 
        return mapUserEntities(params);
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

function mapUserEntities(params){
    var context = params.context;
    params.input = {};
    params.context = {};

    return sendMessagePromisse(params)
    .then((response) => {
        params.input.text = '{{LOGGED_USER}}';
        params.context = response.context;
        return sendMessagePromisse(params);
    })
    .then((response) => {
        params.input.text = context.nome;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
    .then((response) => {
        params.input.text = context.telefone;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
    .then((response) => {
        params.input.text = context.rotina;
        params.context = response.context;
        return sendMessagePromisse(params)
    })
}

function sendMessagePromisse(params){
    return new Promise((resolve, reject) => {
        watsonAssistant.message(params, (err, response) => {
            if(err) reject(err);
            resolve(response);
        })
    })
}

module.exports = watsonAssistant;
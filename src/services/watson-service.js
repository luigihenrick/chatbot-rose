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

function startNewTalk(params) {
    params.input = {};
    params.context = {};

    return sendMessagePromisse(params)
        .then((response) => {
            params.input.text = '{{NEW_TALK}}';
            params.context = response.context;
            return sendMessagePromisse(params);
        })
}

async function mapUserEntities(params) {
    var user = await userService.getUserById(params.conversation.user_id);
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

async function sendMessagePromisse(params) {
    const watsonMessage = new Promise((resolve, reject) => {
        watsonAssistant.message(params, (err, response) => {
            if (err) reject(err);
            resolve(response);
        })
    })

    let watsonAnswer = await watsonMessage;

    let result = {
        text: watsonAnswer.output.text,
        options: watsonAnswer.output.generic.length > 0 && watsonAnswer.output.generic.filter(o => o.options).length > 0
            ? watsonAnswer.output.generic.filter(o => o.options)[0].options 
            : undefined,
        context: watsonAnswer.context
    };

    if (watsonAnswer.context.relatorioSolicitado) {
        let data = await conversationService.getConversationData(params.context.telefone);
        
        if (watsonAnswer.context.relatorioSolicitado === 'humor') {
            result.reportType = 'line';
            result.reportData = {
                datasets: [{
                    data: [ 1, 2, 3, 2, 4 ],
                    backgroundColor: 'rgb(75, 192, 192)',
                    borderColor: 'rgb(75, 192, 192)',
                    label: 'Humor'
                }],
                labels: [ '03/06/2019', '04/06/2019', '05/06/2019', '06/06/2019', '07/06/2019' ]
            };
        } else if (watsonAnswer.context.relatorioSolicitado === 'quantidade') {
            result.reportType = 'bar';
            result.reportData = {
                datasets: [{
                    data: [ 5, 8, 10, 9, 12 ],
                    backgroundColor: 'rgb(54, 162, 235)',
                    borderColor: 'rgb(54, 162, 235)',
                    label: 'Atividade: ' + params.context.rotina
                }],
                labels: [ '01/2019', '02/2019', '03/2019', '04/2019', '05/2019' ]
            };
        }
    }

    if (watsonAnswer.output.nodes_visited[watsonAnswer.output.nodes_visited.length - 1] === process.env.PASSWORD_NODE) {
        result.isPassword = true;
    }

    if (watsonAnswer.context.telefone) {
        if (watsonAnswer.output.nodes_visited[watsonAnswer.output.nodes_visited.length - 1] === process.env.NEW_USER_NODE) {
            userService.addUser(params);
        }
        
        let conv = await conversationService.saveConversation(watsonAnswer);
        result.conversation = conv;
    } else {
        result.conversation = conversationService.getConversationModel(watsonAnswer);
    }

    return result;
}

function getReportObject(type, data) {

}

module.exports = { sendMessage };
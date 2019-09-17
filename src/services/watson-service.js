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
    if (params.context.relatorioSolicitado || params.context.verificarLembretes) {
        params.context.relatorioSolicitado = undefined;
        params.context.verificarLembretes = undefined;
    } 
    
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

    if (watsonAnswer.context.verificarLembretes) {
        let data = await conversationService.getConversationData(params.context.telefone);
        let i = 0;
        let notes = data.filter(c => c.text_to_remember).map(c => `Nota ${++i}: ${c.text_to_remember}`);
        let messagesAfter = watsonAnswer.output.text.splice(2);
        watsonAnswer.output.text = watsonAnswer.output.text.concat(notes).concat(messagesAfter);
    }

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
                    data: data.filter(c => c.user_mood).map(c => c.user_mood).slice(0, 15),
                    backgroundColor: 'rgb(75, 192, 192)',
                    borderColor: 'rgb(75, 192, 192)',
                    label: 'Humor'
                }],
                labels: data.filter(c => c.user_mood).map(c => c.date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })).slice(0, 15)
            };
        } else if (watsonAnswer.context.relatorioSolicitado === 'quantidade') {
            let reportData = data.filter(c => c.user_did_routine).reduce((r, a) => {
                let month = a.date.toISOString().replace(new RegExp('\\-\\d{2,}\\T.+'), '');
                r[month] = r[month] || 0;
                r[month] = r[month] + 1;
                return r;
            }, Object.create(null));

            result.reportType = 'bar';
            result.reportData = {
                datasets: [{
                    data: Object.keys(reportData).map(key => reportData[key]),
                    backgroundColor: 'rgb(54, 162, 235)',
                    borderColor: 'rgb(54, 162, 235)',
                    label: 'Atividade: ' + params.context.rotina
                }],
                labels: Object.keys(reportData)
            };
        } else if (watsonAnswer.context.relatorioSolicitado === 'humorAtividade') {
            let reportRoutine = data.filter(c => c.user_did_routine).reduce((r, a) => {
                let month = a.date.toISOString().replace(new RegExp('\\-\\d{2,}\\T.+'), '');
                r[month] = r[month] || [];
                r[month].push(a);
                return r;
            }, Object.create(null));

            result.reportType = 'line';
            result.reportData = {
                datasets: [{
                    data: Object.keys(reportRoutine).map(key => reportRoutine[key][0].user_mood),
                    backgroundColor: 'rgb(255, 205, 86, .3)',
                    borderWidth: 1,
                    label: 'Humor'
                },
                {
                    data: Object.keys(reportRoutine).map(key => reportRoutine[key].length),
                    backgroundColor: 'rgb(54, 162, 235, .3)',
                    borderWidth: 1,
                    label: 'Fez Atividade'
                }],
                labels: Object.keys(reportRoutine)
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

module.exports = { sendMessage };
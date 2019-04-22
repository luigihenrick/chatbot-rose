const AssistantV1 = require('watson-developer-cloud/assistant/v1');

const watsonAssistant = new AssistantV1({
    iam_apikey: process.env.API_KEY,
    url: process.env.URL,
    version: process.env.VERSION,
});

watsonAssistant.sendMessage = (params, callback) => {
    if (params.input.text === '{{LOGGED_USER}}') {
        var context = params.context;

        var firstCallback = function (err, response) {
            if (err) return err;
            params.input.text = '{{LOGGED_USER}}';
            params.context = response.context;
            watsonAssistant.message(params, secondCallback);
        }

        var secondCallback = function (err, response) {
            if (err) return err;
            params.input.text = context.nome;
            params.context = response.context;
            watsonAssistant.message(params, thirdCallback);
        }

        var thirdCallback = function (err, response) {
            if (err) return err;
            params.input.text = context.telefone;
            params.context = response.context;
            watsonAssistant.message(params, lastCallback);
        }

        var lastCallback = function (err, response) {
            if (err) return err;
            params.input.text = context.rotina;
            params.context = response.context;
            watsonAssistant.message(params, callback);
        }

        params.input = {};
        params.context = {};
        return watsonAssistant.message(params, firstCallback);
    }

    if (params.input.text === '{{NEW_TALK}}') {
        var firstCallback = function (err, response) {
            if (err) return err;
            params.input.text = '{{NEW_TALK}}';
            params.context = response.context;
            watsonAssistant.message(params, callback);
        }

        params.input = {};
        params.context = {};
        return watsonAssistant.message(params, firstCallback);
    }

    return watsonAssistant.message(params, callback);
};

module.exports = watsonAssistant;
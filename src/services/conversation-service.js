var UserModel = require('../models/user');
var ConversationModel = require('../models/conversation');

async function saveConversation(params) {
    const user = await UserModel.findOne({ phonenumber: params.context.telefone.replace(new RegExp(phoneReplaceRegex, 'g'), '') });
    let model = await ConversationModel.findOne({ conversation_id: params.context.conversation_id });

    if (user && model) {
        model.user_mood = params.context.humorNaConversa;
        model.user_did_routine = params.context.rotinaRealizada;
        model.mood_before_routine = params.context.humorAntesAtividade;
        model.mood_after_routine = params.context.humorDepoisAtividade;
        model.text_to_remember = params.context.gravarRelembrarNaTerapia ? params.context.textoRelembrarNaTerapia : '';
        model.last_node_visited = params.output.nodes_visited[params.output.nodes_visited.length - 1];

        await ConversationModel.updateOne({ conversation_id: params.context.conversation_id }, model);
    } else if (user) {
        model = new ConversationModel();

        model.user_id = user._id;
        model.user_mood = params.context.humorNaConversa;
        model.conversation_id = params.context.conversation_id;
        model.last_node_visited = params.output.nodes_visited[params.output.nodes_visited.length - 1];

        await model.save();
    }

    return model;
}

async function getConversationData(phonenumber) {
    const user = await UserModel.findOne({ phonenumber: phonenumber.replace(new RegExp(phoneReplaceRegex, 'g'), '') });
    return await ConversationModel.find({ user_id: user._id });
}

function getConversationModel(params) {
    let model = new ConversationModel();

    if (params.context) {
        model.user_mood = params.context.estadoUsuario;
        model.conversation_id = params.context.conversation_id;
    }

    if (params.output){
        model.last_node_visited = params.output.nodes_visited[params.output.nodes_visited.length - 1];
    }
    
    return model;
}

module.exports = { saveConversation, getConversationModel, getConversationData }
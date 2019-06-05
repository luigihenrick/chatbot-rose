var UserModel = require('../models/user');
var ConversationModel = require('../models/conversation');

async function saveConversation(params){
    const user = await UserModel.findOne({ phonenumber: params.context.telefone.replace(new RegExp(phoneReplaceRegex, 'g'), '') });
    let model = await ConversationModel.findOne({ conversation_id: params.context.conversation_id });
    
    if (user && model) {
        model.user_mood = params.context.estadoUsuario;
        model.last_node_visited = params.output.nodes_visited[params.output.nodes_visited.length - 1];

        await ConversationModel.updateOne({conversation_id: params.context.conversation_id}, model);
    } else if (user) {
        model = new ConversationModel();

        model.user_id = user._id;
        model.user_mood = params.context.estadoUsuario;
        model.conversation_id = params.context.conversation_id;
        model.last_node_visited = params.output.nodes_visited[params.output.nodes_visited.length - 1];
    
        await model.save();
    }

    return model;
}

module.exports = { saveConversation }
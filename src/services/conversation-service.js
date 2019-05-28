var UserModel = require('../models/user');
var ConversationModel = require('../models/conversation');

async function saveConversation(params){
    const user = await UserModel.findOne({ phonenumber: params.context.telefone });
    if (user) {
        const model = new ConversationModel();

        model.user = user._id;
        model.user_mood = params.context.estadoUsuario;
        model.conversation_id = params.context.conversation_id;
    
        //var savedConversation = await model.save();
        await ConversationModel.findOneAndUpdate({conversation_id: params.context.conversation_id}, model, {upsert: true});
    }
}

module.exports = { saveConversation }
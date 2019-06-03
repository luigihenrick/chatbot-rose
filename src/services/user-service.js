var UserModel = require('../models/user');

async function addUser(params){
    const user = await UserModel.findOne({phonenumber: params.context.telefone.replace(new RegExp(phoneReplaceRegex, 'g'), '')});
    if (user) {
        return user;
    } else {
        const model = new UserModel();

        model.name = params.context.nome;
        model.routine = params.context.rotina;
        model.phonenumber = params.context.telefone.replace(new RegExp(phoneReplaceRegex, 'g'), '');
        model.password = params.context.senhaAcesso;

        var savedUser = await model.save();
        return savedUser;
    }
}

async function getUser(userId){
    const user = await UserModel.findOne({ _id: userId });
    return user;
}

module.exports = { addUser, getUser }
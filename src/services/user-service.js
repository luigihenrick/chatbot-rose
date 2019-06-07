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

async function getUserById(userId){
    const user = await UserModel.findOne({ _id: userId });
    return user;
}

async function getUserByPhone(phonenumber){
    const user = await UserModel.findOne({ phonenumber: phonenumber.replace(new RegExp(phoneReplaceRegex, 'g'), '') });
    return user;
}

async function authenticateUser(userId, password){
    const user = await UserModel.findOne({ _id: userId });
    return user.password === password;
}

module.exports = { addUser, getUserById, getUserByPhone, authenticateUser }
var UserModel = require('../models/user');

async function addUser(params){
    const user = await UserModel.findOne({phonenumber: params.context.telefone});
    if (user) {
        return user;
    } else {
        const model = new UserModel();

        model.name = params.context.nome;
        model.routine = params.context.rotina;
        model.phonenumber = params.context.telefone;

        var savedUser = await model.save();
        return savedUser;
    }
}

module.exports = { addUser }
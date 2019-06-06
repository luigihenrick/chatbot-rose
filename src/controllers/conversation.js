const express = require('express');
const watsonService = require('../services/watson-service');
const userService = require('../services/user-service');
const app = express();

app.post('/', async (req, res) => {
    const { text, context = {}, conversation = {} } = req.body;

    let params = {
        input: { text },
        workspace_id: process.env.WORKSPACE_ID,
        context,
        conversation
    };

    if (conversation.last_node_visited === process.env.PASSWORD_NODE && text !== '{{LOGGED_USER}}' && text !== '{{NEW_TALK}}') {
        let authenticated = await userService.authenticateUser(conversation.user_id, text);
        if (authenticated === false) {
            res.status(401).json('Falha ao autenticar senha.');
        } else {
            params.input = { text: "{{AUTH_SUCCESS}}" };
        }
    }

    if (conversation.last_node_visited === process.env.LOCATE_USER_NODE && text !== '{{LOGGED_USER}}' && text !== '{{NEW_TALK}}') {
        let user = await userService.getUserByPhone(text);
        if (user) {
            params.conversation.user_id = user._id;
            params.input = { text: "{{LOGGED_USER}}" };
        } else {
            res.status(401).json('Não foi possível localizar seu usuário.');
        }
    }

    watsonService.sendMessage(params)
        .then((response) => {
            if (response != null) {
                res.json(response);
            } else {
                res.status(500).json('Falha ao enviar mensagem, tente novamente.');
            }
        })
        .catch((rej) => {
            res.status(500).json(rej);
        });
});

module.exports = app;
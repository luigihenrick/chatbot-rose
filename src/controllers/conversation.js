const express = require('express');
const watsonService = require('../services/watson-service');
const userService = require('../services/user-service');
const app = express();

app.post('/', (req, res) => {
    const { text, context = {}, conversation = {} } = req.body;

    const params = {
        input: { text },
        workspace_id: process.env.WORKSPACE_ID,
        context,
        conversation
    };

    if (conversation.last_node_visited === process.env.PASSWORD_NODE 
        && text !== '{{LOGGED_USER}}' && text !== '{{NEW_TALK}}') {
        userService.authenticateUser(conversation.user_id, text).then((authorized) => {
            if (!authorized) {
                res.status(401).json('Falha ao autenticar senha.');
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
        })
    } else {
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
    }
});

module.exports = app;
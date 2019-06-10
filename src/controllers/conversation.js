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
            res.status(403).send({error: 'Falha ao autenticar senha.'});
            return;
        } else {
            params.input = { text: '{{AUTH_SUCCESS}}' };
        }
    }

    if (conversation.last_node_visited === process.env.LOCATE_USER_NODE && text !== '{{LOGGED_USER}}' && text !== '{{NEW_TALK}}') {
        let user = await userService.getUserByPhone(text);
        if (user) {
            params.conversation.user_id = user._id;
            params.input = { text: '{{LOGGED_USER}}' };
        } else {
            res.status(401).send({error: 'Não foi possível localizar seu usuário.'});
            return;
        }
    }

    watsonService.sendMessage(params)
        .then((response) => {
            if (response != null) {
                response.reportType = 'line';
                response.reportData = {
                    datasets: [{
                        data: [ 10, 20, 30, 20, 40 ],
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        label: 'Fez Atividade'
                    }],
                    labels: [ '01/2019', '02/2019', '03/2019', '04/2019', '05/2019' ]
                };
                res.send(response);
            } else {
                res.status(500).send({error: 'Falha ao enviar mensagem, tente novamente.'});
            }
        })
        .catch((rej) => {
            res.status(500).send({error: rej});
        });
});

module.exports = app;
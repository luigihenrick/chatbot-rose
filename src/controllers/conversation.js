const express = require('express');
const watsonService = require('../services/watson-service');
const app = express();

app.post('/', (req, res) => {
    const { text, context = {} } = req.body;
  
    const params = {
      input: { text },
      workspace_id: process.env.WORKSPACE_ID,
      context,
    };
  
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
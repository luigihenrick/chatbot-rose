require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const watson = require('./client-watson');

const port = process.env.PORT || 3000;
const app = express();

var users = {};

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

app.post('/conversation/', (req, res) => {
  const { text, context = {} } = req.body;

  const params = {
    input: { text },
    workspace_id: process.env.WORKSPACE_ID,
    context,
  };

  watson.sendMessage(params, (err, response) => {
    if (err) res.status(500).json(err);

    if (response != null) {
      res.json(response);
    } else {
      res.status(500).json('Falha ao enviar mensagem, tente novamente.');
    }
  });
});

app.listen(port, () => console.log(`Running on port ${port}`));
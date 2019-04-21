require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');

const assistant = new AssistantV1({
  iam_apikey: process.env.API_KEY,
  url: process.env.URL,
  version: process.env.VERSION,
});

const port = process.env.PORT || 3000;
const app = express();

var params = {
  input: {},
  context: {},
  workspace_id: process.env.WORKSPACE_ID,
};

var users = {};

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

app.post('/conversation/', (req, res) => {
  //console.log(req.body);
  text = req.body.text;

  params.input = { text };

  assistant.message(params, (err, response) => {
    if (err) res.status(500).json(err);

    var result = {
      text: response.output.text,
      entities: {
        name: response.context.nome,
        phonenumber: response.context.telefone,
        routine: response.context.rotina
      }
    }
    
    if (!!result.entities.telefone) {
      users[result.entities.telefone] = result.entities;
    }
    
    if (response != null) {
      params.context = response.context;
      res.json(result);
    } else {
      res.status(500).json('Falha ao enviar mensagem, tente novamente.');
    }
  });
});

app.listen(port, () => console.log(`Running on port ${port}`));
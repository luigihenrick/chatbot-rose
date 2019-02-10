require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');

const port = 3000;
const app = express();
app.use(bodyParser.json());


const assistant = new AssistantV1({
    iam_apikey: process.env.API_KEY,
    url: 'https://gateway.watsonplatform.net/assistant/api',
    version: process.env.VERSION,
  });

app.get('/conversation/:text*?', (req, res) => {
  const { text } = req.params;

  res.json(text);
});

app.post('/conversation/', (req, res) => {
    console.log(req.body);
    const { text, context = {} } = req.body;
    
    const params = {
      input: { text },
      workspace_id: process.env.WORKSPACE_ID,
      context,
    };
  
    assistant.message(params, (err, response) => {
      if (err) res.status(500).json(err);
      res.json(response);
    });
  });

app.listen(port, () => console.log(`Running on port ${port}`));
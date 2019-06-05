const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname });
});

module.exports = app;
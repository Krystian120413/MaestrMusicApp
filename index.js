const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const songs = require('./src/routes/songs')
app.use(cors())


app.get('/song', (req, res) => {
    res.sendFile(songs.toString(), { root: __dirname });
});


app.listen(5000, () => {
    console.log('Listening on port 5000!')
});


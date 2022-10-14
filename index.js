const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const songController = require('./src/controllers/songsController');

// const songs1 = require('routes/songs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// GET All songs info (without posters)
app.get('/songs', (req, res) => songController.findAllSongInfo(req, res));

// GET Stream one song
app.get('/songs/:songId', (req, res) => songController.streamOneSong(req, res, 'songId'));

// GET One song info (without poster)
app.get('/songs-info/:songInfoId', (req, res) => songController.findOneSongInfo(req, res, 'songInfoId'));

// GET One song poster
app.get('/songs-info/posters/:posterId', (req, res) => songController.findOneSongPoster(req, res, 'posterId'));


app.listen(5000, () => {
    console.log('Listening on port 5000!');
});

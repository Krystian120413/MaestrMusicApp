const express = require('express');
const app = express();
const Router = require('express').Router;
const catchAsync = require('../middlewares/errors');
const songController = require('./src/controllers/songsController');

module.exports = () => {
    const api = Router();

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });
    
    // GET All songs info (without posters)
    app.get('/songs', (req, res) => catchAsync(songController.findAllSongInfo(req, res)));
    
    // GET Stream one song
    app.get('/songs/:songId', (req, res) => catchAsync(songController.streamOneSong(req, res, 'songId')));
    
    // GET One song info (without poster)
    app.get('/songs-info/:songInfoId', (req, res) => catchAsync(songController.findOneSongInfo(req, res, 'songInfoId')));
    
    // GET One song poster
    app.get('/songs-info/posters/:posterId', (req, res) => catchAsync(songController.findOneSongPoster(req, res, 'posterId')));


    return api;
};
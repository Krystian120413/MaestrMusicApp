const Router = require('express').Router;
const songsController = require('../controllers/songsController');
const catchAsync = require('../middlewares/errors');
const songs = require('../data/songs.json');

module.exports = () => {
    const api = Router();

    //GET songs-info/:id
    api.get('/songs-info/:id', catchAsync(songsController.findOne));

    return api;
};
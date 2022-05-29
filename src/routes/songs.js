const express = require('express');
const router = express.Router();
const songs = require('../data/mockdata');

router.get('/', (req, res) => {
    res.json(songs);
})

module.exports = router;
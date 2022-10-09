const songs = require('./src/data/songs.json');

module.exports = {
    async findOne(req, res, next){},

    async findAll(req, res){
        const allSongs = await songs;
        return res.status(200).send({ data: allSongs });
    },

    async create(req, res){},

    async update(req, res, next){},

    async delete(req, res, next){}
};
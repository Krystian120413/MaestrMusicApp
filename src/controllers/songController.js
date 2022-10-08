const songs = require('./src/data/songs.json');

module.exports = () => {
  // findOne(req, res, next) {},

  async findAll(req, res) {
    const song = await songs;
    return res.status(200).send({ data: songs })
  }
};
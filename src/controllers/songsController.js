const songs = require('../data/songsInfo.json');
const fs = require('fs');

module.exports = {
    async findAllSongInfo(req, res){
        const allSongs = await songs;
        return res.status(200).send({ data: allSongs });
    },

    async findOneSongInfo(req, res, param){
        const songInfoId = await req.params[param] < songs.length && req.params[param] > 0 ? req.params[param] : 0;
        const { title, author } = await songs[songInfoId];
        await res.json({ title, author });
    },

    async streamOneSong(req, res, param){
        const range = await req.headers.range;
        const songId = await req.params[param] < songs.length && req.params[param] > 0 ? req.params[param] : 0;
    
        if(!range){
            res.status(400).send('Requires Range Header');
        }
    
        const song = await songs[songId];
    
        const songPath = song.path;
        const songSize = fs.statSync(songPath).size;
    
        const CHUNK_SIZE = 10 ** 6;  // 1MB
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, songSize - 1);
    
        const contentLength = end - start + 1;
    
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${songSize}`,
            'Accept-Ranges': 'bytes',   
            'Content-Length': contentLength,
            'Content-Type': 'audio/mpeg',
        };
    
        // HTTP Status 206 for Partial Content
        await res.writeHead(206, headers);
    
        const songStream = fs.createReadStream(songPath, { start, end });
    
        await songStream.pipe(res);
    },

    async findOneSongPoster(req, res, param){
        const posterId = await req.params[param] < songs.length && req.params[param] > 0 ? req.params[param] : 0;
        const { posterPath } = await songs[posterId];

        const options = {
            root: __dirname,
            dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Content-Type': 'image/png',
            }
        };

        await res.sendFile(posterPath, options, (error) => {
            if(error) {
                res.sendStatus(error.status);
            }
        });
    }



    // async create(req, res){},

    // async update(req, res, next){},

    // async delete(req, res, next){}
};
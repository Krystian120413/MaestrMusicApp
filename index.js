const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors())
const songs = require('./data/songs.json')

const axios = require('axios')
const httpAdapter = require("axios/lib/adapters/http");
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/songs', (req, res) => {
    res.json(songs);
})

app.get('/songs/:songId', (req, res) => {
    const range = req.headers.range;
    const songId = req.params.songId < songs.length && req.params.songId > 0 ? req.params.songId : 0;

    if(!range){
        res.status(400).send("Requires Range Header")
    }

    const song = songs[songId];

    const songPath = song.path
    const songSize = fs.statSync(songPath).size

    const CHUNK_SIZE = 10 ** 6  // 1MB
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, songSize - 1)

    const contentLength = end - start + 1

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${songSize}`,
        "Accept-Ranges": "bytes",   
        "Content-Length": contentLength,
        "Content-Type": "audio/mpeg",
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    const songStream = fs.createReadStream(songPath, { start, end })

    songStream.pipe(res) 
});

app.get('/songs-info/:songInfoId', (req, res) => {
    const songInfoId = req.params.songInfoId < songs.length && req.params.songInfoId > 0 ? req.params.songInfoId : 0;
    const { title, author } = songs[songInfoId];
    res.json({ title, author });
})

app.get('/songs-info/posters/:posterId', (req, res) => {
    const posterId = req.params.posterId < songs.length && req.params.posterId > 0 ? req.params.posterId : 0;
    const { posterPath } = songs[posterId];

    const options = {
        root: __dirname,
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true,
            'Content-Type': 'image/png',
        }
    };

    res.sendFile(posterPath, options, (error) => {
        if(error) {
            res.send(error.status)
        }
    });
})


app.listen(5000, () => {
    console.log('Listening on port 5000!')
});

// axios.get(songPath, {
    //     responseType: "stream",
    //     adapter: httpAdapter,
    //     "Content-Range": "bytes 16561-8065611",
    // }).then(Response => {
    //     const stream = Response.data;

    //     res.set("content-type", "audio/mp3");
    //     res.set("accept-ranges", "bytes");
    //     res.set("content-length", Response.headers["content-length"]);
    //     console.log(Response);

    //     stream.on("data", (chunk) => {
    //         res.write(chunk)
    //     })

    //     stream.on("error", (err) => {
    //         res.sendStatus(404)
    //     })

    //     stream.on("end", () => {
    //         res.end()
    //     })
    // }).catch((Err) => {
    //     console.log(Err.message)
    // })

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors())
const songs = require('./data/songs.json')

const axios = require('axios')
const httpAdapter = require("axios/lib/adapters/http");


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/song-info', (req, res) => {
    const song = songs[0];
    const {posterPath, title, author} = song;

    res.send({posterPath, title, author})
})

app.get('/song', (req, res) => {
    const range = req.headers.range
    if(!range){
        res.status(400).send("Requires Range Header")
    }

    const song = songs[0];

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
});


app.listen(5000, () => {
    console.log('Listening on port 5000!')
});


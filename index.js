const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors())


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/song', (req, res) => {
    const range = req.headers.range
    if(!range){
        res.status(400).send("Requires Range Header")
    }

    const songPath = 'assets/Motion_Trio-Happy_Band.mp3'
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



    // res.sendFile('data/mockdata.js', { root: __dirname });
});


app.listen(5000, () => {
    console.log('Listening on port 5000!')
});


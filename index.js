require('dotenv').config();

//server
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: '*'
}));
const jwt = require('jsonwebtoken');
const {getAllSongsInfo, getSongUrl, getSongInfo, getPosterPath, getUserPlaylists, getSongsInPlaylist,
    postPlaylistToDatabase, postSongToPlaylist, deletePlaylistFromDatabase, deleteSongFromPlaylist,
    updateActualPlayedSong, getSongIdListenedByUser, postNewUserData, getAllSongsKeywords, getMaxSongId
} = require('./query');
const {max} = require('pg/lib/defaults');

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/user/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    const userName = req.body.userName;

    if(isNaN(userId) || userId < 0 || !userName) {
        res.sendStatus(404);
    }

    const isUserDataUpdated = await postNewUserData(userId, userName);

    if (isUserDataUpdated) {
        res.sendStatus(201);
    }
    else {
        res.sendStatus(403);
    }
});

app.get('/songs', authenticateToken, async (req, res) => {
    const allSongs = await getAllSongsInfo();
    if(typeof allSongs[0] === 'undefined') return res.sendStatus(404);

    const genres = allSongs.reduce((accumulator, currentSong) => {
        const { songId } = currentSong;
        accumulator[songId] = accumulator[songId] ?? [];
        accumulator[songId].push(currentSong.name);
        return accumulator;
    }, {});

    const songs = allSongs.filter((song, index, originalSongs) =>
        index === originalSongs.findIndex(t => t.title === song.title && t.author === song.author));

    res.json(songs.map(({ songId, title, author, duration }) => ({
        songId: songId,
        title: title,
        author: author,
        duration: duration,
        genres: Object.values(genres)[songId - 1]
    })));
});

app.get('/songs/:songId/:userId', async (req, res) => {
    const range = req.headers.range;
    const songId = req.params.songId;
    const userId = req.params.userId;


    if(songId < 0) return res.sendStatus(404);

    if(!range){
        return res.status(400).send('Requires Range Header');
    }

    const songUrl = await getSongUrl(songId);
    if (typeof songUrl === 'undefined') {
        return res.sendStatus(404);
    }

    const isSongUpdated = updateActualPlayedSong(songId, userId);
    if(!isSongUpdated) {
        res.sendStatus(403);
    }

    const songPath = songUrl[0].path;
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
    res.writeHead(206, headers);

    const songStream = fs.createReadStream(songPath, { start, end });

    songStream.pipe(res);
});

app.get('/songs-info/:songInfoId', authenticateToken, async (req, res) => {
    const songInfoId = req.params.songInfoId;

    if(songInfoId < 0 || isNaN(songInfoId)) return res.sendStatus(404);

    const songInfo = await getSongInfo(songInfoId);

    if(typeof songInfo[0] === 'undefined') return res.sendStatus(404);

    res.json({
        title: songInfo[0].title,
        author: songInfo[0].author,
        duration: songInfo[0].duration,
        genres: songInfo.map(({ name }) => (name))
    });
});

app.get('/songs-info/posters/:posterId', authenticateToken, async (req, res) => {
    const posterId = req.params.posterId;

    if(posterId < 0 || isNaN(posterId)) return res.sendStatus(404);

    const posterPath = await getPosterPath(posterId);

    const options = {
        root: __dirname,
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true,
            'Content-Type': 'image/png',
        }
    };

    res.sendFile(posterPath[0].posterPath, options, (error) => {
        if(error) {
            res.send(error.status);
        }
    });
});

app.get('/playlists/users/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;

    if(userId < 0 || isNaN(userId)) return res.sendStatus(404);

    const playlists = await getUserPlaylists(userId);

    res.json(playlists.map(({ name, playlistId }) => ({ name, playlistId })));
});

app.get('/playlists/:playlistId', authenticateToken, async (req, res) => {

    const playlistId = req.params.playlistId;

    if(isNaN(playlistId) || playlistId < 0) {
        return res.sendStatus(404);
    }

    const playlistInfo = await getSongsInPlaylist(playlistId);

    if(typeof playlistInfo[0] === 'undefined') return res.sendStatus(404);

    res.json({
        name: playlistInfo[0].name,
        songs: playlistInfo.map(({ songId, title, author, duration, path, posterPath }) => ({
            songId: songId,
            title: title,
            author: author,
            duration: duration,
            path: path,
            posterPath: posterPath
        })),
    });
});

app.post('/playlists', authenticateToken, async (req, res) => {
    const playlistName = req.body.playlistName;
    const userId = req.body.userId;

    if(!playlistName || isNaN(userId) || userId < 0) {
        return res.sendStatus(400);
    }

    const isPlaylistsCreated = await postPlaylistToDatabase(playlistName, userId);

    if (isPlaylistsCreated) {
        res.sendStatus(201);
    }
    else {
        res.sendStatus(403);
    }
});

app.delete('/playlists/:playlistId', authenticateToken, (req, res) => {
    const playlistId = req.params.playlistId;

    if(isNaN(playlistId) || playlistId < 0) {
        return res.sendStatus(400);
    }

    const isPlaylistDeleted = deletePlaylistFromDatabase(playlistId);

    if (isPlaylistDeleted) {
        res.sendStatus(200);
    }
    else {
        res.sendStatus(403);
    }
});

app.post('/playlist/song', authenticateToken, (req, res) => {
    const songId = req.body.songId;
    const playlistId = req.body.playlistId;

    if(isNaN(songId) || songId < 0 || isNaN(playlistId) || playlistId < 0) {
        return res.sendStatus(400);
    }

    const isSongAddedToPlaylist = postSongToPlaylist(songId, playlistId);

    if (isSongAddedToPlaylist) {
        res.sendStatus(201);
    }
    else {
        res.sendStatus(403);
    }
});

app.delete('/playlist/song', authenticateToken, (req, res) => {
    const songId = req.body.songId;
    const playlistId = req.body.playlistId;

    if(isNaN(songId) || songId < 0) {
        return res.sendStatus(400);
    }

    const isSongDeletedFromPlaylist = deleteSongFromPlaylist(songId, playlistId);

    if (isSongDeletedFromPlaylist) {
        res.sendStatus(201);
    }
    else {
        res.sendStatus(403);
    }
});

app.get('/recommended', async (req, res) => {
    const likedPlaylistId = req.body.likedPlaylistId;

    const likedSongs = await getSongsInPlaylist(likedPlaylistId);

    if (likedSongs.length < 0) {
        res.sendStatus(403);
    }

    const allSongsKeyword = await getAllSongsKeywords();

    if (allSongsKeyword.length < 0) {
        res.sendStatus(403);
    }

    const likedSongsIds = likedSongs.map(({ songId }) => songId);

    const keywords = allSongsKeyword.filter((songKeyword) => likedSongsIds.includes(songKeyword.songId)).map(keyword => keyword.keywordId);

    const mostPopularKeywordsIds = keywords.sort((a,b) =>
        keywords.filter(v => v === a).length - keywords.filter(v => v === b).length)
        .filter((keyword, index) => keywords.indexOf(keyword) === index)
        .reverse()
        .slice(0, 20);

    const maxSongId = await getMaxSongId();

    if(!maxSongId) res.sendStatus(403);

    const maxId = maxSongId[0].max + 1;

    let recommendedSongs = [];

    for(let i = 0; i < 50; i++){
        const randomSongId = Math.floor(Math.random() * maxId);
        const songKeywordsId = allSongsKeyword.filter(song => song.songId = randomSongId).map(({ keywordId }) => keywordId);
        if (songKeywordsId.some(k => mostPopularKeywordsIds.includes(k))) {
            recommendedSongs = [...recommendedSongs, randomSongId];
        }
    }

    const uniqueRecommendedSongs = recommendedSongs.filter((element, index) => recommendedSongs.indexOf(element) === index);

    res.json({
         recommendedSongs: uniqueRecommendedSongs
    });
});

app.get('/radio/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;

    if(isNaN(userId) || userId < 0) {
        res.sendStatus(400);
    }

    const radioSongId = await getSongIdListenedByUser(userId);

    if(typeof radioSongId === 'undefined') return res.sendStatus(404);

    res.json({
        songId: radioSongId
    });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        req.user = user;
        next();
    });
}


app.listen(5000, () => {
    console.log('Listening on port 5000!');
});

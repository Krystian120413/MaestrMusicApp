require('dotenv').config();

const db = require('./query');

const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

app.use(cors({
    origin: '*'
}));
app.use(express.json());

//stored in database
let refreshTokens = [];

app.post('/signup', async (req, res) => {
    const body = req.body;

    if(!(body.username && body.password)){
        return res.status(400).send({ error: 'Data not formatted properly' });
    }

    const isUserSaved = await db.postUserToDatabase(body.username, body.password, body.name);
    const userId = await db.getUserIdAndName(body.username, body.password);
    await db.postPlaylistToDatabase('liked', userId.userId);
    if (isUserSaved){
        res.sendStatus(201);
    }
    else {
        res.sendStatus(403);
    }
});

app.post('/login',  async (req, res) => {
    //Authenticate User

    const username = req.body.username;
    const password = req.body.password;
    const idAndName = await db.getUserIdAndName(username, password);

    if(idAndName) {
        const user = {name: username, idAndName: idAndName};

        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        refreshTokens.push(refreshToken);
        res.json({ accessToken: accessToken, refreshToken: refreshToken, name: idAndName.name, userId: idAndName.userId });
    }
    else {
        res.sendStatus(403);
    }
});

app.post('/token', ((req, res) => {
    const refreshToken = req.body.token;

    if (refreshToken == null) return res.sendStatus(401);
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const accessToken = generateAccessToken({ name: user.name });
        res.json({ accessToken: accessToken });
    });
}));

app.delete('/logout', async (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    const userId = req.body.userId;
    await db.deleteActualPlayedSong(userId);
    res.sendStatus(204);
});

function generateAccessToken(user) {
    return  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '50m' });
}

app.listen(5010, () => {
    console.log('Listening on port 5010!');
});

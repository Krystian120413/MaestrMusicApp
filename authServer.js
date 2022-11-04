require('dotenv').config();

const db = require('./query');

const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());

//stored in database
let refreshTokens = [];

app.post('/login',  async (req, res) => {
    //Authenticate User

    const username = req.body.username;
    const password = req.body.password;
    const id = await db.getUserId(username, password);

    if(id) {
        const user = {name: username, password: password, id: id};

        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        refreshTokens.push(refreshToken);
        res.json({ accessToken: accessToken, refreshToken: refreshToken });
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

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    res.sendStatus(204);
});

function generateAccessToken(user) {
    return  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20m' });
}

app.listen(6000, () => {
    console.log('Listening on port 6000!');
});

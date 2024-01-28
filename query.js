const Pool = require('pg').Pool;

//should be in .env file
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'maestr-database',
    password: 'admin',
    port: 5432,
});

const crypt = require('./crypt');

const getPasswordAndCompare = (username, password) => {
    return new Promise(resolve => {
        pool.query('select "password" from public."Users" where "email" = $1', [username], async (err, res) => {
            if(err){
                throw err;
            }
            if (res.rows[0]){
                const isValid = await crypt.comparePasswords(password, res.rows[0].password);
                resolve(isValid);
            }
            else {
                resolve(null);
            }
        });
    });
};

const checkUserInDatabase = (username) => {
    return new Promise(resolve => {
        pool.query('select "password" from public."Users" where "email" = $1', [username], async (err, res) => {
            if(err){
                throw err;
            }
            if (res.rows[0]){
                resolve(true);
            }
            else {
                resolve(null);
            }
        });
    });
};

const postUserToDatabase = async (username, password, name) => {
    const existInDatabase = await checkUserInDatabase(username);
    if(!existInDatabase) {
        const hashedPassword = await crypt.hashPassword(password);

        return new Promise(resolve => {
            pool.query('insert into public."Users"("email", "password", "name") values ($1, $2, $3)', [username, hashedPassword, name], (error) => {
                if (error) {
                    throw error;
                } else resolve(true);
            });
        });
    }
    else{
        return false;
    }
};

const getUserIdAndName = async (username, password) => {
    const isPasswordValid = await getPasswordAndCompare(username, password);

    return new Promise(resolve => {
        if(isPasswordValid){
            pool.query('select "userId", "name" from public."Users" where "email" = $1', [username], (error, result) => {
                if (error) {
                    throw error;
                }
                if(result.rows[0]){
                    resolve(result.rows[0]);
                }
                else {
                    resolve(null);
                }
            });
        }
        else {
            resolve(null);
        }
    });
};

const postNewUserData = (userId, userName) => {
    return new Promise(resolve => {
        if(isNaN(userId) || !userName) resolve(null);

        pool.query('UPDATE public."Users" SET  name = $1 WHERE "Users"."userId" = $2', [userName, userId], error => {
            if (error) {
                throw error;
            } else resolve(true);
        });
    });
};

const updateActualPlayedSong = async (songId, userId) => {
    return new Promise(resolve => {
        if(isNaN(userId) || isNaN(songId)) resolve(null);

        pool.query('UPDATE public."Users" SET "actualPlayedSongId"= $1 WHERE "Users"."userId" = $2', [songId, userId], error => {
            if (error) {
                throw error;
            } else resolve(true);
        });
    });
};

const deleteActualPlayedSong = async (userId) => {
    return new Promise(resolve => {
        if(isNaN(userId)) resolve(null);

        pool.query('UPDATE public."Users" SET "actualPlayedSongId"=null WHERE "Users"."userId" = $1', [userId], error => {
            if (error) {
                throw error;
            } else resolve(true);
        });
    });
};

const getSongIdListenedByUser = async (userId) => {
    return new Promise(resolve => {
        if(isNaN(userId)) resolve(null);

        pool.query('SELECT "actualPlayedSongId" FROM public."Users" where "Users"."userId" = $1', [userId], (error, result) => {
            if (error) {
                resolve(null);
            } else {
                if(result.rows.length === 0){
                    resolve(null);
                }
                else resolve(result.rows[0].actualPlayedSongId);
            }
        });
    });
};

const getAllSongsInfo = async () => {
    return new Promise(resolve => {
            pool.query('select * ' +
            'from public."Songs" ' +
            'inner join public."Songs-Genres" ' +
            'on "Songs"."songId"="Songs-Genres"."songId" ' +
            'inner join public."Genres" ' +
            'on "Songs-Genres"."genreId"="Genres"."genreId"', [], (error, result) => {
            if (error) {
                throw error;
            }
            else {
                resolve(result.rows);
            }
        });
    });
};

const getSongUrl = async (songId) => {
    return new Promise(resolve => {
        if(isNaN(songId)) resolve(null);
        pool.query('select "path" from public."Songs" where "songId"=$1', [songId], (error, result) => {
            if (error) {
                throw error;
            }
            else {
                resolve(result.rows);
            }
        });
    });
};

const getSongInfo = async (songId) => {
    return new Promise(resolve => {
        if(isNaN(songId)) resolve(null);
        pool.query(
            'select "Songs"."title", "Songs"."author", "Songs"."duration", "Genres"."name" ' +
            'from public."Songs" ' +
            'inner join public."Songs-Genres" ' +
            'on "Songs"."songId"="Songs-Genres"."songId" ' +
            'inner join public."Genres" ' +
            'on "Songs-Genres"."genreId"="Genres"."genreId" ' +
            'where "Songs"."songId"=$1', [songId], (error, result) => {
                if (error) {
                    throw error;
                }
                else {
                    resolve(result.rows);
                }
        });
    });
};

const getPosterPath = async (songId) => {
    return new Promise(resolve => {
        if(isNaN(songId)) resolve(null);
        pool.query('select "posterPath" from public."Songs" where "songId"=$1', [songId], (error, result) => {
            if (error) {
                throw error;
            }
            else {
                resolve(result.rows);
            }
        });
    });
};

const getUserPlaylists = async (userId) => {
    return new Promise(resolve => {
        if(isNaN(userId)) resolve(null);
        pool.query('select "Playlists"."name", "Playlists"."playlistId" ' +
            'from public."Playlists" ' +
            'inner join public."Users" ' +
            'on "Playlists"."userId"="Users"."userId" ' +
            'where "Users"."userId"=$1', [userId], (error, result) => {
                if (error) {
                    throw error;
                }
                else {
                    resolve(result.rows);
                }
        });
    });
};

const postPlaylistToDatabase = async (playlistName, userId) => {
    return new Promise(resolve => {
        if(isNaN(userId)) resolve(null);
        pool.query('insert into public."Playlists"("name", "userId") VALUES ($1, $2)', [playlistName, userId], (error) => {
            if (error) {
                throw error;
            } else resolve(true);
        });
    });
};

const deletePlaylistFromDatabase = async (playlistId) => {
    return new Promise(resolve => {
        if(isNaN(playlistId)) resolve(null);
        pool.query('DELETE FROM public."Playlists" WHERE "Playlists"."playlistId" = $1', [playlistId], error => {
            if (error) {
                throw error;
            } else {
                pool.query('DELETE FROM public."Playlists-Songs" WHERE "Playlists-Songs"."playlistId" = $1', [playlistId], error => {
                    if (error) {
                        throw error;
                    } else resolve(true);
                });
            }
        });
    });
};

const getSongsInPlaylist = async (playlistId) => {
    return new Promise(resolve => {
        if(isNaN(playlistId)) resolve(null);

        pool.query('select "Playlists"."name", "Songs"."songId", "Songs"."title", "Songs"."author", "Songs"."duration", "Songs"."path", "Songs"."posterPath" ' +
            'from public."Playlists" ' +
            'inner join public."Playlists-Songs" ' +
            'on "Playlists"."playlistId"="Playlists-Songs"."playlistId" ' +
            'inner join public."Songs" ' +
            'on "Playlists-Songs"."songId"="Songs"."songId" ' +
            'where "Playlists"."playlistId"=$1', [playlistId], (error, result) => {
            if (error){
                throw error;
            }
            else {
                resolve(result.rows);
            }
        });
    });
};

const getAllSongsKeywords = async () => {
    return new Promise(resolve => {
        pool.query(
            'select "Songs-Keywords"."songId", "Songs-Keywords"."keywordId", "Keywords"."name" ' +
            'from public."Keywords" ' +
            'inner join "Songs-Keywords" ' +
            'on "Keywords"."keywordId"="Songs-Keywords"."keywordId"', [], (error, result) => {
                if (error) {
                    throw error;
                }
                else {
                    resolve(result.rows);
                }
            });
    });
};

const getMaxSongId = async () => {
    return new Promise(resolve => {
        pool.query('select max("Songs"."songId") from "Songs"', [], (error, result) => {
            if (error) {
                throw error;
            }
            else {
                resolve(result.rows);
            }
        });
    });
};

const postSongToPlaylist = async (songId, playlistId) => {
    return new Promise(resolve => {
        if(isNaN(playlistId) || isNaN(playlistId)) resolve(null);

        pool.query('insert into public."Playlists-Songs"("playlistId", "songId") values ($1, $2)', [playlistId, songId], error => {
            if (error) {
                error;
            } else resolve(true);
        });
    });
};

const deleteSongFromPlaylist = async (songId, playlistId) => {
    return new Promise(resolve => {
        if(isNaN(songId)) resolve(null);

        pool.query('DELETE FROM public."Playlists-Songs" WHERE "Playlists-Songs"."songId" = $1 AND "Playlists-Songs"."playlistId" = $2', [songId, playlistId], error => {
            if (error) {
                throw error;
            } else resolve(true);
        });
    });
};

module.exports = {
    getUserIdAndName,
    postUserToDatabase,
    postNewUserData,
    getAllSongsInfo,
    updateActualPlayedSong,
    deleteActualPlayedSong,
    getSongIdListenedByUser,
    getSongUrl,
    getSongInfo,
    getPosterPath,
    getUserPlaylists,
    postPlaylistToDatabase,
    deletePlaylistFromDatabase,
    getSongsInPlaylist,
    postSongToPlaylist,
    deleteSongFromPlaylist,
    getAllSongsKeywords,
    getMaxSongId
};
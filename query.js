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

module.exports = {
    getUserIdAndName,
    postUserToDatabase
};
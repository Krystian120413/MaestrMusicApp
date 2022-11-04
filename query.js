const Pool = require('pg').Pool;

//should be in .env file
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'maestr-database',
    password: 'admin',
    port: 5432,
});

const getUserId = (username, password) => {
    return new Promise(resolve => {
        pool.query('select "userId" from public."Users" where "email" = $1 and "password" = $2', [username, password], (error, result) => {
            if (error) {
                throw error;
            }
            if(result.rows[0]){
                resolve(result.rows[0].userId);
            }
            else resolve(null);
        });
    });
};

module.exports = {
    getUserId
};
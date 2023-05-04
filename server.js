const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const http = require('http');
const app = express();
const { handleDetect, handleEntries } = require('./controllers/image');
const { handleRegister } = require('./controllers/register');
const { handleSignin } = require('./controllers/signin');


app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());



const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'test',
      database : 'smart-brain'
    }
});


app.post('/signin', (req, res) => { handleSignin(req, res, db, bcrypt) })
app.post('/register', (req, res) => { handleRegister(req, res, db, bcrypt) });
app.post('/imageurl', (req, res) => handleDetect(req, res));
app.put('/image', (req, res) => { handleEntries(req, res, db) });

// app.get('/profile/:id', (req, res) => {
//     const { id } = req.params;
//     db.select('*').from('users').where({id})
//     .then(user => {
//         if (user.length){
//           res.json(user[0]);  
//         } else {
//             res.status(400).json('Not found');
//         } 
//     })
//     .catch(err => res.status(400).json('error getting user'))
// });



const port = process.env.PORT || '3000';
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
server.on('listening', () => {
    console.log(`Listening on ${port}`);
});


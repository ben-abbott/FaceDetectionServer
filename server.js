const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const app = express();

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






const database = {
    users: [
        {
            id: '1',
            name: 'Jason',
            email: 'jasonbourne@gmail.com',
            password: 'bourne',
            entries: 0,
            joined: new Date()
        },
        {
            id: '2',
            name: 'Sally',
            email: 'sally@gmail.com',
            password: 'blueberry',
            entries: 0,
            joined: new Date()
        },
        {
            id: '3',
            name: 'Barry',
            email: 'barry@gmail.com',
            password: '12345',
            entries: 0,
            joined: new Date()
        }
    ]
}



app.get('/', (req, res) => {
    res.send(database.users)
})

app.post('/signin', (req, res) => {
    if(req.body.email === database.users[1].email && req.body.password === database.users[1].password){
        res.json("success");
    }else{
        res.status(400).json('Incorrect email or password');
    }
    res.json('signin')
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    db('users').returning('*').insert({
        email: email,
        name: name,
        joined: new Date()
    })
    .then(user => {
        res.json(user[0]);
    })
    .catch(err => res.status(400).json('Unable to register'))
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    database.users.forEach( user => {
        if (user.id === id){
            found = true;
            return res.json(user);
        }
    })
    if (!found) {
        res.status(404).json('user not found')
    }
});

app.put('/image', (req, res) => {
    const { id } = req.body;
    let found = false;
    database.users.forEach( user => {
        if (user.id === id){
            found = true;
            user.entries++;
            return res.json(user.entries);
        }
    })
    if (!found) {
        res.status(404).json('user not found')
    }
});

app.listen(3000, () => {
    console.log("app running on port 3000");
});



/*
/ --> this is working
/signin --> POST res->success or fail
/register --> POST res-> added or already exist
/profile/:userid --> GET user info
/image --> PUT -> res updated user/rank/count

*/
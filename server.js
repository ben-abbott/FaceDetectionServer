const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const app = express();
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());



const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", "Key f48b618599ac496ea6f8e9ef9f494209");



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


// app.get('/', (req, res) => {
//     res.send(database.users)
// })

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => req.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users').returning('*').insert({
                email: email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('Unable to register'))
});

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
app.post('/imageurl', (req, res) => {
    const { imageUrl } = req.body;
        stub.PostModelOutputs(
        {
            // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
            model_id: "face-detection",
            inputs: [{data: {image: {url: imageUrl}}}]
        },
        metadata,
        (err, response) => {
            if (err) {
                console.log("Error: " + err);
                return;
            }
            if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
                return;
            }
    
            console.log("Response.outputs")
            console.log(response.outputs[0].data.regions[0].region_info.bounding_box)
            // for (const c of response.outputs[0].data.concepts) {
            //     console.log(c.name + ": " + c.value);
            // }
        }
    );
});



app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('Unable to get entries'))
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
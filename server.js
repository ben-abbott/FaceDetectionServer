const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const http = require('http');
const app = express();
const image = require('./controllers/image');
// const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
// const dotenv = require('dotenv');
// dotenv.config();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());



// const stub = ClarifaiStub.grpc();

// const metadata = new grpc.Metadata();
// metadata.set("authorization", "Key ${process.env.CLARIFAI_AUTH_KEY}");



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

app.post('/imageurl', (req, res) => image.handleDetect(req, res));

// app.post('/imageurl', (req, res) => {
//     const { imageUrl } = req.body;
//     // const detectFace = () => {
//     //     stub.PostModelOutputs(
//     //     {
//     //         // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
//     //         model_id: "face-detection",
//     //         inputs: [{data: {image: {url: imageUrl}}}]
//     //     },
//     //     metadata,
//     //     (err, response) => {
//     //         if (err) {
//     //             console.log("Error: " + err);
//     //             return;
//     //         }
//     //         if (response.status.code !== 10000) {
//     //             console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
//     //             return;
//     //         }
            
//     //         console.log("Response.outputs")
//     //         let result = response.outputs[0].data.regions[0].region_info.bounding_box;
//     //         resolve(result);
//     //         // for (const c of response.outputs[0].data.concepts) {
//     //         //     console.log(c.name + ": " + c.value);
//     //         // }
//     //     }
//     //     )
//     // }
// });



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

const port = process.env.PORT || '3000';
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
server.on('listening', () => {
    console.log(`Listening on ${port}`);
});


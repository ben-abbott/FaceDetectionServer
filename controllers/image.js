const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const dotenv = require('dotenv');
dotenv.config();


const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key f48b618599ac496ea6f8e9ef9f494209");

const detectFace = (inputs) => {
    // console.log("detectFace triggered")
    return new Promise((resolve, reject) => {
        stub.PostModelOutputs(
        {
            model_id: "face-detection",
            inputs: inputs
        },
        metadata,
        (err, response) => {
            if (err) {
                reject("Error: " + err);
                return;
            }
            if (response.status.code !== 10000) {
                reject("Received failed status: " + response.status.description + "\n" + response.status.details);
                return;
            }
            
            let results = response.outputs[0].data.regions;
            resolve(results);
        }
        );
    })    
}

const handleDetect = async (req, res) => {
    // console.log("handleDetect triggered");
    try{
        const { imageUrl } = req.body;
        const inputs = [
            {
                data: {
                    image: {
                        url: imageUrl
                    }
                }
            }
        ];
        const results = await detectFace(inputs);
        return res.send({
            results
        })
    }
    catch (error) {
        return res.status(400).send({
            error: error
        })
    }
}

const handleEntries = (req, res, db) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('Unable to get entries'))
}

module.exports = {
    handleDetect,
    handleEntries
}
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('this is working')
})


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
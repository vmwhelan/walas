import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import routes from './src/routes/walas';

var app = express();
const PORT = 3000;

// Set up default mongoose connection
var walasDB = 'mongodb://xubuntu.home/walasdb';
mongoose.connect(walasDB);
// Get mongoose to use the global promise library
mongoose.Promise = global.Promise;
// Get the defualt connection
var db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


// bodyParser setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', routes);
/*
app.get('/', (req, res) =>
    res.redirect('/walas')
);
*/

app.listen(PORT,() =>
    console.log(`Your server is running on port ${PORT}`)
);

module.exports = app;

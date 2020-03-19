const express = require('express');
const graphqlHTTP = require('express-graphql');
const mongoose = require('mongoose');
const cors = require('cors');

const isAuth = require('./middleware/isAuth');

const schema = require('./schema');

mongoose.connect('mongodb+srv://mongo:Hamurabi77@cluster0-9cxrc.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.once('open', () => console.log('Connected to the MongoDB database!'));

const app = express();

app.use(cors());

app.use(isAuth);

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));

app.listen(4000, () => console.log('Express server listening on port 4000!'));
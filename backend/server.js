// start server

require('dotenv').config()

const app = require('./src/app');
const connectDB = require('./src/db/db');

const http = require('http');
const server = http.createServer(app);
const socket = require('./src/socket');

// Initialize socket.io using the http server
socket.init(server);

connectDB()

server.listen(3000, () => {
    console.log('Server is running on port 3000 ..... ');
})
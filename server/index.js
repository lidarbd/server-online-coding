const express = require ("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const server = http.createServer(app);
const path = require('path');
const PORT = process.env.PORT || 3001;

app.use(cors());


const io = new Server (server);

const connectedUsers = new Map(); //creating a map to track all users connected to a certain room (code block)
const roomsById = new Map(); //creating a map to track all users connected to a certain room (code block) according to socket id

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("choose_codeBlock", (codeBlockName) => {
        socket.join(codeBlockName);
        console.log(`User with ID: ${socket.id} chose code block: ${codeBlockName}`);

        roomsById.set(socket.id, codeBlockName);

        if (connectedUsers.has(codeBlockName)) 
        {
            connectedUsers.set(codeBlockName, connectedUsers.get(codeBlockName) + 1);
            socket.emit("mentor_present", false);
            console.log(`User with ID: ${socket.id} is student in the code block: ${codeBlockName}`);
        } 
        else 
        {
            connectedUsers.set(codeBlockName, 1);
            socket.emit("mentor_present", true);
            console.log(`User with ID: ${socket.id} is mentor in the code block: ${codeBlockName}`);
        }
        });

    socket.on("student_code_change", (data) => {
        socket.to(data.codeBlockName).emit("mentor_code_change", data.userCode);
      });


    socket.on("disconnect", () => {
        console.log(`User with ID: ${socket.id} disconnected`);

        const codeBlockName = roomsById.get(socket.id);

        if (connectedUsers.has(codeBlockName)) 
        {
          const count = connectedUsers.get(codeBlockName) - 1;
          if(count === 0)
          {
            connectedUsers.delete(codeBlockName);
          }
          else
          {
            connectedUsers.set(codeBlockName, count);
          }
          console.log(`User with ID: ${socket.id} disconnected from code block: ${codeBlockName}`);
          console.log(`Number of users connected to code block ${codeBlockName}: ${connectedUsers.get(codeBlockName)}`);
       }
    });
});

app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});
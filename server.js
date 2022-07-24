const express = require('express');
const app =  express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid'); // to generate unique rooms
const io = require('socket.io')(server);
const { ExpressPeerServer } = require("peer");
const bodyParser = require('body-parser');
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

let port = process.env.PORT || 3030;

app.use("/peerjs", peerServer); 
app.use(bodyParser.urlencoded({ extended: true })); 

app.set('view engine','ejs');
app.use(express.static("public"));

let today = new Date();
let options = {
    weekday: "long",
    day:"numeric",
    month:"long",
    year: "numeric",
};

let day = today.toLocaleDateString("en-IN",options);
let user;

app.get("/", (req, res) => {
    res.render('home',{day: day}); 
});

app.post("/newMeeting", (req, res) => {
    user = req.body.user;
    res.redirect(`/${uuidv4()}`); 
});
  
app.post("/joinMeeting",(req,res)=>{
    let roomURL = req.body.roomURL;
    user = req.body.user;
    res.redirect('/'+roomURL);
})

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room, user: user });
});

io.on('connection', socket => {
    socket.on('join-room',(roomId, userId, userName)=>{
        socket.join(roomId);
        
        socket.broadcast.to(roomId).emit('user-connected', userId, userName);

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
          });

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId, userName);
        })

    })
})

server.listen(port);
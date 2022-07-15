const socket = io('/');

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted=true;
const user = prompt("Enter your name: ");

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030"
});

const peers = {};

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
})
.then((stream) => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  // recieving call whenever a new user joins room
  peer.on("call", (call) => {
    call.answer(stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
    
    call.on("close", () => {
      video.remove();
    }) 

    peers[call.peer]=call; // to save already present peers
  });

  socket.on("user-connected", (userId, userName) => {
    setTimeout(() => {
      connectToNewUser(userId, stream)
      messages.innerHTML =
          messages.innerHTML + (`<div class="message"><small style="color:red"> ${userName} Joined Meeting</small></div>`); 
    }, 1000)
  })

});


peer.on('open', id => {
  socket.emit('join-room', room_Id, id, user);
})


// calling the new user
function connectToNewUser(userId, stream){
  console.log('connectToNewUser');
  console.log(userId);
  var call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  });
  
  call.on("close", () => {
    video.remove();
  }) 

  peers[userId] = call // to save new peers 
}

// adding video stream
function addVideoStream(video, stream){
  video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
      videoGrid.append(video);
    });
}


// mute - unmute audio
const toggleAudio = document.querySelector("#toggleAudio");
function muteUnmuteAudio(){
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    toggleAudio.classList.add("background-red")
    toggleAudio.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    toggleAudio.classList.remove("background-red")
    toggleAudio.innerHTML = html;
  }
}


// play-pause video
const toggleVideo = document.querySelector("#toggleVideo");
function playPauseVideo(){
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    toggleVideo.classList.add("background-red");
    toggleVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    toggleVideo.classList.remove("background-red");
    toggleVideo.innerHTML = html;
  }
}

// send message using icon
let text = document.querySelector("#chat-message");
function sendMessage(){
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
}

// send message by pressing enter
text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});


//  chat screen - fullscreen view
function viewChatInFullScreen(){
  document.querySelector(".main-right").style.display = "flex";
  document.querySelector(".main-right").style.flex = "1";
  document.querySelector(".main-left").style.display = "none";
  document.querySelector(".header-back").style.display = "block";

}

// exiting from chat full screen view
function exitChatFullScreen(){
  document.querySelector(".main-left").style.display = "flex";
  document.querySelector(".main-right").style.flex = "0.3";
  document.querySelector(".main-left").style.flex = "0.7";
  document.querySelector(".header-back").style.display = "none";
}


//Displaying chat messages
let messages = document.querySelector(".messages");
socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
      <div class = "profile" >
        <b><i class="far fa-user"></i> <span> ${
          userName === user ? "You" : userName
        }</span> </b>
        <div class = "time">
            <time> ${ new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit" }) }</time>
          </div>
        </div>
        <span><b>${message}</b></span>
    </div>`;
});


// screen share feature
const shareScreen =document.querySelector("#shareScreen");
shareScreen.addEventListener("click", async ()=>{
const video = document.createElement("video");
let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia();
    let Sender = peer.getSenders().map(function (sender) {
      Sender.replaceTrack(captureStream.getTracks().find(function (track) {
          return track.kind === sender.track.kind;
      }));
  });
    Sender.replaceTrack(captureStream)
    addVideoStream(video, captureStream);
    video.srcObject = captureStream;
    video.onloadedmetadata = function(e) {
      video.play();
      videoGrid.append(video);
    };

  } catch(err) {
    console.error("Error: " + err);
  }
    return captureStream;
})



//remove user
const hangup = document.querySelector("#hangup");
hangup.addEventListener("click",(e)=>{
  socket.emit("disconnect");
})

socket.on('user-disconnected', (userId,userName) => {
  setTimeout(() => {
    if (peers[userId]) 
      peers[userId].close();
      messages.innerHTML =
          messages.innerHTML + (`<div class="message"><small style="color:red"> ${userName} Left Meeting</small></div>`); 
  }, 1000)
})
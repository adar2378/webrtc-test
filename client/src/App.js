import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://localhost:3001";

function App() {
  const socket;
  const myPeerConnection;
  useEffect(() => {
    socket = socketIOClient(ENDPOINT);
    socket.on("message", (data) => {
      handleMessages(data);
    });
  }, []);

  const createPeerConnection = () => {
    myPeerConnection = new RTCPeerConnection({
      iceServers: [
        // Information about ICE servers - Use your own!
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    });

    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  };

  const handleMessages = (message) => {
    switch (message.type) {
      case "video-offer":
        handleVideoOfferMsg(message.sdp);
        break;
      case "video-answer":
        handleVideoAnswerMsg(message.sdp);
        break;
      case "new-ice-candidate":
        handleNewICECandidateMsg(message.candidate);
      default:
        break;
    }
  };

  const handleNegotiationNeededEvent = () => {
    myPeerConnection
      .createOffer()
      .then(function (offer) {
        return myPeerConnection.setLocalDescription(offer);
      })
      .then(function () {
        sendToServer({
          type: "video-offer",
          sdp: myPeerConnection.localDescription,
        });
      })
      .catch(reportError);
  };

  const handleVideoOfferMsg = (sdp) => {
    createPeerConnection();

    var desc = new RTCSessionDescription(sdp);

    myPeerConnection
      .setRemoteDescription(desc)
      .then(function () {
        return myPeerConnection.createAnswer();
      })
      .then(function (answer) {
        return myPeerConnection.setLocalDescription(answer);
      })
      .then(function () {
        var msg = {
          type: "video-answer",
          sdp: myPeerConnection.localDescription,
        };

        sendToServer(msg);
      })
      .catch(handleGetUserMediaError);
  };

  const handleRemoveTrackEvent = (event) => {
    console.log("Removed event", event);
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      sendToServer({
        type: "new-ice-candidate",
        candidate: event.candidate,
      });
    }
  };

  const handleVideoAnswerMsg = async (sdp) => {
    log("*** Call recipient has accepted our call");

    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.

    var desc = new RTCSessionDescription(sdp);
    await myPeerConnection.setRemoteDescription(desc).catch(reportError);
  };

  const handleNewICECandidateMsg = (icecandidate) => {
    var candidate = new RTCIceCandidate(icecandidate);

    myPeerConnection.addIceCandidate(candidate).catch(reportError);
  };

  const handleICEConnectionStateChangeEvent = (event) => {
    console.log("connection state", myPeerConnection.signalingState);
  };

  const handleICEGatheringStateChangeEvent = (event) => {
    console.log("connection state for others", event);
  };

  const handleTrackEvent = (event) => {
    console.log("Got event");
    // document.getElementById("received_video").srcObject = event.streams[0];
    // document.getElementById("hangup-button").disabled = false;
  };

  const handleSignalingStateChangeEvent = (event) => {
    log(
      "*** WebRTC signaling state changed to: " +
        myPeerConnection.signalingState
    );
  };

  const sendToServer = (message) => {
    socket.emit("client-dispatch", message);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

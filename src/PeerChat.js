import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import axios from "axios";

const API_BASE = "http://localhost:8000"; // backend API

export default function PeerChat() {
  const [peerId, setPeerId] = useState("");
  const [name, setName] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const peerRef = useRef(null);
  const connRef = useRef(null);

  // Initialize peer connection
  useEffect(() => {
    const peer = new Peer(undefined, {
      host: "localhost",
      port: 9001,
      path: "/myapp",
      secure: false,
    });

    peerRef.current = peer;

    peer.on("open", (id) => {
      console.log("My peer ID:", id);
      setPeerId(id);
    });

    peer.on("connection", (conn) => {
      console.log("Incoming connection from", conn.peer);
      connRef.current = conn;
      loadChatHistory(conn.peer);

      conn.on("data", (data) => {
        saveMessage(peerId, conn.peer, data);
        setMessages((prev) => [...prev, { from: "them", text: data }]);
      });
    });
  }, []);

  // Register user
  const registerUser = async () => {
    if (!name || !peerId) return alert("Enter name first");
    await axios.post(`${API_BASE}/api/register`, { name, peerId });
    alert("User registered!");
  };

  // Connect to peer
  const connectPeer = async () => {
    const conn = peerRef.current.connect(remoteId);
    connRef.current = conn;
    loadChatHistory(remoteId);

    conn.on("open", () => {
      console.log("Connected to", remoteId);
    });

    conn.on("data", (data) => {
      saveMessage(peerId, remoteId, data);
      setMessages((prev) => [...prev, { from: "them", text: data }]);
    });
  };

  // Send message
  const sendMessage = async () => {
    if (connRef.current && input) {
      connRef.current.send(input);
      saveMessage(peerId, remoteId, input);
      setMessages((prev) => [...prev, { from: "me", text: input }]);
      setInput("");
    }
  };

  // Save chat message to backend
  const saveMessage = async (senderId, receiverId, message) => {
    try {
      await axios.post(`${API_BASE}/api/message`, {
        senderId,
        receiverId,
        message,
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  };

  // Load chat history
  const loadChatHistory = async (remotePeer) => {
    if (!peerId || !remotePeer) return;
    const res = await axios.get(
      `${API_BASE}/api/messages/${peerId}/${remotePeer}`
    );
    setMessages(
      res.data.map((m) => ({
        from: m.senderId === peerId ? "me" : "them",
        text: m.message,
        time: new Date(m.timestamp).toLocaleTimeString(),
      }))
    );
  };

  return (
    <div style={{ padding: 30, maxWidth: 500, margin: "auto" }}>
      <h2>🗣️ PeerJS Chat</h2>

      <p>
        Your Peer ID: <b>{peerId}</b>
      </p>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />
      <button onClick={registerUser} style={{ width: "100%", padding: 8 }}>
        Register User
      </button>

      <input
        placeholder="Remote Peer ID"
        value={remoteId}
        onChange={(e) => setRemoteId(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 10 }}
      />
      <button onClick={connectPeer} style={{ width: "100%", padding: 8 }}>
        Connect
      </button>

      <div
        style={{
          border: "1px solid #ccc",
          marginTop: 20,
          padding: 10,
          height: 250,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <p
            key={i}
            style={{
              textAlign: m.from === "me" ? "right" : "left",
              color: m.from === "me" ? "blue" : "black",
            }}
          >
            <b>{m.from}:</b> {m.text} <small>{m.time}</small>
          </p>
        ))}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

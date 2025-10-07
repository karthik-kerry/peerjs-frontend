import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

export default function PeerChat() {
  const [peerId, setPeerId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const peerRef = useRef(null);
  const connRef = useRef(null);

  useEffect(() => {
    // Connect to your own PeerJS server
    const peer = new Peer(undefined, {
      host: "localhost",
      port: 9000,
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

      conn.on("data", (data) => {
        setMessages((prev) => [...prev, { from: "them", text: data }]);
      });
    });
  }, []);

  const connectPeer = () => {
    const conn = peerRef.current.connect(remoteId);
    connRef.current = conn;

    conn.on("open", () => {
      console.log("Connected to", remoteId);
    });

    conn.on("data", (data) => {
      setMessages((prev) => [...prev, { from: "them", text: data }]);
    });
  };

  const sendMessage = () => {
    if (connRef.current && input) {
      connRef.current.send(input);
      setMessages((prev) => [...prev, { from: "me", text: input }]);
      setInput("");
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 500, margin: "auto" }}>
      <h2>🗣️ PeerJS Chat</h2>
      <p>
        Your Peer ID: <b>{peerId}</b>
      </p>

      <input
        placeholder="Remote Peer ID"
        value={remoteId}
        onChange={(e) => setRemoteId(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 10 }}
      />
      <button onClick={connectPeer} style={{ width: "100%", padding: 8 }}>
        Connect
      </button>

      <div
        style={{
          border: "1px solid #ccc",
          marginTop: 20,
          padding: 10,
          height: 200,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <p key={i} style={{ textAlign: m.from === "me" ? "right" : "left" }}>
            <b>{m.from}:</b> {m.text}
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

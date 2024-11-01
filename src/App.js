// App.js
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  // Upload the file to the Flask API
  const handleTranscribe = async () => {
    if (!audioFile) return;
    setLoading(true);
    setTranscript("");

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await axios.post("http://127.0.0.1:5000/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranscript(response.data.transcription);
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscript("Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Audio Transcriber</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleTranscribe} disabled={!audioFile || loading}>
        {loading ? "Transcribing..." : "Transcribe Audio"}
      </button>
      <div style={{ marginTop: "20px" }}>
        <h3>Transcription:</h3>
        <p>{transcript || "Upload an audio file to get started!"}</p>
      </div>
    </div>
  );
}

export default App;

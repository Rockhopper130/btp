import React, { useState, useRef } from "react";
import axios from "axios";
import AudioTranscriber from "./components/AudioTranscriber";
import AudioWaveform from "./components/AudioWaveform"; // Import the AudioWaveform component
import "./App.css"; // Include the CSS file

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setLoading(true);
    setTranscript(null);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/process",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setTranscript(response.data);
      console.log(transcript);
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscript("Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  const waveformControl = useRef(null);

  const handleSentenceClick = (start, end) => {
    if (waveformControl.current) {
      waveformControl.current(start, end);
    }
  };

  return (
    <div className="app-container">
      <AudioWaveform
        audioFile={audioFile}
        onSentenceClick={(handler) => {
          waveformControl.current = handler;
        }}
      />{" "}
      <AudioTranscriber
        audioFile={audioFile}
        transcript={transcript}
        loading={loading}
        handleFileChange={handleFileChange}
        handleTranscribe={handleTranscribe}
        handleSentenceClick={handleSentenceClick}
      />
    </div>
  );
}

export default App;

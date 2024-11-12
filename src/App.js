import React, { useState } from "react";
import axios from "axios";
import AudioTranscriber from "./components/AudioTranscriber";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setLoading(true);
    setTranscript("");

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await axios.post("http://127.0.0.1:5000/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response);
      setTranscript(response.data)
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscript("Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <AudioTranscriber
        audioFile={audioFile}
        transcript={transcript}
        loading={loading}
        handleFileChange={handleFileChange}
        handleTranscribe={handleTranscribe}
      />
    </div>
  );
}

export default App;

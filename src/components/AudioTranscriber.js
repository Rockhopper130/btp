// components/AudioTranscriber.js
import React from 'react';

const AudioTranscriber = ({ audioFile, transcript, loading, handleFileChange, handleTranscribe }) => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Audio Transcriber</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleTranscribe} disabled={!audioFile || loading}>
        {loading ? "Transcribing..." : "Transcribe Audio"}
      </button>
      <div style={{ marginTop: "20px" }}>
        <h3>Transcription:</h3>
        {Array.isArray(transcript) && transcript.length > 0 ? (
          transcript.map((dialogue, index) => (
            <div key={index} style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <strong>{dialogue.id + ") " + dialogue.speaker}:</strong> {"[" + dialogue.start + "sec] " + dialogue.text + " [" + dialogue.end + "sec]"}
            </div>
          ))
        ) : (
          <p>{typeof transcript === "string" ? transcript : "Upload an audio file to get started!"}</p>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;

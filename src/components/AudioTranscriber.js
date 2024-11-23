import React from "react";

const AudioTranscriber = ({
  audioFile,
  transcript,
  loading,
  handleFileChange,
  handleTranscribe,
  handleSentenceClick,
}) => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Audio Transcriber</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleTranscribe} disabled={!audioFile || loading}>
        {loading ? "Transcribing..." : "Transcribe Audio"}
      </button>
      <div style={{ marginTop: "20px" }}>
        <h3>Transcription:</h3>
        {Array.isArray(transcript) ? (
          transcript.map((segment, index) => (
            <div
              key={index}
              style={{
                marginBottom: "1.5rem",
                textAlign: "left",
                padding: "10px",
                border: "1px solid #ddd",
              }}
            >
              <h4>Summary: {segment.summary_sentence}</h4>
              {segment.sentence_data.map((sentence) => (
                <div
                  key={sentence.id}
                  style={{ marginBottom: "0.5rem", cursor: "pointer"}}
                  onClick={() =>
                    handleSentenceClick(sentence.start, sentence.end)
                  }
                >
                  <strong>{sentence.speaker}:</strong>{" "}
                  {"[" + sentence.start + "s - " + sentence.end + "s] "}
                  {sentence.text}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>
            {typeof transcript === "string"
              ? transcript
              : "Upload an audio file to get started!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;

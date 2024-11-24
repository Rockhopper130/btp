import React, { useState } from "react";
import "./AudioTranscriber.css";

const AudioTranscriber = ({
  audioFile,
  transcript,
  loading,
  handleFileChange,
  handleTranscribe,
  handleSentenceClick,
}) => {
  const [expandedSegments, setExpandedSegments] = useState({});

  const toggleExpandSegment = (index) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="transcriber-container">
      <div className="transcriber-controls">
        {/* <h2 className="transcriber-header">Add File</h2> */}
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="file-input"
        />
        <button
          onClick={handleTranscribe}
          disabled={!audioFile || loading}
          className={`transcribe-button ${loading ? "disabled" : ""}`}
        >
          {loading ? "Transcribing..." : "Transcribe Audio"}
        </button>
      </div>
      <div className="transcription-output">
        <h3 className="transcription-header">Summary:</h3>
        {Array.isArray(transcript) ? (
          transcript.map((segment, index) => (
            <div key={index} className="transcription-segment">
              <div
                className="segment-summary"
                onClick={() => toggleExpandSegment(index)}
              >
                <p>
                  {segment.summary_sentence}
                </p>
              </div>
              {expandedSegments[index] && (
                <div className="sentence-list">
                  {segment.sentence_data.map((sentence) => (
                    <div
                      key={sentence.id}
                      className="sentence"
                      onClick={() =>
                        handleSentenceClick(sentence.start, sentence.end)
                      }
                    >
                      <strong className="speaker">{sentence.speaker}:</strong>{" "}
                      <span className="time-range">
                        {"[" + sentence.start + "s - " + sentence.end + "s] "}
                      </span>
                      {sentence.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="transcription-placeholder">
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

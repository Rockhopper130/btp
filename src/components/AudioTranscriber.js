import React, { useState, useCallback } from "react";
import "./AudioTranscriber.css";

// SVG Icons
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const AnalyzeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const ChevronIcon = ({ expanded }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const AudioTranscriber = ({
  audioFile,
  transcript,
  loading,
  handleFileChange,
  handleTranscribe,
  handleSentenceClick,
  showUploadOnly = false,
  showResultsOnly = false,
}) => {
  const [expandedSegments, setExpandedSegments] = useState({});
  const [activeSentenceId, setActiveSentenceId] = useState(null);

  const toggleExpandSegment = useCallback((index) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const onSentenceClick = useCallback((sentence) => {
    if (handleSentenceClick && sentence?.start != null && sentence?.end != null) {
      const start = Math.max(0, sentence.start - 0.5);
      setActiveSentenceId(sentence.id);
      handleSentenceClick(start, sentence.end);
    }
  }, [handleSentenceClick]);

  const isValidSentence = (sentence) => {
    return sentence && 
           sentence.id != null && 
           sentence.start != null && 
           sentence.end != null;
  };

  // Upload Section Only
  if (showUploadOnly) {
    return (
      <div className="upload-panel">
        <div className="panel-header">
          <h3 className="panel-title">Upload & Analyze</h3>
        </div>
        
        <div className="panel-content">
          <label className="file-upload-area">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            <div className="upload-icon">
              <UploadIcon />
            </div>
            <span className="upload-text">
              {audioFile ? "Change file" : "Select audio file"}
            </span>
            <span className="upload-hint">MP3, WAV, OGG, M4A</span>
          </label>

          {audioFile && (
            <div className="selected-file">
              <span className="selected-label">Selected:</span>
              <span className="selected-name">{audioFile.name}</span>
            </div>
          )}

          <button
            onClick={handleTranscribe}
            disabled={!audioFile || loading}
            className={`analyze-btn ${!audioFile || loading ? "disabled" : ""}`}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <AnalyzeIcon />
                Analyze Audio
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Results Section Only
  if (showResultsOnly) {
    return (
      <div className="results-panel">
        <div className="panel-header">
          <h3 className="panel-title">Analysis Results</h3>
          {Array.isArray(transcript) && transcript.length > 0 && (
            <span className="results-badge">
              {transcript.length} segment{transcript.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="panel-content">
          {Array.isArray(transcript) && transcript.length > 0 ? (
            <div className="segments-list">
              {transcript.map((segment, index) => (
                <div 
                  key={index} 
                  className={`segment-item ${expandedSegments[index] ? "expanded" : ""}`}
                >
                  <div
                    className="segment-header"
                    onClick={() => toggleExpandSegment(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpandSegment(index);
                      }
                    }}
                  >
                    <span className="segment-number">{index + 1}</span>
                    <p className="segment-text">
                      {segment.summary_sentence || "No summary available"}
                    </p>
                    <span className="expand-btn">
                      <ChevronIcon expanded={expandedSegments[index]} />
                    </span>
                  </div>

                  {expandedSegments[index] && segment.sentence_data && (
                    <div className="sources-section">
                      <div className="sources-header">Source Segments</div>
                      <div className="sources-list">
                        {segment.sentence_data
                          .filter(isValidSentence)
                          .map((sentence) => (
                            <div
                              key={sentence.id}
                              className={`source-item ${activeSentenceId === sentence.id ? "active" : ""}`}
                              onClick={() => onSentenceClick(sentence)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onSentenceClick(sentence);
                                }
                              }}
                            >
                              <div className="source-header">
                                <span className={`speaker-tag ${sentence.speaker?.includes("01") ? "speaker-1" : "speaker-2"}`}>
                                  {sentence.speaker || "Unknown"}
                                </span>
                                <span className="time-tag">
                                  {sentence.start.toFixed(1)}s - {sentence.end.toFixed(1)}s
                                </span>
                                <span className="play-tag">
                                  <PlayIcon />
                                  Play
                                </span>
                              </div>
                              <p className="source-text">{sentence.text || ""}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-title">
                {loading
                  ? "Processing audio..."
                  : typeof transcript === "string"
                  ? transcript
                  : "No results yet"}
              </p>
              <p className="empty-hint">
                {loading
                  ? "This may take a moment"
                  : "Upload an audio file and click 'Analyze Audio' to begin"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Both sections (fallback)
  return null;
};

export default AudioTranscriber;

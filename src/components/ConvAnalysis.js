import React, { useState } from "react";
import "./ConvAnalysis.css";

const ConvAnalysis = ({
  // transcript, // Prop seems unused in this specific quality display part
  loading,
  // handleFileChange, // Prop seems unused here
  // handleTranscribe, // Prop seems unused here (unless handleQualityCheck should call it)
  // handleSentenceClick, // Prop seems unused here
}) => {
  // Note: expandedSegments state seems unused in the current rendering logic for quality display.
  // const [expandedSegments, setExpandedSegments] = useState({});

  const audioFile = true;
  const [convQuality, setConvQuality] = useState(""); // e.g., "Bad", "Moderate", "Good"
  const [convScore, setConvScore] = useState(0); // e.g., 0-10
  const [scoreVisible, setScoreVisible] = useState(false);

  // Function to map score to quality category
  const getQualityCategory = (score) => {
    if (score >= 7.5) return "Good";
    if (score >= 6) return "Moderate";
    return "Bad";
  };

  // Function to map quality category to CSS class
  const getQualityClass = (quality) => {
    if (quality === "Bad") return "score-bad";
    if (quality === "Moderate") return "score-moderate";
    if (quality === "Good") return "score-good";
    return "";
  };

  const handleQualityCheck = () => {
    // Optional: trigger loading state
    setScoreVisible(false); // Hide old score during delay if needed

    setTimeout(() => {
      const gaussianRandom = (mean, variance) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * Math.sqrt(variance) + mean;
      };

      let randomScore = gaussianRandom(7.5, 1.5);
      randomScore = Math.min(Math.max(randomScore, 0), 10);
      // const finalScore = Math.round(randomScore * 100) / 100;
      const finalScore = 7.88;
      const qualityCategory = getQualityCategory(finalScore);

      setConvScore(finalScore);
      setConvQuality(qualityCategory);
      setScoreVisible(true); // Show score after delay
    }, 1000); // Delay in milliseconds (1000 ms = 1 second)
  };

  // Calculate score percentage for the bar width
  const scorePercentage = (convScore / 10) * 100;
  const qualityClass = getQualityClass(convQuality);

  return (
    <div className="conv-container">
      <div className="conv-controls">
        {/* Button to trigger the quality check */}
        <button
          onClick={handleQualityCheck}
          disabled={!audioFile || loading} // Disable if no file or already loading
          className={`conv-button ${!audioFile || loading ? "disabled" : ""}`}
        >
          {loading ? "Calculating Quality..." : "Find Conversation Quality"}
        </button>
      </div>

      {/* Output section - displays only when score is calculated */}
      {scoreVisible && (
        <div className="conv-output">
          <h3 className="conv-label">Conversation Quality Analysis</h3>
          <div className="score-display">
            {/* Categorical Quality Display */}
            <div className={`quality-badge ${qualityClass}`}>{convQuality}</div>

            {/* Numerical Score and Progress Bar */}
            <div className="score-bar-container">
              <div
                className={`score-bar-fill ${qualityClass}`}
                // Use percentage for width, ensure score doesn't exceed 10
                style={{ width: `${Math.min(scorePercentage, 100)}%` }}
              ></div>
            </div>
            <div className={`score-value ${qualityClass}`}>
              Score: {convScore}/10
            </div>
          </div>
        </div>
      )}

      {/* Placeholder if score is not yet visible */}
      {!scoreVisible && !loading && audioFile && (
        <p className="conv-placeholder">
          Click the button above to analyze conversation quality.
        </p>
      )}
      {!scoreVisible && !loading && !audioFile && (
        <p className="conv-placeholder">Upload an audio file first.</p>
      )}

      {/* --- Potential Transcript Display Area (using commented out props/state) --- */}
      {/* {transcript && transcript.segments && (
        <div className="transcript-display">
           Render transcript segments here using transcript prop and expandedSegments state
        </div>
      )} */}
      {/* --- End Transcript Display Area --- */}
    </div>
  );
};

export default ConvAnalysis;

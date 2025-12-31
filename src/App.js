import React, { useState, useRef, useCallback } from "react";
import AudioTranscriber from "./components/AudioTranscriber";
import AudioWaveform from "./components/AudioWaveform";
import "./App.css";

// SVG Icons
const WaveformIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M6 6v12M18 6v12M3 10v4M21 10v4M9 4v16M15 4v16"/>
  </svg>
);

// Hardcoded mock response (from backend)
const MOCK_RESPONSE = [
  {
    "sentence_data": [
      {"speaker": "SPEAKER_01", "text": " at the pulpit in the world of biology. So that was a nice shock.", "start": 0.64, "end": 5.76, "id": 1},
      {"speaker": "SPEAKER_01", "text": " Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years.", "start": 12.1, "end": 36.18, "id": 3},
      {"speaker": "SPEAKER_00", "text": " So did you go straight from a bachelor's to a PhD?", "start": 8.14, "end": 11.4, "id": 2}
    ],
    "summary_sentence": "The conversation revolves around the speaker's experience in pursuing a PhD in medical sciences"
  },
  {
    "sentence_data": [
      {"speaker": "SPEAKER_01", "text": " Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years.", "start": 12.1, "end": 36.18, "id": 3},
      {"speaker": "SPEAKER_00", "text": " So did you go straight from a bachelor's to a PhD?", "start": 8.14, "end": 11.4, "id": 2},
      {"speaker": "SPEAKER_01", "text": " at the pulpit in the world of biology. So that was a nice shock.", "start": 0.64, "end": 5.76, "id": 1}
    ],
    "summary_sentence": "The speaker recounts how they were initially drawn to a pulpit in the world of biology, which was a \"nice shock\" for them"
  },
  {
    "sentence_data": [
      {"speaker": "SPEAKER_01", "text": " Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years.", "start": 12.1, "end": 36.18, "id": 3},
      {"speaker": "SPEAKER_00", "text": " So did you go straight from a bachelor's to a PhD?", "start": 8.14, "end": 11.4, "id": 2},
      {"speaker": "SPEAKER_01", "text": " at the pulpit in the world of biology. So that was a nice shock.", "start": 0.64, "end": 5.76, "id": 1}
    ],
    "summary_sentence": "They then discuss their academic background, mentioning that they graduated from a bachelor's program and went on to pursue a PhD, which they completed in five years with an accelerated program"
  },
  {
    "sentence_data": [
      {"speaker": "SPEAKER_01", "text": " No, you know, after four years of engineering school, I, you know,  I was very humbled. So I was not terribly intimidated. I just,  I just knew that I could probably, you know, just suffer through it,  like I suffered through engineering school.  It's not a little bit of a messochistic, so I'm too poor to say.", "start": 47.76, "end": 75.7, "id": 5},
      {"speaker": "SPEAKER_00", "text": " Was it, I guess, for lack of better, we're like intimidating, like going straight  into like a PhD program, or were you like kind of used the idea right then?", "start": 37.86, "end": 46.48, "id": 4},
      {"speaker": "SPEAKER_01", "text": " Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years.", "start": 12.1, "end": 36.18, "id": 3}
    ],
    "summary_sentence": "The speaker expresses their initial feeling of intimidation, but ultimately felt humbled and able to \"suffer through\" the program"
  },
  {
    "sentence_data": [
      {"speaker": "SPEAKER_01", "text": " institution that I went for my undergraduate, didn't have a graduate  program and the institute that I went to offered a stipend.  So they made the decision very easy because I got  accepted in a couple different colleges. One of them was a Cornell, so I felt  very happy because it was kind of a, you know, I felt honored to be accepted there,  but they wanted 60,000 a year for tuition. And they included 50% stipend  and scholarship and still.", "start": 84.08, "end": 119.98, "id": 7},
      {"speaker": "SPEAKER_00", "text": " Where did you go to school at? Did you go to the same school for your  PhD program as a bachelor or did you switch up schools? I had to switch the", "start": 77.12, "end": 84.08, "id": 6},
      {"speaker": "SPEAKER_01", "text": " No, you know, after four years of engineering school, I, you know,  I was very humbled. So I was not terribly intimidated. I just,  I just knew that I could probably, you know, just suffer through it,  like I suffered through engineering school.  It's not a little bit of a messochistic, so I'm too poor to say.", "start": 47.76, "end": 75.7, "id": 5}
    ],
    "summary_sentence": "They share that they had to switch institutions to secure a graduate program, with Cornell being a preferred choice that offered a stipend and scholarship"
  }
];

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState("");
  const waveformControlRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setTranscript(null);
    }
  }, []);

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setLoading(true);
    setLoadingStatus("Processing audio...");

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Use hardcoded mock response instead of API call
    setTranscript(MOCK_RESPONSE);
    console.log("Mock Response:", MOCK_RESPONSE);

    setLoading(false);
    setLoadingStatus("");
  };

  const handleSentenceClick = useCallback((start, end) => {
    if (waveformControlRef.current) {
      waveformControlRef.current(start, end);
    }
  }, []);

  const handleWaveformReady = useCallback((handler) => {
    waveformControlRef.current = handler;
  }, []);

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">{loadingStatus || "Processing..."}</p>
            <p className="loading-subtext">This may take a moment</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <WaveformIcon />
            </div>
            <span className="logo-text">Audio Abstractor</span>
          </div>
          <div className="header-badge">Prototype</div>
        </div>
      </header>

      <main className="main-content">
        <div className="top-section">
          <AudioWaveform
            audioFile={audioFile}
            onSentenceClick={handleWaveformReady}
          />

          <AudioTranscriber
            audioFile={audioFile}
            transcript={transcript}
            loading={loading}
            handleFileChange={handleFileChange}
            handleTranscribe={handleTranscribe}
            handleSentenceClick={handleSentenceClick}
            showUploadOnly={true}
          />
        </div>

        <AudioTranscriber
          audioFile={audioFile}
          transcript={transcript}
          loading={loading}
          handleFileChange={handleFileChange}
          handleTranscribe={handleTranscribe}
          handleSentenceClick={handleSentenceClick}
          showResultsOnly={true}
        />
      </main>

      <footer className="app-footer">
        SPIN Lab @ IIT Guwahati
      </footer>
    </div>
  );
}

export default App;

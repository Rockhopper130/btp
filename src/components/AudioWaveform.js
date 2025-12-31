import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import "./AudioWaveform.css";

// SVG Icons
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const SkipBackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>
);

const VolumeIcon = ({ muted, level }) => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {muted || level === 0 ? (
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    ) : level < 0.5 ? (
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    ) : (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    )}
  </svg>
);

const AudioWaveform = ({ audioFile, onSentenceClick }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const objectURLRef = useRef(null);
  const timeCheckRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const clearActiveRegion = useCallback(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer) return;

    if (timeCheckRef.current) {
      wavesurfer.un("timeupdate", timeCheckRef.current);
      timeCheckRef.current = null;
    }

    const regionsPlugin = wavesurfer.plugins[0];
    if (regionsPlugin) {
      regionsPlugin.clearRegions();
    }
  }, []);

  useEffect(() => {
    clearActiveRegion();
    
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    if (objectURLRef.current) {
      URL.revokeObjectURL(objectURLRef.current);
      objectURLRef.current = null;
    }

    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);

    if (!audioFile || !waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#adb5bd",
      progressColor: "#0d6efd",
      height: 64,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      cursorColor: "#495057",
      cursorWidth: 1,
      backend: "WebAudio",
      normalize: true,
      plugins: [RegionsPlugin.create()],
    });

    wavesurferRef.current = wavesurfer;

    objectURLRef.current = URL.createObjectURL(audioFile);
    wavesurfer.load(objectURLRef.current);

    wavesurfer.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
      wavesurfer.setVolume(volume);
    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      clearActiveRegion();
    });
    wavesurfer.on("timeupdate", (time) => setCurrentTime(time));
    wavesurfer.on("interaction", () => clearActiveRegion());
    wavesurfer.on("error", (err) => {
      console.error("WaveSurfer error:", err);
      setIsReady(false);
    });

    return () => {
      clearActiveRegion();
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
        objectURLRef.current = null;
      }
    };
  }, [audioFile, clearActiveRegion]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isReady, isMuted]);

  const handlePlayPause = useCallback(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.playPause();
    }
  }, [isReady]);

  const handleVolumeChange = useCallback((e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleSkip = useCallback((seconds) => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isReady) {
      const newTime = Math.max(0, Math.min(wavesurfer.getCurrentTime() + seconds, duration));
      wavesurfer.seekTo(newTime / duration);
    }
  }, [isReady, duration]);

  const handleSentenceClick = useCallback((start, end) => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady) return;

    clearActiveRegion();

    const regionsPlugin = wavesurfer.plugins[0];
    if (!regionsPlugin) return;

    const audioDuration = wavesurfer.getDuration();
    const safeStart = Math.max(0, start);
    const safeEnd = Math.min(end, audioDuration);

    regionsPlugin.addRegion({
      start: safeStart,
      end: safeEnd,
      color: "rgba(13, 110, 253, 0.15)",
      drag: false,
      resize: false,
    });

    if (audioDuration > 0) {
      wavesurfer.seekTo(safeStart / audioDuration);
      wavesurfer.play();

      const checkTime = (currentTime) => {
        if (currentTime >= safeEnd) {
          wavesurfer.pause();
          clearActiveRegion();
        }
      };

      timeCheckRef.current = checkTime;
      wavesurfer.on("timeupdate", checkTime);
    }
  }, [isReady, clearActiveRegion]);

  useEffect(() => {
    if (onSentenceClick) {
      onSentenceClick(handleSentenceClick);
    }
  }, [onSentenceClick, handleSentenceClick]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="waveform-container">
      <div className="waveform-header">
        <h3 className="waveform-title">Audio Waveform</h3>
        {audioFile && (
          <span className={`waveform-status ${isReady ? "ready" : ""}`}>
            {isReady ? "Ready" : "Loading..."}
          </span>
        )}
      </div>

      {audioFile ? (
        <div className="waveform-content">
          <div className="waveform-info">
            <span className="file-name">{audioFile.name}</span>
          </div>

          <div ref={waveformRef} className="waveform-display"></div>
          
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="waveform-controls">
            <div className="controls-group">
              <button
                onClick={() => handleSkip(-10)}
                disabled={!isReady}
                className="control-btn"
                title="Rewind 10s"
              >
                <SkipBackIcon />
              </button>
              
              <button
                onClick={handlePlayPause}
                disabled={!isReady}
                className="control-btn play-btn"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button
                onClick={() => handleSkip(10)}
                disabled={!isReady}
                className="control-btn"
                title="Forward 10s"
              >
                <SkipForwardIcon />
              </button>
            </div>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="volume-group">
              <button onClick={toggleMute} className="control-btn volume-btn">
                <VolumeIcon muted={isMuted} level={volume} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="waveform-empty">
          <p>No audio file selected</p>
          <span>Upload a file to view waveform</span>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;

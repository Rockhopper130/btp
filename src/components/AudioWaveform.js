import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

const random = (min, max) => Math.random() * (max - min) + min;
const randomColor = () =>
  `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

const AudioWaveform = ({ audioFile, onSentenceClick }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1); // Default playback rate
  const [volume, setVolume] = useState(1); // Default volume (100%)
  const [loop, setLoop] = useState(true); // Looping state
  const [activeRegion, setActiveRegion] = useState(null); // Active region state

  useEffect(() => {
    if (audioFile) {
      const regions = RegionsPlugin.create();
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4CAF50", // Waveform color
        progressColor: "#2196F3", // Played portion color
        height: 100, // Height of the waveform
        responsive: true, // Make the waveform responsive
        barWidth: 2, // Width of waveform bars
        cursorColor: "#FF5722", // Cursor color
        cursorWidth: 2, // Cursor width
        backend: "WebAudio", // WebAudio for full control
        normalize: true, // Normalize waveform heights
        plugins: [RegionsPlugin.create()],
      });

      wavesurferRef.current = wavesurfer;

      // Load the audio file
      const objectURL = URL.createObjectURL(audioFile);
      wavesurfer.load(objectURL);

      // Enable drag selection
      regions.enableDragSelection({
        color: "rgba(255, 0, 0, 0.1)",
      });

      // Handle region interactions
      regions.on("region-in", (region) => {
        setActiveRegion(region);
      });

      regions.on("region-out", (region) => {
        if (activeRegion === region) {
          if (loop) {
            region.play();
          } else {
            setActiveRegion(null);
          }
        }
      });

      regions.on("region-clicked", (region, e) => {
        e.stopPropagation(); // prevent triggering a click on the waveform
        setActiveRegion(region);
        region.play();
        region.setOptions({ color: randomColor() });
      });

      // Reset the active region when the user clicks anywhere in the waveform
      wavesurfer.on("interaction", () => {
        setActiveRegion(null);
      });

      // Cleanup on unmount
      return () => {
        wavesurfer.destroy();
        wavesurferRef.current = null;
      };
    }
  }, [audioFile, loop, activeRegion]);

  const handlePlayPause = () => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer) {
      wavesurfer.playPause();
      setIsPlaying(wavesurfer.isPlaying());
    }
  };

  const handlePlaybackRateChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(vol);
    }
  };

  const handleSentenceClick = (start, end) => {
    const wavesurfer = wavesurferRef.current;
    const regionsPlugin = wavesurfer.plugins[0];
  
    if (wavesurfer && regionsPlugin) {
      // Clear existing regions
      // Object.values(regionsPlugin.regions.list).forEach((region) => region.remove());
      regionsPlugin.regions.forEach((region) => region.remove()); 
  
      // Add the new region for the selected sentence
      regionsPlugin.addRegion({
        start: start,
        end: end,
        color: "rgba(255, 87, 34, 0.5)", // Highlight color
        drag: false,
        resize: false,
      });
  
      // Stop playback when it reaches the end of the region
      const stopPlayback = () => {
        const currentTime = wavesurfer.getCurrentTime();
        if (currentTime >= end) {
          wavesurfer.pause();
          wavesurfer.seekTo(start / wavesurfer.getDuration()); // Reset to start of region
          wavesurfer.un("audioprocess", stopPlayback); // Remove the listener
        }
      };
  
      // Remove any existing listener and add a new one
      wavesurfer.un("audioprocess");
      wavesurfer.on("audioprocess", stopPlayback);
  
      // Play the selected region
      wavesurfer.play(start, end);
    } else {
      console.error("Regions plugin not initialized correctly.");
    }
  };
  

  // Expose handleSentenceClick to parent component (optional)
  useEffect(() => {
    if (onSentenceClick) {
      onSentenceClick(handleSentenceClick);
    }
  }, [onSentenceClick]);

  return (
    <div style={{ margin: "20px 0", textAlign: "center" }}>
      {audioFile ? (
        <>
          <div
            ref={waveformRef}
            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          ></div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              margin: "10px 0",
            }}
          >
            <button onClick={handlePlayPause} style={{ padding: "10px 20px" }}>
              Play / Pause
            </button>
            <div>
              <label htmlFor="playbackRate">Speed: </label>
              <select
                id="playbackRate"
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                style={{ padding: "5px" }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
            <div>
              <label htmlFor="volume">Volume: </label>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{ verticalAlign: "middle" }}
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                />
                Loop regions
              </label>
            </div>
          </div>
        </>
      ) : (
        <p>Upload an audio file to view its waveform.</p>
      )}
    </div>
  );
};

export default AudioWaveform;

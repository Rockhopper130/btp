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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false); // Default loop state should be off
  const [activeRegion, setActiveRegion] = useState(null);

  useEffect(() => {
    if (audioFile) {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4CAF50",
        progressColor: "#2196F3",
        height: 100,
        responsive: true,
        barWidth: 2,
        cursorColor: "#FF5722",
        cursorWidth: 2,
        backend: "WebAudio",
        normalize: true,
        plugins: [RegionsPlugin.create()],
      });

      wavesurferRef.current = wavesurfer;

      const objectURL = URL.createObjectURL(audioFile);
      wavesurfer.load(objectURL);

      const regions = wavesurfer.plugins[0];

      regions.enableDragSelection({
        color: "rgba(255, 0, 0, 0.1)",
      });

      regions.on("region-in", (region) => {
        setActiveRegion(region);
      });

      regions.on("region-out", (region) => {
        if (activeRegion === region && !loop) {
          setActiveRegion(null);
        }
      });

      regions.on("region-click", (region, e) => {
        e.stopPropagation();
        setActiveRegion(region);
        region.play();
        region.setOptions({ color: randomColor() });
      });

      wavesurfer.on("interaction", () => {
        setActiveRegion(null);
      });

      return () => {
        wavesurfer.destroy();
        wavesurferRef.current = null;
      };
    }
  }, [audioFile, loop]);

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

    if (wavesurfer) {
      regionsPlugin.regions.forEach((region) => region.remove());
      const region = regionsPlugin.addRegion({
        start,
        end,
        color: "rgba(255, 87, 34, 0.5)",
        drag: false,
        resize: false,
      });

      const handlePlaybackMonitor = () => {
        const currentTime = wavesurfer.getCurrentTime();
        if (currentTime >= end) {
          wavesurfer.pause();
          wavesurfer.seekTo(start / wavesurfer.getDuration());
          wavesurfer.un("audioprocess", handlePlaybackMonitor); // Clean up listener

          regionsPlugin.regions.forEach((region) => region.remove());
          setIsPlaying(false);
        }
      };
      // Attach the playback monitor
      wavesurfer.on("audioprocess", handlePlaybackMonitor);

      // Seek to the region's start and play
      wavesurfer.seekTo(start / wavesurfer.getDuration());
      wavesurfer.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (onSentenceClick) {
      onSentenceClick(handleSentenceClick);
    }
  }, [onSentenceClick]);

  return (
    <div
      style={{
        margin: "20px 0",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {audioFile ? (
        <>
          <div
            ref={waveformRef}
            style={{
              width: "80%",
              height: "100px",
              marginBottom: "10px",
              border: "2px solid #4CAF50",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "20px",
              background: "#f9f9f9",
            }}
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
              {isPlaying ? "Pause" : "Play"}
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

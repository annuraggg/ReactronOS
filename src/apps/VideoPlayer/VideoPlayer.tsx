import React, { useRef, useState, useEffect } from "react";

function formatTime(sec: number) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  alt,
  poster,
}: {
  src: string;
  alt?: string;
  onClose?: () => void;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (showControls && playing) {
      timeout = setTimeout(() => setShowControls(false), 2200);
    }
    return () => clearTimeout(timeout);
  }, [showControls, playing]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!containerRef.current) return;
      if (document.activeElement !== containerRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (playing) {
          videoRef.current?.pause();
        } else {
          videoRef.current?.play();
        }
      } else if (e.code === "ArrowRight") {
        videoRef.current!.currentTime = Math.min(
          (videoRef.current?.currentTime || 0) + 5,
          duration
        );
      } else if (e.code === "ArrowLeft") {
        videoRef.current!.currentTime = Math.max(
          (videoRef.current?.currentTime || 0) - 5,
          0
        );
      } else if (e.key === "f" || e.key === "F") {
        if (!containerRef.current) return;
        if (!fullscreen) {
          if (containerRef.current.requestFullscreen) {
            void containerRef.current.requestFullscreen();
          }
          setFullscreen(true);
        } else {
          if (document.exitFullscreen) {
            void document.exitFullscreen();
          }
          setFullscreen(false);
        }
      } else if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playing, duration, fullscreen]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!fullscreen) {
      if (containerRef.current.requestFullscreen)
        containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setFullscreen(false);
    }
  }

  function handleProgressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    setCurrent(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  }
  //   function handleProgressCommit(e: React.ChangeEvent<HTMLInputElement>) {
  //     const time = parseFloat(e.target.value);
  //     setCurrent(time);
  //     setSeeking(false);
  //     if (videoRef.current) videoRef.current.currentTime = time;
  //   }
  //

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  }

  function handleMute() {
    setMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  }

  function handlePlayPause() {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
  }

  function onDownload() {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "video";
    link.click();
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#23242a] to-[#1a1b23] relative rounded-xl overflow-hidden group"
      style={{
        minWidth: 340,
        minHeight: 340,
        boxShadow: "0 6px 32px #000a",
        outline: fullscreen ? "2px solid #38bdf8" : "none",
      }}
      tabIndex={0}
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="rounded-lg shadow-lg max-w-[95vw] max-h-[70vh] bg-black"
        style={{ width: "100%", height: "100%" }}
        tabIndex={0}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
        onClick={handlePlayPause}
        onVolumeChange={() => {
          setVolume(videoRef.current?.volume || 1);
          setMuted(videoRef.current?.muted || false);
        }}
        muted={muted}
        controls={false}
        autoPlay={false}
      />
      {(showControls || !playing) && (
        <div className="absolute left-0 right-0 bottom-0 px-2 py-2 bg-gradient-to-t from-zinc-950/85 to-transparent transition-all z-10">
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handlePlayPause}
              className="bg-zinc-800/70 rounded-full p-2 hover:bg-blue-700/80 text-white"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width={22} height={22} viewBox="0 0 22 22">
                  <rect
                    x="5"
                    y="4.5"
                    width="3.5"
                    height="13"
                    rx="1"
                    fill="white"
                  />
                  <rect
                    x="13.5"
                    y="4.5"
                    width="3.5"
                    height="13"
                    rx="1"
                    fill="white"
                  />
                </svg>
              ) : (
                <svg width={22} height={22} viewBox="0 0 22 22">
                  <polygon points="6,4 18,11 6,18" fill="white" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={current}
              step={0.1}
              onChange={handleProgressChange}
              //   onMouseUp={handleProgressCommit}
              //   onTouchEnd={handleProgressCommit}
              className="w-44 accent-blue-500"
            />
            <div
              className="text-xs text-zinc-200 font-mono ml-1"
              style={{ minWidth: 64 }}
            >
              {formatTime(current)} / {formatTime(duration)}
            </div>
            <button
              onClick={handleMute}
              className="bg-zinc-800/70 rounded-full p-1 hover:bg-blue-700/80 text-white ml-2"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <svg width={18} height={18} viewBox="0 0 18 18">
                  <path d="M5 7H2v4h3l4 3V4l-4 3z" fill="white" />
                  <line
                    x1="13"
                    y1="7"
                    x2="17"
                    y2="11"
                    stroke="white"
                    strokeWidth={1.3}
                  />
                  <line
                    x1="17"
                    y1="7"
                    x2="13"
                    y2="11"
                    stroke="white"
                    strokeWidth={1.3}
                  />
                </svg>
              ) : (
                <svg width={18} height={18} viewBox="0 0 18 18">
                  <path d="M5 7H2v4h3l4 3V4l-4 3z" fill="white" />
                  <path
                    d="M14 9a5 5 0 0 0-5-5"
                    stroke="white"
                    strokeWidth={1.2}
                    fill="none"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-blue-400"
            />
            <button
              onClick={toggleFullscreen}
              className="ml-2 bg-zinc-800/70 rounded-full p-2 hover:bg-blue-700/80 text-white"
              title="Fullscreen"
            >
              <svg width={18} height={18} viewBox="0 0 18 18">
                <rect x="2" y="2" width="4" height="2" rx="1" fill="white" />
                <rect x="2" y="2" width="2" height="4" rx="1" fill="white" />
                <rect x="12" y="2" width="4" height="2" rx="1" fill="white" />
                <rect x="14" y="2" width="2" height="4" rx="1" fill="white" />
                <rect x="2" y="14" width="4" height="2" rx="1" fill="white" />
                <rect x="2" y="12" width="2" height="4" rx="1" fill="white" />
                <rect x="12" y="14" width="4" height="2" rx="1" fill="white" />
                <rect x="14" y="12" width="2" height="4" rx="1" fill="white" />
              </svg>
            </button>
            <div className="flex-1" />
            <button
              onClick={onDownload}
              className="bg-zinc-800/80 rounded-full p-2 hover:bg-blue-700/80 text-white shadow transition"
              title="Download"
            >
              <svg width={19} height={19} fill="none" viewBox="0 0 20 20">
                <path
                  d="M5 14.5v1a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0015 15.5v-1M10 3v10m0 0l-4-4m4 4l4-4"
                  stroke="white"
                  strokeWidth={1.45}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="absolute left-2 top-2 px-3 py-1 rounded bg-zinc-900/60 text-zinc-100 text-xs font-mono pointer-events-none opacity-85">
        {alt || src}
      </div>
    </div>
  );
}

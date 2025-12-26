import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings,
  Video
} from 'lucide-react';

interface VideoPlayerProps {
  src: string | null;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer = ({ 
  src, 
  onEnded, 
  onPrevious, 
  onNext, 
  hasPrevious = false, 
  hasNext = false 
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onEnded]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  if (!src) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl">
        <div className="text-center">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Video hali yuklanmagan</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Tez orada qo'shiladi</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={togglePlay}
      >
        {!isPlaying && (
          <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
            <Play className="h-10 w-10 text-primary-foreground ml-1" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-4 cursor-pointer"
        />

        <div className="flex items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-1">
            {/* Previous */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Skip Back 10s */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={() => skip(-10)}
            >
              <span className="text-xs font-bold">-10</span>
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {/* Skip Forward 10s */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={() => skip(10)}
            >
              <span className="text-xs font-bold">+10</span>
            </Button>

            {/* Next */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={onNext}
              disabled={!hasNext}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20 hidden sm:flex"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm ml-3">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{playbackSpeed}x</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PLAYBACK_SPEEDS.map(speed => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={playbackSpeed === speed ? 'bg-primary/10' : ''}
                  >
                    {speed}x {speed === 1 && '(Normal)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

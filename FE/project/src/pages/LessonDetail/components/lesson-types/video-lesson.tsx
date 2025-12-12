import { motion } from 'framer-motion';
import { ExternalLink, FileText, Play, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef, useState, useId } from 'react';
import { renderText } from '@/utils/textUtils';

interface Material {
  id: number;
  title: string;
  type: string;
  size: string;
  url: string;
}

interface VideoLessonProps {
  videoURL: string | null;
  materials: Material[];
  onWatchTimeUpdate?: (seconds: number) => void;
  requiredWatchTime?: number;
}

// YouTube Player types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
  getPlayerState: () => number;
}

const getVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    // Handle youtu.be links
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || null;
    }
    // Handle youtube.com links
    const u = new URL(url);
    return u.searchParams.get('v') || null;
  } catch {
    return null;
  }
};

const VideoLesson = ({
  videoURL,
  materials,
  onWatchTimeUpdate,
  requiredWatchTime = 10,
}: VideoLessonProps) => {
  const [watchedTime, setWatchedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const playerId = useId().replace(/:/g, '');
  const videoId = getVideoId(videoURL);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      // Check if script already exists
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Wait for API to be ready
      const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT);
          initPlayer();
        }
      }, 100);

      // Cleanup check interval after 10s
      setTimeout(() => clearInterval(checkYT), 10000);
    };

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(`yt-player-${playerId}`, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
          },
          onStateChange: (event) => {
            const state = event.data;
            
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Start tracking watch time
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = window.setInterval(() => {
                setWatchedTime((prev) => {
                  const newTime = prev + 1;
                  onWatchTimeUpdate?.(newTime);
                  return newTime;
                });
              }, 1000);
            } else {
              setIsPlaying(false);
              // Stop tracking when paused/ended
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Player may already be destroyed
        }
        playerRef.current = null;
      }
    };
  }, [videoId, playerId, onWatchTimeUpdate]);

  const hasWatchedEnough = watchedTime >= requiredWatchTime;

  return (
    <>
      {/* VIDEO PLAYER */}
      <Card className="mb-4 overflow-hidden shadow-xl border-0">
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
            {videoId ? (
              <div
                id={`yt-player-${playerId}`}
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>Không có video</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Watch Progress Indicator */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <Play className="w-4 h-4 text-green-600 animate-pulse" />
              ) : (
                <Clock className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Thời gian đã xem: {watchedTime}s / {requiredWatchTime}s
              </span>
            </div>
            {hasWatchedEnough ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                ✓ Đủ điều kiện hoàn thành
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Xem thêm {requiredWatchTime - watchedTime}s
              </Badge>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hasWatchedEnough
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{
                width: `${Math.min((watchedTime / requiredWatchTime) * 100, 100)}%`,
              }}
            />
          </div>
          
          {!playerReady && videoId && (
            <p className="text-xs text-gray-500 mt-2">Đang tải video player...</p>
          )}
        </div>
      </Card>

      {/* MATERIALS */}
      <Card className="shadow-xl border-0">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Tài liệu bài học</span>
            </h3>

            {materials?.length ? (
              <div className="grid grid-cols-1 gap-4">
                {materials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-5 hover:shadow-lg transition-all hover:scale-105 border-0 bg-gradient-to-br from-white to-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900">
                              {renderText(material.title)}
                            </h4>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {material.type}
                              </Badge>
                              <span>•</span>
                              <span>{material.size}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          asChild
                        >
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Xem file
                          </a>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Không có tài liệu nào.</p>
            )}
          </div>
        </motion.div>
      </Card>
    </>
  );
};

export default VideoLesson;

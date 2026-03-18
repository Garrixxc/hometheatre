import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Play, Search, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelAvatar: string;
  views: string;
  postedAt: string;
  duration: string;
  category: string;
}

const CATEGORIES = ['All', 'Music', 'Gaming', 'Mixes', 'Tech', 'Live', 'Movies', 'Sports', 'Cooking'];

const MOCK_VIDEOS: Video[] = [
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny - 4K 60fps CGI Animation',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    channel: 'Blender Studio',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blender',
    views: '12M views',
    postedAt: '1 year ago',
    duration: '10:34',
    category: 'Movies',
  },
  {
    id: 'YE7VzlLtp-4',
    title: 'Sintel - Third Open Movie by Blender Foundation',
    thumbnail: 'https://img.youtube.com/vi/YE7VzlLtp-4/maxresdefault.jpg',
    channel: 'Blender',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blender2',
    views: '8.4M views',
    postedAt: '2 years ago',
    duration: '14:48',
    category: 'Movies',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channel: 'Rick Astley',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rick',
    views: '1.4B views',
    postedAt: '14 years ago',
    duration: '3:32',
    category: 'Music',
  },
];

interface YouTubeDiscoveryProps {
  onSelect: (video: Video) => void;
}

export const YouTubeDiscovery = ({ onSelect }: YouTubeDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchYouTubeVideos = useCallback(
    async (query: string, category: string) => {
      if (!API_KEY) {
        const filtered = MOCK_VIDEOS.filter(
          (video) =>
            (video.title.toLowerCase().includes(query.toLowerCase()) ||
              video.channel.toLowerCase().includes(query.toLowerCase())) &&
            (category === 'All' || video.category === category),
        );
        setVideos(filtered);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const q = category === 'All' ? query : `${query} ${category}`;
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(q)}&type=video&key=${API_KEY}`,
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const mappedVideos: Video[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          channel: item.snippet.channelTitle,
          channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.snippet.channelId}`,
          views: 'Live Search',
          postedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
          duration: 'HD',
          category,
        }));

        setVideos(mappedVideos);
      } catch (err: any) {
        console.error('YouTube Search Error:', err);
        setError(err.message || 'Failed to fetch videos');
        setVideos(MOCK_VIDEOS);
      } finally {
        setIsLoading(false);
      }
    },
    [API_KEY],
  );

  useEffect(() => {
    fetchYouTubeVideos(debouncedQuery, selectedCategory);
  }, [debouncedQuery, selectedCategory, fetchYouTubeVideos]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search YouTube"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input pl-12 pr-12"
            />
            {isLoading ? <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-accent" /> : null}
          </label>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all',
                  selectedCategory === category
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-background/70 text-muted',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!API_KEY ? (
        <div className="rounded-[1.5rem] border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <WifiOff className="mr-2 inline h-4 w-4" />
          Live YouTube search is using local mock content because `VITE_YOUTUBE_API_KEY` is not set.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {videos.length > 0 ? (
          videos.map((video, idx) => (
            <motion.button
              key={video.id + idx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onSelect(video)}
              className="glass-panel overflow-hidden rounded-[1.7rem] text-left"
            >
              <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-3">
                  <img src={video.channelAvatar} alt={video.channel} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-lg font-extrabold tracking-[-0.04em]">{video.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span className="rounded-full bg-background/70 px-3 py-1">{video.channel}</span>
                      <span>{video.views}</span>
                      <span>{video.postedAt}</span>
                    </div>
                  </div>
                  <Play className="mt-1 h-5 w-5 shrink-0 text-accent" />
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="glass-panel col-span-full rounded-[1.8rem] p-10 text-center">
            <Search className="mx-auto h-10 w-10 text-muted" />
            <h3 className="mt-4 text-xl font-extrabold tracking-[-0.05em]">No results found</h3>
            <p className="mt-3 text-sm text-muted">Try another title or switch categories.</p>
          </div>
        )}
      </section>

      <section className="glass-panel rounded-[1.8rem] p-6 text-center">
        <p className="section-label mb-3">Have a link already?</p>
        <h3 className="text-2xl font-extrabold tracking-[-0.05em]">Skip discovery and paste your own URL.</h3>
        <button
          onClick={() =>
            onSelect({
              id: 'custom',
              title: '',
              thumbnail: '',
              channel: '',
              channelAvatar: '',
              views: '',
              postedAt: '',
              duration: '',
              category: '',
            })
          }
          className="primary-button mt-5"
        >
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Use custom link
        </button>
      </section>
    </div>
  );
};

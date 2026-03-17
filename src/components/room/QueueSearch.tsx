import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play, Plus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface QueueSearchProps {
  currentVideoUrl?: string;
  onAdd: (video: { title: string; videoUrl: string; thumbnail: string }) => void;
}

export const QueueSearch = ({ currentVideoUrl, onAdd }: QueueSearchProps) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchVideos = useCallback(async (searchQuery: string, relatedId?: string) => {
    if (!API_KEY) return;
    
    setIsLoading(true);
    try {
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&type=video&key=${API_KEY}`;
      
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      } else if (relatedId) {
        // Use relatedToVideoId for recommendations
        // Note: As of 2023, the 'relatedToVideoId' parameter requires 'type=video' and often 'relevanceLanguage'
        url += `&relatedToVideoId=${relatedId}`;
      } else {
        // Fallback to trending
        url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=8&regionCode=IN&key=${API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items) {
        const mapped = data.items.map((item: any) => ({
          id: item.id.videoId || item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          channel: item.snippet.channelTitle
        }));

        if (searchQuery) setSearchResults(mapped);
        else setRecommendations(mapped);
      }
    } catch (err) {
      console.error('YouTube Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      setIsSearching(true);
      fetchVideos(debouncedQuery);
    } else {
      setIsSearching(false);
    }
  }, [debouncedQuery, fetchVideos]);

  useEffect(() => {
    const currentId = currentVideoUrl ? extractVideoId(currentVideoUrl) : null;
    fetchVideos('', currentId || undefined);
  }, [currentVideoUrl, fetchVideos]);

  return (
    <div className="space-y-6">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#0A84FF] transition-colors" />
        <input 
          type="text" 
          placeholder="Search videos to add..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#0A84FF]/40 transition-all"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3 h-3 text-[#0A84FF] animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          {isSearching ? (
             <Search className="w-3 h-3 text-gray-500" />
          ) : (
             <Sparkles className="w-3 h-3 text-[#0A84FF]" />
          )}
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {isSearching ? `Results for "${debouncedQuery}"` : "Recommended for this Party"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
          {(isSearching ? searchResults : recommendations).map((video) => (
            <button
              key={video.id}
              onClick={() => onAdd({
                title: video.title,
                videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
                thumbnail: video.thumbnail
              })}
              className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group"
            >
              <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-none bg-gray-900 shadow-lg">
                <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[11px] font-black text-white truncate uppercase leading-tight group-hover:text-[#0A84FF] transition-colors"
                   dangerouslySetInnerHTML={{ __html: video.title }} />
                <p className="text-[9px] text-gray-500 truncate mt-1">{video.channel}</p>
              </div>
            </button>
          ))}

          {isLoading && (isSearching ? searchResults : recommendations).length === 0 && (
            <div className="py-20 text-center opacity-20">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              <p className="text-[10px] uppercase tracking-widest">Loading Library...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

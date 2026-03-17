import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Room } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { cn } from '../../lib/utils';

export const RoomSettingsModal = ({ 
  room, 
  onClose 
}: { 
  room: Room; 
  onClose: () => void; 
}) => {
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description || '');
  const [videoUrl, setVideoUrl] = useState(room.videoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim() || null,
      });
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${room.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold">Room Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-card-foreground/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Room Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#0A84FF] outline-none"
              placeholder="Enter room title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#0A84FF] outline-none h-24 resize-none"
              placeholder="What are we watching?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Video URL</label>
            <input 
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#0A84FF] outline-none"
              placeholder="https://example.com/video.mp4"
            />
            <p className="text-[10px] text-gray-500">Update the video for everyone in the room.</p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0A84FF] font-bold text-sm hover:bg-[#0A84FF]/80 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <button 
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                try {
                  await deleteDoc(doc(db, 'rooms', room.id));
                  onClose();
                } catch (e) {
                  handleFirestoreError(e, OperationType.DELETE, `rooms/${room.id}`);
                }
              }}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors",
                confirmDelete 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              )}
            >
              {confirmDelete ? 'Confirm End Party' : 'End Watch Party'}
            </button>
            {confirmDelete && (
              <button 
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 text-center hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

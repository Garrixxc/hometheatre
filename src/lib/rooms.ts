import { collection, deleteDoc, doc, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Room } from '../types';

const STALE_ROOM_GRACE_MS = 30_000;

const toMillis = (value: any) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return 0;
};

export const hydrateRoom = (snapshot: QueryDocumentSnapshot): Room => ({
  id: snapshot.id,
  ...snapshot.data(),
}) as Room;

export const resolveLiveRooms = async (rooms: Room[]) => {
  const results = await Promise.all(
    rooms.map(async (room) => {
      const participantsSnapshot = await getDocs(collection(db, 'rooms', room.id, 'participants'));
      const participantCount = participantsSnapshot.size;

      if (participantCount > 0) {
        return {
          ...room,
          participantsCount: participantCount,
        };
      }

      const roomAge = Date.now() - toMillis(room.createdAt);
      if (roomAge > STALE_ROOM_GRACE_MS) {
        try {
          await deleteDoc(doc(db, 'rooms', room.id));
        } catch (error) {
          console.error(`Failed to delete stale room ${room.id}`, error);
        }
      }

      return null;
    }),
  );

  return results.filter((room): room is Room => Boolean(room));
};

import { useState, useCallback } from 'react';
import { ChatRoom } from '../../types/chat';
import * as chatService from '../../services/chatService';

export function useChatRooms(projectId: string) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      const data = await chatService.fetchRooms(projectId);
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  }, [projectId]);

  const selectRoom = useCallback((roomId: number | null) => {
    setSelectedRoomId(roomId);
  }, []);

  const createRoom = useCallback(async (name: string, members: string[]) => {
    try {
      const newRoom = await chatService.createRoom(projectId, name, members);
      setRooms(prev => [...prev, newRoom]);
      return newRoom;
    } catch (err) {
      console.error('Failed to create room:', err);
      return null;
    }
  }, [projectId]);

  const deleteRoom = useCallback(async (roomId: number) => {
    try {
      await chatService.deleteRoom(projectId, roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  }, [projectId, selectedRoomId]);

  const updateRoomMeta = useCallback(async (roomId: number, updates: { name?: string; topic?: string; description?: string }) => {
    try {
      const updated = await chatService.updateRoomMeta(projectId, roomId, updates);
      setRooms(prev => prev.map(r => r.id === roomId ? updated : r));
      return updated;
    } catch (err) {
      console.error('Failed to update room meta:', err);
      return null;
    }
  }, [projectId]);

  const pinRoomMessage = useCallback(async (roomId: number, messageId: number | null) => {
    try {
      await chatService.pinRoomMessage(projectId, roomId, messageId);
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, pinnedMessageId: messageId } : r));
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  }, [projectId]);

  return {
    rooms,
    setRooms,
    selectedRoomId,
    loadRooms,
    selectRoom,
    createRoom,
    deleteRoom,
    updateRoomMeta,
    pinRoomMessage,
  };
}

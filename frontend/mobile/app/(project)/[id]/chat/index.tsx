import React, { useState } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useChat } from '@/src/hooks/chat/useChat';
import { ChatSidebar }            from '@/src/components/chat/ChatSidebar';
import { ChatHeader }             from '@/src/components/chat/ChatHeader';
import { ChatConnectionBanner }   from '@/src/components/chat/ChatConnectionBanner';
import { ChatSearchPanel }        from '@/src/components/chat/ChatSearchPanel';
import { ChatMessageList }        from '@/src/components/chat/ChatMessageList';
import { ChatInput }              from '@/src/components/chat/ChatInput';
import { ChatLoadingSkeleton }    from '@/src/components/chat/ChatLoadingSkeleton';
import { ThreadBottomSheet }      from '@/src/components/chat/ThreadBottomSheet';
import { PinnedMessageBanner }    from '@/src/components/chat/ChatMessage';
import { CreateChannelModal, EditMessageModal, ConfirmDeleteModal, EditChannelModal } from '@/src/components/chat/ChatModals';
import { Colors }                 from '@/src/constants/colors';
import { ChatMessage, ChatRoom } from '@/src/types/chat';
import { QuickReactionBar } from '@/src/components/chat/QuickReactionBar';

type ChatScreenContentProps = {
  projectId: string;
  topOffset?: number;
};

export function ChatScreenContent({ projectId, topOffset = 0 }: ChatScreenContentProps) {
  interface ReactionTarget {
    message: ChatMessage;
    anchorY: number;
    isMe: boolean;
  }

  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm]   = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ id: number; name: string; topic: string; description: string } | null>(null);
  const [reactionTarget, setReactionTarget] = useState<ReactionTarget | null>(null);

  const {
    currentUser, currentUserAliases, users, userProfilePics,
    rooms, roomMessages, messages, privateMessages,
    selectedUser, selectedRoomId,
    privateUnseenCounts, roomUnseenCounts,
    privateLastMessages, roomLastMessages,
    teamUnseenCount, teamLastMessage,
    teamTypingUsers, roomTypingUsers, privateTypingUsers,
    featureFlags, searchResults, isSearchLoading,
    messageReactions, activeThreadRoot, threadMessages,
    onlineUsers, isLoading, isSocketConnected, error,
    roomMentionCounts, teamMentionCount,
    selectPrivateUser, selectRoom,
    sendMessage, sendRoomMessage, sendThreadReply,
    openThread, closeThread,
    editMessage, deleteMessage, toggleReaction,
    loadPrivateHistory, loadRoomHistory,
    createRoom, deleteRoom, updateRoomMeta, pinRoomMessage,
    sendTyping, searchMessages, retryConnection,
  } = useChat(projectId as string);

  const hasSelectedRoom  = selectedRoomId !== null;
  const selectedRoom     = hasSelectedRoom ? rooms.find(r => r.id === selectedRoomId) ?? null : null;
  const isPrivateChat    = !!selectedUser && !hasSelectedRoom;

  const displayMessages  = hasSelectedRoom
    ? (roomMessages[selectedRoomId as number] || [])
    : selectedUser
      ? (privateMessages[selectedUser.toLowerCase()] || [])
      : messages;
  const pinnedMessage = selectedRoom?.pinnedMessageId
    ? displayMessages.find(message => message.id === selectedRoom.pinnedMessageId) ?? null
    : null;

  const filteredUsers = users.filter(u =>
    !currentUserAliases.some(a => a?.toLowerCase() === u.toLowerCase()) &&
    u.toLowerCase() !== currentUser.toLowerCase() &&
    u.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const mentionCandidates = users.filter(u =>
    !currentUserAliases.some(a => a?.toLowerCase() === u.toLowerCase()) &&
    u.toLowerCase() !== currentUser.toLowerCase()
  );

  const handleSelectUser = (u: string | null) => {
    selectPrivateUser(u);
    setShowSidebar(false);
  };
  const handleSelectRoom = (id: number | null) => {
    selectRoom(id);
    if (id !== null) setShowSidebar(false);
  };
  const handleSendMessage = (content: string) => {
    if (hasSelectedRoom) sendRoomMessage(content, selectedRoomId as number);
    else sendMessage(content, selectedUser);
  };
  const handleCreateRoom = async (name: string, members: string[]) => {
    const created = await createRoom(name, members);
    if (created) { selectRoom(created.id); setShowSidebar(false); }
  };

  const roomTyping    = hasSelectedRoom && selectedRoomId != null ? (roomTypingUsers[selectedRoomId] || []) : [];
  const privateTyping = selectedUser ? privateTypingUsers.filter(u => u === selectedUser.toLowerCase()) : [];
  const activeTyping  = hasSelectedRoom ? roomTyping[0] : selectedUser ? privateTyping[0] : teamTypingUsers[0];
  const currentUserIdentitySet = new Set([
    currentUser.trim().toLowerCase(),
    ...currentUserAliases.map(alias => alias.trim().toLowerCase()),
  ]);
  const reactionMessage = reactionTarget?.message ?? null;
  const selectedReaction = reactionMessage?.id
    ? messageReactions[reactionMessage.id]?.find(reaction => reaction.reactedByCurrentUser)?.emoji
    : undefined;

  const isConnected         = isSocketConnected;
  const isReconnectError    = error.toLowerCase().includes('reconnect');
  const shouldShowErrorBanner = Boolean(error) && !isReconnectError;

  const handleMessageLongPress = (
    message: ChatMessage,
    event: GestureResponderEvent,
    messageIsMe: boolean,
  ) => {
    setReactionTarget({
      message,
      anchorY: event.nativeEvent.pageY,
      isMe: messageIsMe,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.safe, topOffset > 0 && { paddingTop: topOffset }]}>
        <ChatLoadingSkeleton />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, topOffset > 0 && { paddingTop: topOffset }]}
      edges={topOffset > 0 ? ['left', 'right'] : ['top','left','right']}
    >
      {showSidebar ? (
        <ChatSidebar
          currentUser={currentUser}
          currentUserAliases={currentUserAliases}
          users={filteredUsers}
          userProfilePics={userProfilePics}
          rooms={rooms}
          selectedUser={selectedUser}
          selectedRoomId={selectedRoomId}
          onSelectUser={handleSelectUser}
          onSelectRoom={handleSelectRoom}
          privateUnseenCounts={privateUnseenCounts}
          roomUnseenCounts={roomUnseenCounts}
          privateLastMessages={privateLastMessages}
          roomLastMessages={roomLastMessages}
          teamUnseenCount={teamUnseenCount}
          teamLastMessage={teamLastMessage}
          teamTypingUsers={teamTypingUsers}
          roomTypingUsers={roomTypingUsers}
          privateTypingUsers={privateTypingUsers}
          onlineUsers={onlineUsers}
          onOpenCreate={() => setIsCreateModalOpen(true)}
          onEditRoom={(room: ChatRoom) => setEditingRoom({ id: room.id, name: room.name, topic: room.topic || '', description: room.description || '' })}
          onDeleteRoom={deleteRoom}
          onUpdateRoomMeta={updateRoomMeta}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={false}
          roomMentionCounts={roomMentionCounts}
          teamMentionCount={teamMentionCount}
        />
      ) : (
        <View style={styles.chatArea}>
          <ChatConnectionBanner
            isConnected={isConnected}
            shouldShowErrorBanner={shouldShowErrorBanner}
            error={error}
            onRetry={retryConnection}
          />

          <ChatHeader
            selectedRoom={selectedRoom}
            selectedUser={selectedUser}
            userProfilePics={userProfilePics}
            onlineUsers={onlineUsers}
            isConnected={isConnected}
            phaseDEnabled={featureFlags.phaseDEnabled}
            showSearch={showSearch}
            onToggleSearch={() => setShowSearch(p => !p)}
            onShowSidebar={() => setShowSidebar(true)}
          />

          <PinnedMessageBanner
            pinnedMessage={pinnedMessage}
            onPress={() => pinnedMessage && openThread(pinnedMessage)}
            onDismiss={() => selectedRoomId && pinRoomMessage(selectedRoomId, null)}
          />

          {featureFlags.phaseDEnabled && (
            <ChatSearchPanel
              showSearch={showSearch}
              phaseDEnabled={featureFlags.phaseDEnabled}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onExecuteSearch={() => searchMessages(searchQuery)}
              isSearchLoading={isSearchLoading}
              searchResults={searchResults}
              onOpenResult={async (result) => {
                const aliases = new Set([currentUser.toLowerCase(), ...currentUserAliases.map(a => a.toLowerCase())]);
                if (result.context === 'ROOM' && result.roomId) {
                  selectRoom(result.roomId);
                  await loadRoomHistory(result.roomId);
                  setShowSearch(false);
                } else if (result.context === 'PRIVATE') {
                  const sender = (result.sender || '').toLowerCase();
                  const recipient = (result.recipient || '').toLowerCase();
                  const partner = aliases.has(sender) ? recipient : sender;
                  if (partner) {
                    selectPrivateUser(partner);
                    await loadPrivateHistory(partner);
                    setShowSearch(false);
                  }
                }
              }}
            />
          )}

          <ChatMessageList
            projectId={projectId as string}
            messages={displayMessages}
            currentUser={currentUser}
            currentUserAliases={currentUserAliases}
            userProfilePics={userProfilePics}
            isPrivateChat={isPrivateChat}
            activeRoomId={selectedRoomId}
            pinnedMessageId={selectedRoom?.pinnedMessageId ?? null}
            reactionsByMessageId={messageReactions}
            onOpenThread={openThread}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onToggleReaction={toggleReaction}
            onPinRoomMessage={selectedRoomId ? (mid) => pinRoomMessage(selectedRoomId, mid) : undefined}
            typingUser={activeTyping}
            onLongPress={handleMessageLongPress}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onTypingChange={sendTyping}
            disabled={isLoading || !isConnected || shouldShowErrorBanner}
            placeholder={
              hasSelectedRoom
                ? `Message #${selectedRoom?.name ?? 'channel'}…`
                : selectedUser
                ? `Message ${selectedUser}…`
                : 'Message team…'
            }
            enableMentions={!selectedUser}
            mentionCandidates={mentionCandidates}
            projectId={projectId as string}
          />
        </View>
      )}

      {/* Modals */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
        onCreate={handleCreateRoom}
      />

      <EditMessageModal
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        initialContent={editingMessage?.content}
        onSave={(content: string) => editingMessage?.id && editMessage(editingMessage.id, content)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={() => deletingMessageId && deleteMessage(deletingMessageId)}
      />

      {editingRoom && (
        <EditChannelModal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          initialName={editingRoom.name}
          initialTopic={editingRoom.topic}
          initialDescription={editingRoom.description}
          onSave={(updates) => {
            updateRoomMeta(editingRoom.id, updates);
            setEditingRoom(null);
          }}
        />
      )}

      <ThreadBottomSheet
        visible={!!activeThreadRoot}
        rootMessage={activeThreadRoot}
        threadMessages={threadMessages}
        userProfilePics={userProfilePics}
        reactionsByMessageId={messageReactions}
        currentUser={currentUser}
        currentUserAliases={currentUserAliases}
        onClose={closeThread}
        onSendReply={sendThreadReply}
        onToggleReaction={toggleReaction}
        projectId={projectId as string}
      />
      <QuickReactionBar
        visible={!!reactionTarget}
        onClose={() => setReactionTarget(null)}
        onReact={(emoji) => { if (reactionMessage?.id) toggleReaction(reactionMessage.id, emoji); }}
        onReply={() => reactionMessage && openThread(reactionMessage)}
        onEdit={reactionMessage && currentUserIdentitySet.has((reactionMessage.sender || '').trim().toLowerCase()) ? () => setEditingMessage(reactionMessage) : undefined}
        onDelete={reactionMessage && currentUserIdentitySet.has((reactionMessage.sender || '').trim().toLowerCase()) && reactionMessage.id ? () => setDeletingMessageId(reactionMessage.id as number) : undefined}
        anchorY={reactionTarget?.anchorY}
        isMe={reactionTarget?.isMe}
        selectedEmoji={selectedReaction}
      />
    </SafeAreaView>
  );
}

export default function ChatScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();

  return <ChatScreenContent projectId={projectId as string} />;
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.pageBg },
  chatArea: { flex: 1, backgroundColor: Colors.white },
});

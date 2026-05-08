import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
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
import { CreateChannelModal, EditMessageModal, ConfirmDeleteModal } from '@/src/components/chat/ChatModals';
import { Colors }                 from '@/src/constants/colors';
import { ChatMessage } from '@/src/types/chat';
import { QUICK_REACTIONS } from '@/src/hooks/chat/chatUtils';

export default function ChatScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm]   = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

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
    ? [...(roomMessages[selectedRoomId as number] || [])]
    : selectedUser
      ? [...(privateMessages[selectedUser] || [])]
      : [...messages];

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

  const isConnected         = isSocketConnected;
  const isReconnectError    = error.toLowerCase().includes('reconnect');
  const shouldShowErrorBanner = Boolean(error) && !isReconnectError;

  const handleMessageLongPress = (message: ChatMessage) => {
    const isMe = message.sender === currentUser || currentUserAliases.includes(message.sender);
    const options = isMe
      ? ['💬 Reply in Thread', '✏️ Edit', '🗑 Delete', '😀 React', 'Cancel']
      : ['💬 Reply in Thread', '😀 React', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: isMe ? 2 : -1 },
        (buttonIndex) => {
          handleAction(buttonIndex, message, isMe);
        }
      );
    } else {
      Alert.alert('Message Actions', undefined, options.map((opt, i) => ({
        text: opt,
        onPress: () => handleAction(i, message, isMe),
        style: opt === '🗑 Delete' ? 'destructive' : opt === 'Cancel' ? 'cancel' : 'default'
      })));
    }
  };

  const handleAction = (index: number, message: ChatMessage, isMe: boolean) => {
    const actions = isMe
      ? ['reply', 'edit', 'delete', 'react', 'cancel']
      : ['reply', 'react', 'cancel'];

    const action = actions[index];
    if (!action || action === 'cancel') return;

    switch (action) {
      case 'reply': openThread(message); break;
      case 'edit': setEditingMessage(message); break;
      case 'delete': message.id && setDeletingMessageId(message.id); break;
      case 'react':
        Alert.alert('React', undefined, [
          ...QUICK_REACTIONS.map(emoji => ({
            text: emoji,
            onPress: () => message.id && toggleReaction(message.id, emoji),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]);
        break;
    }
  };

  if (isLoading) return <ChatLoadingSkeleton />;

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
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
          onOpenCreate={() => setIsCreateModalOpen(true)}
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

          {featureFlags.phaseDEnabled && (
            <ChatSearchPanel
              showSearch={showSearch}
              phaseDEnabled={featureFlags.phaseDEnabled}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onExecuteSearch={() => searchMessages(searchQuery)}
              isSearchLoading={isSearchLoading}
              searchResults={searchResults}
              onOpenResult={() => {/* implement jump-to */}}
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

      <ThreadBottomSheet
        visible={!!activeThreadRoot}
        rootMessage={activeThreadRoot}
        threadMessages={threadMessages}
        userProfilePics={userProfilePics}
        reactionsByMessageId={messageReactions}
        currentUser={currentUser}
        onClose={closeThread}
        onSendReply={sendThreadReply}
        onToggleReaction={toggleReaction}
        projectId={projectId as string}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.pageBg },
  chatArea: { flex: 1, backgroundColor: Colors.white },
});

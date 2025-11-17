import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Modal, TextInput, FlatList, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface FloatingChatButtonProps {
  onPress?: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default action: show chat modal
      setModalVisible(true);
    }
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      // Here you could add logic to send to AI/chat service
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleBackPress = () => {
    if (isInputFocused) {
      textInputRef.current?.blur();
    } else {
      closeModal();
    }
  };

  return (
    <>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <TouchableOpacity style={styles.fab} onPress={handlePress}>
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleBackPress}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aura Assistant</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
                  <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.aiMessageText]}>{item.text}</Text>
                </View>
              )}
              style={styles.messagesList}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={Colors.textSecondary}
                onSubmitEditing={sendMessage}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabGradient: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    opacity: 0.6,
  },
  fab: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: '95%',
    height: '80%',
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  messagesList: {
    flex: 1,
    marginBottom: 20,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray200,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: Colors.white,
  },
  aiMessageText: {
    color: Colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: Colors.textPrimary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

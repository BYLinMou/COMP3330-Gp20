import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Modal, TextInput, FlatList, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { sendChatCompletion, ChatMessage } from '../src/services/openai-client';
import { allTools, SYSTEM_PROMPT, Tool } from '../src/services/chat-tools';

interface FloatingChatButtonProps {
  onPress?: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isToolCall?: boolean;
  isAIExplanation?: boolean;
  toolCall?: {
    name: string;
    arguments: any;
    isExpanded?: boolean;
    isExecuting?: boolean;
    result?: any;
    error?: string;
  };
}

interface PendingToolCall {
  name: string;
  arguments: any;
  description: string;
  isExpanded?: boolean;
  isExecuting?: boolean;
  result?: any;
  error?: string;
}

export default function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(null);
  const [typingDots, setTypingDots] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const isLoadingMessages = useRef(false);

  // Load messages from AsyncStorage on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        isLoadingMessages.current = true;
        const storedMessages = await AsyncStorage.getItem('chatMessages');
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
      } finally {
        isLoadingMessages.current = false;
      }
    };
    loadMessages();
  }, []);

  // Save messages to AsyncStorage whenever messages change
  useEffect(() => {
    if (!isLoadingMessages.current) {
      const saveMessages = async () => {
        try {
          await AsyncStorage.setItem('chatMessages', JSON.stringify(messages));
        } catch (error) {
          console.error('Error saving chat messages:', error);
        }
      };
      saveMessages();
    }
  }, [messages]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = setInterval(() => {
        setTypingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      // Scroll to end when loading starts
      scrollToEnd();
    } else {
      setTypingDots('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default action: show chat modal
      setModalVisible(true);
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputText('');
      setIsLoading(true);
      scrollToEnd();

      try {
        // Prepare messages for AI
        const chatMessages: ChatMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...updatedMessages.map(m => ({
            role: m.isUser ? 'user' as const : 'assistant' as const,
            content: m.isAIExplanation ? m.text : m.isToolCall ? `Tool call: ${m.toolCall?.name}` : m.text
          })),
          { role: 'user', content: inputText }
        ];

        // Call OpenAI WITHOUT tools parameter - let AI return JSON format
        const response = await sendChatCompletion({
          messages: chatMessages,
          temperature: 0.7,
        });

        const aiContent = response.choices[0].message.content || '';

        // Try to parse JSON format from AI response
        let toolCallData: { explanation: string; toolName: string; parameters: any } | null = null;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/);
          const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
          const parsed = JSON.parse(jsonString);
          if (parsed.explanation && parsed.toolName && parsed.parameters) {
            toolCallData = parsed;
          }
        } catch (e) {
          // Not a tool call, just a regular message
        }

        if (toolCallData) {
          const tool = allTools.find(t => t.name === toolCallData!.toolName);
          
          if (tool) {
            // 第一个气泡：AI的解释
            const explanationMessage: Message = {
              id: (Date.now()).toString(),
              text: toolCallData.explanation,
              isUser: false,
              isAIExplanation: true,
            };
            setMessages(prev => [...prev, explanationMessage]);
            scrollToEnd();

            // 第二个气泡：工具调用待确认
            const toolCallMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: 'Pending confirmation',
              isUser: false,
              isToolCall: true,
              toolCall: {
                name: tool.name,
                arguments: toolCallData.parameters,
                isExpanded: true,
                isExecuting: false,
              }
            };
            setMessages(prev => [...prev, toolCallMessage]);
            scrollToEnd();
          }
        } else {
          // Regular message response
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: aiContent || 'I received your message.',
            isUser: false,
          };
          setMessages(prev => [...prev, aiResponse]);
          scrollToEnd();
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
        scrollToEnd();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const confirmToolCall = async (messageId: string) => {
    // Find the message and update its tool call state
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.toolCall) {
        return {
          ...msg,
          toolCall: {
            ...msg.toolCall,
            isExecuting: true,
          }
        };
      }
      return msg;
    }));
    scrollToEnd();

    try {
      // Find the tool
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.toolCall) return;

      const tool = allTools.find(t => t.name === message.toolCall!.name);
      if (tool) {
        const result = await tool.function(message.toolCall.arguments);
        
        // Update message with result
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.toolCall) {
            return {
              ...msg,
              toolCall: {
                ...msg.toolCall,
                isExecuting: false,
                result,
                isExpanded: false,
              }
            };
          }
          return msg;
        }));
        scrollToEnd();

        // Get the current messages state and send tool result to AI for a response
        setMessages(prevMessages => {
          // Build the context with all previous messages
          const allMessages = prevMessages.map(m => ({
            role: m.isUser ? 'user' as const : 'assistant' as const,
            content: m.isAIExplanation ? m.text : m.isToolCall ? `Tool call: ${m.toolCall?.name}` : m.text
          }));

          // Add the tool result as a new message context
          const toolResultContext: ChatMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...allMessages,
            { 
              role: 'user', 
              content: `Tool execution completed: ${message.toolCall!.name}\nResult: ${JSON.stringify(result, null, 2)}\n\nPlease provide a helpful summary or explanation of what was found.`
            }
          ];

          // Send to AI and handle response
          (async () => {
            setIsLoading(true);
            scrollToEnd();
            
            try {
              const aiResponse = await sendChatCompletion({
                messages: toolResultContext,
                temperature: 0.7,
                max_tokens: 500
              });

              // 第三个气泡：工具执行后AI的回应
              const aiSummary: Message = {
                id: (Date.now() + 2).toString(),
                text: aiResponse.choices[0].message.content || 'Tool executed successfully.',
                isUser: false,
              };
              setMessages(prev => [...prev, aiSummary]);
              scrollToEnd();
            } catch (aiError) {
              console.error('Error getting AI response for tool result:', aiError);
              // Still show success even if AI response fails
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: `Tool executed successfully. Result: ${JSON.stringify(result, null, 2)}`,
                isUser: false,
              };
              setMessages(prev => [...prev, successMessage]);
              scrollToEnd();
            } finally {
              setIsLoading(false);
            }
          })();

          return prevMessages;
        });
      }
    } catch (error) {
      console.error('Error executing tool:', error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.toolCall) {
          return {
            ...msg,
            toolCall: {
              ...msg.toolCall,
              isExecuting: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
        return msg;
      }));
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const clearHistory = async () => {
    setMessages([]);
    setInputText('');
    try {
      await AsyncStorage.removeItem('chatMessages');
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  };

  const cancelToolCall = (messageId: string) => {
    // Update the message to show it was cancelled
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.toolCall) {
        return {
          ...msg,
          text: `Action cancelled`,
          toolCall: {
            ...msg.toolCall,
            isExpanded: false,
          }
        };
      }
      return msg;
    }));
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
              ref={flatListRef}
              renderItem={({ item, index }) => (
                <View>
                  {item.isAIExplanation ? (
                    <View style={[styles.messageContainer, styles.aiMessage]}>
                      <Text style={[styles.messageText, styles.aiMessageText, { fontStyle: 'italic' }]}>
                        💭 {item.text}
                      </Text>
                    </View>
                  ) : item.isToolCall ? (
                    <View style={styles.toolCallContainer}>
                      {(() => {
                        const prefix = item.toolCall?.isExecuting
                          ? '🔄 '
                          : item.toolCall?.error
                            ? '❌ '
                            : item.toolCall?.result
                              ? '✅ '
                              : '⚙️ ';
                        const title = item.toolCall?.name || 'Tool action';
                        const headerText = `${prefix}${title}`;
                        return (
                          <TouchableOpacity 
                            style={styles.toolCallHeader}
                            onPress={() => setMessages(prev => prev.map(msg => 
                              msg.id === item.id && msg.toolCall
                                ? { ...msg, toolCall: { ...msg.toolCall, isExpanded: !msg.toolCall.isExpanded } }
                                : msg
                            ))}
                          >
                            <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.toolCallText} numberOfLines={1}>
                              {headerText}
                            </Text>
                          </View>
                          <Ionicons 
                            name={item.toolCall?.isExpanded ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color={Colors.textSecondary} 
                          />
                          </TouchableOpacity>
                        );
                      })()}
                      
                      {item.toolCall?.isExpanded && (
                        <View style={styles.toolCallDetails}>
                          <Text style={styles.toolCallDescription}>
                            Tool: {item.toolCall.name}{'\n'}
                            Parameters: {JSON.stringify(item.toolCall.arguments, null, 2)}
                          </Text>
                          
                          {item.toolCall.isExecuting && (
                            <Text style={styles.executingText}>Executing...</Text>
                          )}
                          
                          {item.toolCall.result && (
                            <View style={styles.resultContainer}>
                              <Text style={styles.resultLabel}>✅ Success:</Text>
                              <Text style={styles.resultText}>{JSON.stringify(item.toolCall.result, null, 2)}</Text>
                            </View>
                          )}
                          
                          {item.toolCall.error && (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorLabel}>❌ Error:</Text>
                              <Text style={styles.errorText}>{item.toolCall.error}</Text>
                            </View>
                          )}
                          
                          {!item.toolCall.isExecuting && !item.toolCall.result && !item.toolCall.error && (
                            <View style={styles.toolCallButtons}>
                              <TouchableOpacity 
                                style={[styles.toolButton, styles.confirmButton]} 
                                onPress={() => confirmToolCall(item.id)}
                              >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.toolButton, styles.cancelButton]} 
                                onPress={() => cancelToolCall(item.id)}
                              >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
                      <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.aiMessageText]}>{item.text}</Text>
                    </View>
                  )}
                </View>
              )}
              ListFooterComponent={
                isLoading ? (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <Text style={[styles.messageText, styles.aiMessageText]}>Aura Assistant is typing{typingDots}</Text>
                  </View>
                ) : null
              }
              style={styles.messagesList}
            />
            
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
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
                editable={!isLoading}
              />
              <TouchableOpacity style={[styles.sendButton, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]} onPress={sendMessage} disabled={isLoading || !inputText.trim()}>
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
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray200,
    width: '80%',
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
  clearButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    color: Colors.textPrimary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  toolCallContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    width: '80%',
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray200,
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolCallText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  toolCallDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 10,
  },
  toolCallDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  executingText: {
    fontSize: 14,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  resultContainer: {
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.success || Colors.primary,
    fontWeight: 'bold',
    marginBottom: 5,
    padding: 1,
  },
  resultText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: Colors.gray100,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorLabel: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: 'bold',
    marginBottom: 5,
    padding: 1,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  toolCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  toolButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.gray300,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
  },
});

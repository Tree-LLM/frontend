import React, { useState } from 'react';
import FeedbackPanel from '../components/FeedbackPanel';

type ChatMessage = { sender: 'user' | 'ai'; message: string };

const ChatPage = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const handleSendMessage = (msg: string) => {
    console.log('[사용자 입력]', msg); // ← 확인용 로그
    setChatHistory(prev => [...prev, { sender: 'user', message: msg }]);
    setChatInput('');

    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'ai', message: 'AI 응답 예시입니다.' }]);
    }, 800);
  };

  return (
    <FeedbackPanel
      chatHistory={chatHistory}
      chatInput={chatInput}
      onChatInputChange={handleChatInputChange}
      onSendMessage={handleSendMessage}
    />
  );
};

export default ChatPage;

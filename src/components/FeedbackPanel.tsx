import React from 'react';

type ChatMessage = { sender: 'user' | 'ai'; message: string };

export interface FeedbackPanelProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  onChatInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (msg: string) => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  chatHistory,
  chatInput,
  onChatInputChange,
  onSendMessage,
}) => {
  return (
    <div className="w-full h-full bg-gray-100 flex flex-col flex-1 min-h-0 px-4 py-3">
      {/* 헤더 */}
      <div className="mb-3">
        <h2 className="text-3xl font-bold text-gray-800">AI Chat</h2>
      </div>

      {/* 채팅 박스 */}
      <div className="flex flex-col flex-1 min-h-0 bg-white rounded-lg shadow px-4 py-3 overflow-hidden">
        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[75%] px-4 py-2 rounded-lg text-lg break-words whitespace-pre-wrap
                ${msg.sender === 'user'
                  ? 'bg-gray-200 text-black ml-auto'
                  : 'bg-blue-100 text-black mr-auto'}
              `}
            >
              {msg.message?.trim()
                ? msg.message
                : <span className="italic text-sm text-gray-500">(빈 메시지)</span>}
            </div>
          ))}
        </div>

        {/* 입력창과 전송 버튼 */}
        <div className="flex gap-2 pt-3 shrink-0 overflow-x-auto whitespace-nowrap max-w-full">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded border text-lg bg-gray-100 text-black min-w-[200px]"
            value={chatInput}
            onChange={onChatInputChange}
            placeholder="Type your question here..."
          />
          <button
            onClick={() => {
              if (chatInput.trim()) onSendMessage(chatInput);
            }}
            className="px-4 py-2 bg-green-600 text-white text-lg rounded hover:bg-green-700"
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPanel;
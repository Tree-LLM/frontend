import { useRef, useState } from 'react';
import Header from '../components/Header';
import FileSidebar from '../components/FileSidebar';
import EditorPanel from '../components/EditorPanel';
import FeedbackPanel from '../components/FeedbackPanel';

type ChatMessage = { sender: 'user' | 'ai'; message: string };
type UploadedFile = { name: string; content: string };

function EditorPage() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleSelectFile = (filename: string) => {
    const file = files.find((f) => f.name === filename);
    if (file) {
      setSelectedFile(file.name);
      setFileContent(file.content);
    }
  };

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.max(120, Math.min(e.clientX, 500));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleUpload = (file: File) => {
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();

    // 중복 업로드 방지
    const alreadyExists = files.some((f) => f.name === fileName);
    if (alreadyExists) {
      alert(`이미 업로드된 파일입니다: ${fileName}`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      let content = reader.result?.toString() || '';

      if (ext === 'pdf') {
        content = `[PDF 파일: ${fileName}] 미리보기는 아직 지원되지 않습니다.`;
      }

      const newFile = { name: fileName, content };
      setFiles((prev) => [...prev, newFile]);
      setSelectedFile(fileName);
      setFileContent(content);
    };

    if (ext === 'md' || ext === 'txt' || ext === 'json') {
      reader.readAsText(file);
    } else {
      const dummy = `[미리보기가 지원되지 않는 파일입니다: ${fileName}]`;
      const newFile = { name: fileName, content: dummy };
      setFiles((prev) => [...prev, newFile]);
      setSelectedFile(fileName);
      setFileContent(dummy);
    }

    alert(`Uploaded: ${fileName}`);
  };

  const handleSendMessage = (msg: string) => {
    setChatHistory([...chatHistory, { sender: 'user', message: msg }]);
    setChatInput('');
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', message: 'AI 응답 예시입니다.' },
      ]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onClickGenerate={() => alert('수정 제안')} />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div
            style={{ width: sidebarWidth }}
            className="bg-gray-100 p-4 overflow-y-auto flex-shrink-0"
          >
            <FileSidebar
              files={files.map((f) => f.name)}
              selected={selectedFile}
              onSelect={handleSelectFile}
              onUpload={handleUpload}
            />
          </div>
        )}

        {showSidebar && (
          <div
            className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize"
            onMouseDown={handleMouseDown}
          />
        )}

        <div className="flex flex-col justify-center">
          <button
            className="w-5 h-full bg-gray-200 hover:bg-gray-300 text-sm font-bold border-none"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? '<' : '>'}
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-white">
          <EditorPanel title={selectedFile} content={fileContent} />
        </div>

        <div className="flex flex-col justify-center">
          <button
            className="w-5 h-full bg-gray-200 hover:bg-gray-300 text-sm font-bold border-none"
            onClick={() => setShowFeedback(!showFeedback)}
          >
            {showFeedback ? '>' : '<'}
          </button>
        </div>

        {showFeedback && (
          <div className="w-1/5 h-full flex flex-col bg-gray-100 p-4">
            <FeedbackPanel
              chatHistory={chatHistory}
              chatInput={chatInput}
              onChatInputChange={(e) => setChatInput(e.target.value)}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorPage;

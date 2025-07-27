import { useRef, useState } from 'react';
import Header from '../components/Header';
import FileSidebar from '../components/FileSidebar';
import EditorPanel from '../components/EditorPanel';
import FeedbackPanel from '../components/FeedbackPanel';
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromPdf } from '@/lib/extractTextFromPdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

  const handleDeleteFile = (filename: string) => {
    const updatedFiles = files.filter(f => f.name !== filename);
    setFiles(updatedFiles);

    if (selectedFile === filename) {
      if (updatedFiles.length > 0) {
        const fallback = updatedFiles[0];
        setSelectedFile(fallback.name);
        setFileContent(fallback.content);
      } else {
        setSelectedFile('');
        setFileContent('');
      }
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

  const alreadyExists = files.some((f) => f.name === fileName);
  if (alreadyExists) {
    alert(`이미 업로드된 파일입니다: ${fileName}`);
    return;
  }

  // ✅ PDF 처리
  if (ext === 'pdf') {
    extractTextFromPdf(file).then((extractedText) => {
      const newFile = { name: fileName, content: extractedText };
      setFiles((prev) => [...prev, newFile]);
      setSelectedFile(fileName);
      setFileContent(extractedText);
      alert(`Uploaded: ${fileName}`);
    }).catch((error) => {
      console.error('PDF 추출 오류:', error);
      alert(`PDF 처리 중 오류 발생: ${fileName}`);
    });
    return;
  }

  // ✅ 텍스트 파일 처리
  const reader = new FileReader();
  reader.onload = () => {
    let content = reader.result?.toString() || '';
    const newFile = { name: fileName, content };
    setFiles((prev) => [...prev, newFile]);
    setSelectedFile(fileName);
    setFileContent(content);
    alert(`Uploaded: ${fileName}`);
  };

  if (ext === 'md' || ext === 'txt' || ext === 'json') {
    reader.readAsText(file);
  } else {
    // ✅ 미리보기 불가한 파일
    const dummy = `[미리보기가 지원되지 않는 파일입니다: ${fileName}]`;
    const newFile = { name: fileName, content: dummy };
    setFiles((prev) => [...prev, newFile]);
    setSelectedFile(fileName);
    setFileContent(dummy);
    alert(`Uploaded: ${fileName}`);
  }
};


  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', message: chatInput.trim() };
    const aiMsg: ChatMessage = {
      sender: 'ai',
      message: 'AI 응답 예시입니다. 실제 연동 필요.',
    };

    setChatHistory((prev) => [...prev, userMsg, aiMsg]);
    setChatInput('');
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
              onDelete={handleDeleteFile}
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

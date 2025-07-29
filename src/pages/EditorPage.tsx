import { useRef, useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import FileSidebar from '../components/FileSidebar';
import Viewer from '../components/Viewer';
import FeedbackPanel from '../components/FeedbackPanel';
import { extractTextFromPdf } from '@/lib/extractTextFromPdf';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ChatMessage = { sender: 'user' | 'ai'; message: string };
type UploadedFile = { name: string; content: string };

function EditorPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedTree, setSelectedTree] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);
  const [savedContent, setSavedContent] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isModifying, setIsModifying] = useState<boolean>(false); // ✅

  const handleSaveEditedContent = (newText: string) => {
    setFileContent(newText);
    setSavedContent(newText);
    setFiles((prev) =>
      prev.map((f) =>
        f.name === selectedFile ? { ...f, content: newText } : f
      )
    );
  };

  const handleUndoEditedContent = () => {
    if (savedContent) {
      setFileContent(savedContent);
    } else {
      alert('되돌릴 저장본이 없습니다.');
    }
  };

  const handleGenerate = async () => {
    setIsModifying(true); // ✅ 로딩 시작
    await new Promise((resolve) => setTimeout(resolve, 2000)); // ✅ (테스트용 대기)
    setIsModifying(false); // ✅ 로딩 종료
  };

  const handleDeleteTree = (filename: string) => {
    setSelectedTree(prev => (prev === filename ? '' : prev));
    setFiles(prev => prev.filter(f => f.name !== filename));
  };

  const handleSelectFile = (filename: string) => {
    const file = files.find(f => f.name === filename);
    if (file) {
      setSelectedFile(file.name);
      setFileContent(file.content);
    }
  };

  const handleSelectTree = (filename: string) => {
    setSelectedTree(filename);
    const file = files.find(f => f.name === filename);
    if (file) {
      setFileContent(file.content);
    }
  };

  const handleUpload = (file: File) => {
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const alreadyExists = files.some((f) => f.name === fileName);
    if (alreadyExists) {
      alert(`이미 업로드된 파일입니다: ${fileName}`);
      return;
    }

    if (ext === 'pdf') {
      extractTextFromPdf(file).then((extractedText) => {
        const newFile = { name: fileName, content: extractedText };
        setFiles((prev) => [...prev, newFile]);
        setSelectedFile(fileName);
        setFileContent(extractedText);
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result?.toString() || '';
        const newFile = { name: fileName, content };
        setFiles((prev) => [...prev, newFile]);
        setSelectedFile(fileName);
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteFile = (filename: string) => {
    const updated = files.filter((f) => f.name !== filename);
    setFiles(updated);
    if (selectedFile === filename) {
      setSelectedFile(updated[0]?.name || '');
      setFileContent(updated[0]?.content || '');
    }
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    const exists = files.some(f => f.name === newName);
    if (exists) {
      alert(`이미 존재하는 이름입니다: ${newName}`);
      return;
    }

    setFiles(prev =>
      prev.map(f =>
        f.name === oldName ? { ...f, name: newName } : f
      )
    );

    if (selectedFile === oldName) setSelectedFile(newName);
    if (selectedTree === oldName) setSelectedTree(newName);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { sender: 'user', message: chatInput.trim() };
    const aiMsg: ChatMessage = { sender: 'ai', message: 'AI 응답 예시입니다.' };
    setChatHistory((prev) => [...prev, userMsg, aiMsg]);
    setChatInput('');
  };

  const selectedFileObj = files.find(f => f.name === selectedFile);
  const blobUrl = useMemo(() => {
    if (!selectedFileObj) return '';
    const blob = new Blob([selectedFileObj.content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  }, [selectedFileObj]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const treeFiles = useMemo(() => {
    return files.filter((f) => f.name.toLowerCase().endsWith('.tree.json'));
  }, [files]);

  const handleAddTestFile = () => {
    const testContent = `# 제목1\n내용\n## 소제목1\n내용`;
    const testName = 'test.md';
    const alreadyExists = files.some(f => f.name === testName);
    if (alreadyExists) {
      alert('이미 test.md 파일이 존재합니다.');
      return;
    }
    const newFile = { name: testName, content: testContent };
    setFiles(prev => [...prev, newFile]);
    setSelectedFile(testName);
    setFileContent(testContent);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        onClickGenerate={handleGenerate} // ✅ alert 제거하고 로딩 함수 연결
        currentFileUrl={blobUrl}
        currentFileName={selectedFile}
      />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div
            style={{ width: sidebarWidth }}
            className="bg-gray-100 p-4 overflow-y-auto flex-shrink-0"
          >
            <FileSidebar
              files={files.map(f => f.name)}
              treeFiles={treeFiles.map(f => f.name)}
              selected={selectedFile}
              selectedTree={selectedTree}
              onSelect={handleSelectFile}
              onUpload={handleUpload}
              onDelete={handleDeleteFile}
              onDeleteTree={handleDeleteTree}
              onSelectTree={handleSelectTree}
              onRenameFile={handleRenameFile}
              onAddTestFile={handleAddTestFile}
            />
          </div>
        )}

        {showSidebar && (
          <div
            className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize"
            onMouseDown={() => {
              isResizing.current = true;
            }}
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
          <Viewer
            title={selectedTree || selectedFile}
            content={fileContent}
            onSave={handleSaveEditedContent}
            onUndo={handleUndoEditedContent}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
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

      {/* ✅ 로딩 화면 오버레이 */}
      {isModifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Generating suggestions...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorPage;

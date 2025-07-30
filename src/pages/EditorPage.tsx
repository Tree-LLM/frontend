import { useRef, useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import FileSidebar from '../components/FileSidebar';
import EditorPanel from '../components/EditorPanel';
import FeedbackPanel from '../components/FeedbackPanel';
import { extractTextFromPdf } from '@/lib/extractTextFromPdf';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
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
  const [pipelineOutput, setPipelineOutput] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleUpload = async (file: File) => {
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const alreadyExists = files.some((f) => f.name === fileName);
    if (alreadyExists) {
      alert(`이미 업로드된 파일입니다: ${fileName}`);
      return;
    }

    if (ext === 'pdf') {
      const extractedText = await extractTextFromPdf(file);
      addFile(fileName, extractedText);
    } else {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = reader.result?.toString() || '';
        addFile(fileName, content);
      };
      reader.readAsText(file);
    }

    // Flask 업로드 API 호출
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("파일 업로드 성공:", response.data.file_path);
      setUploadedFilePath(response.data.file_path);
    } catch (error) {
      console.error("파일 업로드 실패", error);
    }
  };

  const addFile = (fileName: string, content: string) => {
    const newFile = { name: fileName, content };
    setFiles((prev) => [...prev, newFile]);
    setSelectedFile(fileName);
    setFileContent(content);
  };

  const handleRunPipeline = () => {
    if (!uploadedFilePath) {
      alert("파일을 업로드한 후 실행하세요.");
      return;
    }

    setPipelineOutput("✅ 파이프라인 실행 중...");
    setChatHistory(prev => [...prev, { sender: "ai", message: "🚀 파이프라인 시작..." }]);

    const eventSource = new EventSource(`http://127.0.0.1:5000/run_pipeline?file_path=${encodeURIComponent(uploadedFilePath)}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE 업데이트:", data);

        // 단계별 로그 추가
        if (data.step && data.name) {
          setChatHistory(prev => [...prev, { sender: "ai", message: ` [${data.step}] ${data.name}` }]);
        }

        //  Editor에 단계별 결과 append
        if (data.content) {
          setFileContent(prev => prev + "\n\n" + data.content);
        }

        //  최종 결과 처리
        if (data.step === 8 || data.final) {
          setPipelineOutput("✅ 파이프라인 완료");
          setChatHistory(prev => [...prev, { sender: "ai", message: "🎯 최종 결과가 생성되었습니다." }]);
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE 데이터 처리 오류:", err);
      }
    };

    eventSource.onerror = () => {
      setChatHistory(prev => [...prev, { sender: "ai", message: "❌ SSE 연결 오류" }]);
      eventSource.close();
    };
  };

  // ✅ Cleanup: 컴포넌트 언마운트 시 EventSource 닫기
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header onClickGenerate={handleRunPipeline} currentFileUrl="" currentFileName={selectedFile} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div style={{ width: sidebarWidth }} className="bg-gray-100 p-4 overflow-y-auto flex-shrink-0">
            <FileSidebar
              files={files.map(f => f.name)}
              treeFiles={[]} selected={selectedFile} selectedTree=""
              onSelect={() => {}} onUpload={handleUpload} onDelete={() => {}} onDeleteTree={() => {}} onSelectTree={() => {}} onRenameFile={() => {}}
            />
          </div>
        )}

        <div className="flex-1 p-4 overflow-y-auto bg-white">
          <EditorPanel title={selectedFile} content={fileContent} />
        </div>

        {showFeedback && (
          <div className="w-1/5 h-full flex flex-col bg-gray-100 p-4">
            <FeedbackPanel
              chatHistory={chatHistory}
              chatInput={chatInput}
              onChatInputChange={(e) => setChatInput(e.target.value)}
              onSendMessage={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorPage;

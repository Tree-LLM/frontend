import { useRef, useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import FileSidebar from '../components/FileSidebar';
import Viewer from '../components/Viewer';
import FeedbackPanel from '../components/FeedbackPanel';
import { extractTextFromPdf } from '@/lib/extractTextFromPdf';
import { uploadFile, openPipelineStream } from '@/lib/api';
import { makeSectionFileEntries } from '@/lib/sections';

type ChatMessage = { sender: 'user' | 'ai'; message: string };
type UploadedFile = { name: string; content: string };

function EditorPage() {
  // ===== 파일 / 에디터 상태 =====
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');       // 일반 파일 선택
  const [selectedTree, setSelectedTree] = useState<string>('');       // 트리 파일 선택 (*.tree.json)
  const [selectedSection, setSelectedSection] = useState<string>(''); // 섹션 파일 선택 (*.section.txt)

  const [fileContent, setFileContent] = useState<string>(''); // 현재 뷰어에 보이는 내용
  const [savedContent, setSavedContent] = useState<string>(''); // Undo용 저장본
  const [selectedId, setSelectedId] = useState<string>(''); // 뷰어 내 하이라이트 등

  // ===== 사이드바 / 피드백 패널 =====
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);

  // ===== 채팅 =====
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // ===== 파이프라인(SSE) =====
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [backendFilePath, setBackendFilePath] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // ===== 오케스트레이터 제안 텍스트 =====
  const [suggestion, setSuggestion] = useState<string>('');

  // ===== 유틸: 파일 upsert =====
  const upsertFile = (name: string, content: string) => {
    setFiles((prev) => {
      const i = prev.findIndex((f) => f.name === name);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], content };
        return next;
      }
      return [...prev, { name, content }];
    });
  };

  const saveSuggestionFile = (text: string) => {
    if (!text) return;
    const base = selectedFile || 'untitled.txt';
    const baseName = base.replace(/\.[^/.]+$/, '');
    const name = `${baseName}.suggestion.txt`;
    upsertFile(name, text);
  };

  const saveTreeFileIfJson = (jsonStr: string | null, obj?: any) => {
    try {
      const data = obj ?? (jsonStr ? JSON.parse(jsonStr) : null);
      if (!data) return;
      const base = selectedFile || 'untitled.txt';
      const baseName = base.replace(/\.[^/.]+$/, '');
      const name = `${baseName}.tree.json`;
      upsertFile(name, JSON.stringify(data, null, 2));
      setSelectedTree(name);
    } catch {
      /* ignore JSON parse error */
    }
  };

  // ===== 파일 편집 저장/되돌리기 =====
  const handleSaveEditedContent = (newText: string) => {
    setFileContent(newText);
    setSavedContent(newText);
    setFiles((prev) =>
      prev.map((f) =>
        f.name === selectedSection || f.name === selectedTree || f.name === selectedFile
          ? { ...f, content: newText }
          : f
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

  // ===== 파이프라인 실행(SSE) =====
  const handleGenerate = () => {
    if (!backendFilePath) {
      alert('먼저 파일을 업로드하여 서버 경로(file_path)를 받아오세요.');
      return;
    }
    // 기존 스트림 정리
    esRef.current?.close();

    setIsModifying(true);
    setChatHistory((prev) => [
      ...prev,
      { sender: 'ai', message: '🚀 파이프라인을 시작합니다.' },
    ]);

    const es = openPipelineStream(backendFilePath);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data); // { step, name, content }
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'ai',
            message: `[${msg.step}] ${msg.name}\n${(msg.content || '').slice(0, 2000)}`,
          },
        ]);

        const name = String(msg?.name || '');

        // ✅ Suggestion 단계 반영
        if (
          /audit/i.test(name) ||
          /global.?check/i.test(name) ||
          /editpass2/i.test(name) ||
          /suggest/i.test(name)
        ) {
          const s = msg.content || '';
          setSuggestion(s);
          saveSuggestionFile(s);
        }

        // ✅ 트리 JSON 자동 파일화
        if (/split|build|fuse|tree/i.test(name) && typeof msg.content === 'string') {
          saveTreeFileIfJson(msg.content);
        }

        // ⛔ Final 단계: 결과 수집만
        if (msg.step === 8 || /finalize/i.test(name)) {
          fetch(`/api/results?file_path=${encodeURIComponent(backendFilePath!)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data?.suggestion) {
                setSuggestion(data.suggestion);
                saveSuggestionFile(data.suggestion);
              }
              if (data?.tree) {
                saveTreeFileIfJson(null, data.tree);
              }
            })
            .catch((e) => console.error('결과 수집 실패:', e))
            .finally(() => {
              setIsModifying(false);
              es.close();
            });
          return;
        }
      } catch {
        // JSON이 아니면 원문 그대로 출력
        setChatHistory((prev) => [...prev, { sender: 'ai', message: ev.data }]);
      }
    };

    es.onerror = () => {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', message: '⚠️ 스트림이 종료되었습니다.' },
      ]);
      setIsModifying(false);
      es.close();
    };
  };

  // ===== 파일 목록 조작 =====
  const handleDeleteTree = (filename: string) => {
    setSelectedTree((prev) => (prev === filename ? '' : prev));
    setFiles((prev) => prev.filter((f) => f.name !== filename));
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
    const exists = files.some((f) => f.name === newName);
    if (exists) {
      alert(`이미 존재하는 이름입니다: ${newName}`);
      return;
    }

    setFiles((prev) => prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f)));

    if (selectedFile === oldName) setSelectedFile(newName);
    if (selectedTree === oldName) setSelectedTree(newName);
    if (selectedSection === oldName) setSelectedSection(newName);
  };

  // ===== 선택 액션 =====
  const handleSelectFile = (filename: string) => {
    const file = files.find((f) => f.name === filename);
    if (file) {
      setSelectedFile(file.name);
      setSelectedTree('');
      setSelectedSection('');
      setFileContent(file.content);
    }
  };

  const handleSelectTree = (filename: string) => {
    setSelectedTree(filename);
    setSelectedFile('');
    setSelectedSection('');
    const file = files.find((f) => f.name === filename);
    if (file) {
      setFileContent(file.content);
    }
  };

  const handleSelectSection = (filename: string) => {
    setSelectedSection(filename);
    setSelectedTree('');
    setSelectedFile('');
    const file = files.find((f) => f.name === filename);
    if (file) setFileContent(file.content);
  };

  const handleDeleteSection = (filename: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== filename));
    if (selectedSection === filename) {
      const next = files.filter((f) => f.name !== filename && f.name.endsWith('.section.txt'));
      setSelectedSection(next[0]?.name || '');
      setFileContent(next[0]?.content || '');
    }
  };

  // ===== 업로드: 화면 + 서버 업로드 + 섹션 분해 =====
  // ===== 업로드: 화면 + 서버 업로드 + 섹션 분해 =====
const handleUpload = (file: File) => {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (files.some((f) => f.name === fileName)) {
    alert(`이미 업로드된 파일입니다: ${fileName}`);
    return;
  }

  // 0) 업로드 즉시 자리표시자 추가 → 목록에 무조건 뜨게
  const placeholderContent = '(loading…)';
  setFiles((prev) => [...prev, { name: fileName, content: placeholderContent }]);
  setSelectedFile(fileName);
  setSelectedSection('');
  setSelectedTree('');
  setFileContent(placeholderContent);

  const baseName = fileName.replace(/\.[^/.]+$/, '');

  // 1) 텍스트 추출 로직 (성공/실패 모두 처리)
  const finalize = (content: string) => {
    // 원본 파일 업데이트
    setFiles((prev) =>
      prev.map((f) => (f.name === fileName ? { ...f, content } : f))
    );

    // 섹션 분해
    try {
      const sectionEntries = makeSectionFileEntries(baseName, content); // [{ name, content }]
      if (sectionEntries.length) {
        const sectionFilesUF = sectionEntries.map(({ name, content }) => ({ name, content }));
        setFiles((prev) => [...prev, ...sectionFilesUF]);

        // 첫 섹션 자동 선택
        setSelectedSection(sectionFilesUF[0].name);
        setSelectedFile('');
        setSelectedTree('');
        setFileContent(sectionFilesUF[0].content);
      } else {
        // 섹션이 안 잡히면 원본 유지
        setSelectedFile(fileName);
        setSelectedSection('');
        setSelectedTree('');
        setFileContent(content);
      }
    } catch (e) {
      console.error('[sections] split error:', e);
      setSelectedFile(fileName);
      setSelectedSection('');
      setSelectedTree('');
      setFileContent(content);
    }
  };

  const onExtractError = (e: any) => {
    console.error('[upload] extract failed:', e);
    const fallback =
      ext === 'pdf'
        ? '(PDF 텍스트 추출에 실패했습니다. extractor 구현/의존성을 확인하세요.)'
        : '(파일 읽기에 실패했습니다.)';
    finalize(fallback);
  };

  // 2) 파일 타입별 텍스트 추출
  if (ext === 'pdf') {
    // extractor가 구현되어 있지 않거나 실패해도 finalize로 넘어가도록
    Promise.resolve()
      .then(() => extractTextFromPdf(file))
      .then((txt) => finalize(typeof txt === 'string' ? txt : String(txt ?? '')))
      .catch(onExtractError);
  } else {
    const reader = new FileReader();
    reader.onload = () => finalize(reader.result?.toString() || '');
    reader.onerror = onExtractError;
    reader.readAsText(file);
  }

  // 3) 서버 업로드 → SSE용 file_path 확보 (성공/실패와 무관하게 UI는 유지)
  uploadFile(file)
    .then(({ file_path }) => {
      setBackendFilePath(file_path);
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', message: `✅ 서버 업로드 완료\nfile_path: ${file_path}` },
      ]);
    })
    .catch((e) => {
      console.error('백엔드 업로드 실패:', e);
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', message: '⚠️ 서버 업로드 실패 (콘솔 로그 참고)' },
      ]);
    });
};

  // ===== 섹션 / 트리 파일 목록 =====
  const treeFiles = useMemo(() => {
    return files.filter((f) => f.name.toLowerCase().endsWith('.tree.json'));
  }, [files]);

  const sectionFiles = useMemo(() => {
    return files.filter((f) => f.name.toLowerCase().endsWith('.section.txt'));
  }, [files]);

  // ===== 선택된 파일의 blob URL (뷰어 다운로드 등) =====
  const selectedFileObj = useMemo(() => {
    if (selectedSection) return files.find((f) => f.name === selectedSection);
    if (selectedTree) return files.find((f) => f.name === selectedTree);
    return files.find((f) => f.name === selectedFile);
  }, [files, selectedFile, selectedTree, selectedSection]);

  const blobUrl = useMemo(() => {
    if (!selectedFileObj) return '';
    const blob = new Blob([selectedFileObj.content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  }, [selectedFileObj]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      esRef.current?.close(); // 페이지 이탈 시 스트림 정리
    };
  }, [blobUrl]);

  // ===== 데모 파일 추가 =====
  const handleAddTestFile = () => {
    const testContent = [
      'Abstract',
      'This is the abstract.',
      '',
      'Introduction',
      'Intro text...',
      '',
      'Related Work',
      'Related text...',
      '',
      'Method',
      'Method text...',
      '',
      'Discussion',
      'Discussion text...',
      '',
      'Conclusion',
      'Conclusion text...',
    ].join('\n');

    const testName = 'test.txt';
    const alreadyExists = files.some((f) => f.name === testName);
    if (alreadyExists) {
      alert('이미 test.txt 파일이 존재합니다.');
      return;
    }

    // 원본 + 섹션 분해
    const baseName = testName.replace(/\.[^/.]+$/, '');
    const sectionEntries = makeSectionFileEntries(baseName, testContent);

    const originalFile: UploadedFile = { name: testName, content: testContent };
    const sectionFilesUF: UploadedFile[] = sectionEntries.map(({ name, content }) => ({
      name,
      content,
    }));

    setFiles((prev) => [...prev, originalFile, ...sectionFilesUF]);

    if (sectionFilesUF.length > 0) {
      setSelectedSection(sectionFilesUF[0].name);
      setSelectedTree('');
      setSelectedFile('');
      setFileContent(sectionFilesUF[0].content);
    } else {
      setSelectedFile(testName);
      setSelectedTree('');
      setSelectedSection('');
      setFileContent(testContent);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        onClickGenerate={handleGenerate}
        currentFileUrl={blobUrl}
        currentFileName={selectedSection || selectedTree || selectedFile}
      />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div
            style={{ width: sidebarWidth }}
            className="bg-gray-100 p-4 overflow-y-auto flex-shrink-0"
          >
            <FileSidebar
              files={files.map((f) => f.name)}
              treeFiles={treeFiles.map((f) => f.name)}
              sectionFiles={sectionFiles.map((f) => f.name)}     // ✅ 섹션 리스트
              selected={selectedFile}
              selectedTree={selectedTree}
              selectedSection={selectedSection}                  // ✅ 현재 선택 섹션
              onSelect={handleSelectFile}
              onUpload={handleUpload}
              onDelete={handleDeleteFile}
              onDeleteTree={handleDeleteTree}
              onSelectTree={handleSelectTree}
              onRenameFile={handleRenameFile}
              onAddTestFile={handleAddTestFile}
              onSelectSection={handleSelectSection}              // ✅ 섹션 선택
              onDeleteSection={handleDeleteSection}              // ✅ 섹션 삭제
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
            title={selectedSection || selectedTree || selectedFile}
            content={fileContent}
            onSave={handleSaveEditedContent}
            onUndo={handleUndoEditedContent}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            suggestion={suggestion} // 제안만 표시
          />
        </div>

        {showFeedback && (
          <div className="w-1/5 h-full flex flex-col bg-gray-100 p-4">
            <FeedbackPanel
              chatHistory={chatHistory}
              chatInput={chatInput}
              onChatInputChange={(e) => setChatInput(e.target.value)}
              onSendMessage={() => {
                if (!chatInput.trim()) return;
                const userMsg: ChatMessage = { sender: 'user', message: chatInput.trim() };
                const aiMsg: ChatMessage = { sender: 'ai', message: 'AI 응답 예시입니다.' };
                setChatHistory((prev) => [...prev, userMsg, aiMsg]);
                setChatInput('');
              }}
            />
          </div>
        )}
      </div>

      {/* 로딩 화면 오버레이 */}
      {isModifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-t-8 border-blue-500 border-solid mx-auto mb-16"></div>
            <p className="text-4xl font-semibold text-gray-700">Generating suggestions...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorPage;

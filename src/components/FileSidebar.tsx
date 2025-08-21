import React, { useRef, useState } from 'react';

type FileSidebarProps = {
  files: string[];
  treeFiles: string[];
  /** 섹션 파일(.section.txt) */
  sectionFiles?: string[];

  selected: string;
  selectedTree: string;
  /** 선택된 섹션 파일명 */
  selectedSection?: string;

  onSelect: (filename: string) => void;
  onUpload: (file: File) => void;
  onDelete: (filename: string) => void;
  onDeleteTree: (filename: string) => void;
  onSelectTree: (filename: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onAddTestFile: () => void;

  /** 섹션 선택/삭제 */
  onSelectSection?: (filename: string) => void;
  onDeleteSection?: (filename: string) => void;
};

const DEFAULT_SECTION_ORDER = [
  'Abstract',
  'Introduction',
  'Related Work',
  'Background',
  'Methods',
  'Experiments',
  'Results',
  'Discussion',
  'Conclusion',
  'Appendix',
];

const SECTION_KEYWORDS: Record<string, string> = {
  abstract: 'Abstract',
  introduction: 'Introduction',
  intro: 'Introduction',
  'related work': 'Related Work',
  related: 'Related Work',
  background: 'Background',
  method: 'Methods',
  methods: 'Methods',
  methodology: 'Methods',
  experiment: 'Experiments',
  experiments: 'Experiments',
  evaluation: 'Evaluation',
  eval: 'Evaluation',
  result: 'Results',
  results: 'Results',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
  conclusions: 'Conclusions',
  limitation: 'Limitations',
  limitations: 'Limitations',
  appendix: 'Appendix',
};

// 파일명에서 섹션 표시용 라벨 추출
function getSectionLabel(file: string): string {
  const base = file.replace(/\.section\.txt$/i, '');
  const lower = base.toLowerCase();

  // 1) 키워드가 포함되어 있으면 해당 섹션명으로
  for (const [k, v] of Object.entries(SECTION_KEYWORDS)) {
    if (lower.includes(k)) return v;
  }

  // 2) 끝부분에 구분자 후 섹션명이 오는 패턴: __Name / --Name / - Name / #Name / @Name
  let m =
    base.match(/(?:__|--|#|@|-\s)([A-Za-z][A-Za-z0-9 _-]{2,})$/) ||
    base.match(/\[(.+?)\]$/); // 예: [Introduction]
  if (m) {
    return m[1].trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  }

  // 3) 숫자 인덱스가 있는 경우: __0 / _1 / -2 등
  m = base.match(/(?:__|_|-)(\d+)\s*$/);
  if (m) {
    const idx = parseInt(m[1], 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < DEFAULT_SECTION_ORDER.length) {
      return DEFAULT_SECTION_ORDER[idx];
    }
  }

  // 4) 아무 패턴도 못 찾으면 원본 파일명
  return file;
}

const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  treeFiles,
  sectionFiles = [],
  selected,
  selectedTree,
  selectedSection,
  onSelect,
  onUpload,
  onDelete,
  onDeleteTree,
  onSelectTree,
  onRenameFile,
  onAddTestFile,
  onSelectSection,
  onDeleteSection,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingFile, setDraggingFile] = useState<string | null>(null);

  // 업로드 input 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[FileSidebar] onChange file:', file?.name);
    if (file) onUpload(file);
    e.target.value = ''; // 같은 파일 재선택 허용
  };

  // 사이드바 "Files"에는 일반 파일만 표시 (Tree/Section 제외)
  const normalFiles = files.filter(
    (name) => !treeFiles.includes(name) && !sectionFiles.includes(name)
  );

  const handleDropToTree = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    if (draggingFile && !draggingFile.endsWith('.tree.json')) {
      onRenameFile(draggingFile, draggingFile + '.tree.json');
    }
    setDraggingFile(null);
  };

  const handleDropToFiles = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    if (
      draggingFile &&
      (draggingFile.endsWith('.tree.json') || draggingFile.endsWith('.section.txt'))
    ) {
      const renamed =
        draggingFile.replace(/\.tree\.json$|\.section\.txt$/i, '') + '.txt';
      onRenameFile(draggingFile, renamed);
    }
    setDraggingFile(null);
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col px-4 py-3 min-h-0">
      {/* 헤더 */}
      <div className="mb-3">
        <h2 className="text-3xl font-bold text-gray-800">Files</h2>
      </div>

      {/* 파일 업로드 */}
      <div className="mb-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md"
          className="hidden"
        />
        <button
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.value = '';
            fileInputRef.current?.click();
          }}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full text-2xl"
        >
          File Upload
        </button>
      </div>

      {/* 직접 파일 추가 */}
      <div className="mb-4">
        <button
          onClick={onAddTestFile}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full text-2xl"
        >
          Make File
        </button>
      </div>

      {/* 일반 파일 목록 (Files) */}
      <ul
        className="space-y-1 h-[180px] overflow-y-auto border border-dashed border-gray-300 p-2 rounded"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropToFiles}
      >
        {normalFiles.map((file) => (
          <li
            key={file}
            className="flex items-center justify-between group"
            draggable
            onDragStart={() => {
              setDraggingFile(file);
            }}
            onDragEnd={() => setDraggingFile(null)}
          >
            <button
              onClick={() => onSelect(file)}
              className={`flex-1 text-left px-3 py-2 rounded text-lg truncate transition-colors ${
                file === selected
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'hover:bg-gray-200 text-gray-800'
              }`}
              title={file}
            >
              {file}
            </button>
            <button
              onClick={() => onDelete(file)}
              className="ml-2 px-2 text-red-500 hover:text-red-700 font-bold invisible group-hover:visible"
              title="삭제"
            >
              ✕
            </button>
          </li>
        ))}
        {normalFiles.length === 0 && (
          <li className="text-sm text-gray-500">No files</li>
        )}
      </ul>

      {/* Sections 목록 */}
      <div className="mt-5">
        <h2 className="text-3xl font-bold text-gray-800">Sections</h2>
        <ul
          className="space-y-1 h-[400px] overflow-y-auto border border-dashed border-amber-400 p-2 rounded bg-amber-50 mt-3"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
        >
          {sectionFiles.map((file) => (
            <li
              key={file}
              className="flex items-center justify-between group"
              draggable
              onDragStart={() => {
                setDraggingFile(file);
              }}
              onDragEnd={() => setDraggingFile(null)}
            >
              <button
                onClick={() => onSelectSection?.(file)}
                className={`flex-1 text-left px-3 py-2 rounded text-lg truncate transition-colors ${
                  file === selectedSection
                    ? 'bg-amber-200 text-amber-900 font-semibold'
                    : 'hover:bg-gray-200 text-gray-800'
                }`}
                title={file}
              >
                {getSectionLabel(file)}
              </button>
              <button
                onClick={() => onDeleteSection?.(file)}
                className="ml-2 px-2 text-red-500 hover:text-red-700 font-bold invisible group-hover:visible"
                title="삭제"
              >
                ✕
              </button>
            </li>
          ))}
          {sectionFiles.length === 0 && (
            <li className="text-sm text-gray-500">No sections (upload a paper)</li>
          )}
        </ul>
      </div>

      {/* Tree 목록 */}
      <div className="mt-5">
        <h2 className="text-3xl font-bold text-gray-800">Tree</h2>
        <ul
          className="space-y-2 h-[180px] overflow-y-auto border border-dashed border-purple-400 p-3 rounded bg-purple-50 mt-3"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDropToTree}
        >
          {treeFiles.map((file) => (
            <li
              key={file}
              className="flex items-center justify-between group"
              draggable
              onDragStart={() => {
                setDraggingFile(file);
              }}
              onDragEnd={() => setDraggingFile(null)}
            >
              <button
                onClick={() => onSelectTree(file)}
                className={`flex-1 text-left px-3 py-2 rounded text-lg truncate transition-colors ${
                  file === selectedTree
                    ? 'bg-purple-200 text-purple-800 font-semibold'
                    : 'hover:bg-gray-200 text-gray-800'
                }`}
                title={file}
              >
                {file}
              </button>
              <button
                onClick={() => onDeleteTree(file)}
                className="ml-2 px-2 text-red-500 hover:text-red-700 font-bold invisible group-hover:visible"
                title="삭제"
              >
                ✕
              </button>
            </li>
          ))}
          {treeFiles.length === 0 && (
            <li className="text-sm text-gray-500">No tree files</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FileSidebar;

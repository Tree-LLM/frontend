import React, { useRef, useState } from 'react';

type FileSidebarProps = {
  files: string[];
  treeFiles: string[];
  selected: string;
  selectedTree: string;
  onSelect: (filename: string) => void;
  onUpload: (file: File) => void;
  onDelete: (filename: string) => void;
  onDeleteTree: (filename: string) => void;
  onSelectTree: (filename: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onAddTestFile: () => void; // ✅ 추가
};

const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  treeFiles,
  selected,
  selectedTree,
  onSelect,
  onUpload,
  onDelete,
  onDeleteTree,
  onSelectTree,
  onRenameFile,
  onAddTestFile, // ✅ 추가
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingFile, setDraggingFile] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const normalFiles = files.filter(name => !treeFiles.includes(name));

  const handleDropToTree = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    if (draggingFile && !draggingFile.endsWith('.tree.json')) {
      onRenameFile(draggingFile, draggingFile + '.tree.json');
    }
    setDraggingFile(null);
  };

  const handleDropToFiles = (e: React.DragEvent<HTMLUListElement>) => {
    e.preventDefault();
    if (draggingFile && draggingFile.endsWith('.tree.json')) {
      onRenameFile(draggingFile, draggingFile.replace(/\.tree\.json$/, '.json'));
    }
    setDraggingFile(null);
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col px-4 py-3">
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
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full text-lg"
        >
          File Upload
        </button>
      </div>

      {/* 직접 파일 추가 */}
      <div className="mb-4">
        <button
          onClick={onAddTestFile}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full text-lg"
        >
          Make File
        </button>
      </div>

      {/* 일반 파일 목록 */}
      <ul
        className="space-y-1 overflow-y-auto flex-1 min-h-[100px] border border-dashed border-gray-300 p-2 rounded"
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
            onDragStart={(e) => {
              setDraggingFile(file);
              e.dataTransfer.effectAllowed = 'move';
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
      </ul>

      {/* Tree 파일 목록 */}
      <div className="mt-4">
        <h2 className="text-3xl font-bold text-gray-800">Tree</h2>
        <ul
          className="space-y-1 max-h-40 overflow-y-auto border border-dashed border-purple-400 p-2 rounded min-h-[100px] bg-purple-50"
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
              onDragStart={(e) => {
                setDraggingFile(file);
                e.dataTransfer.effectAllowed = 'move';
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
        </ul>
      </div>
    </div>
  );
};

export default FileSidebar;

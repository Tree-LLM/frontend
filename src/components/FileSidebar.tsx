import React, { useRef } from 'react';

type FileSidebarProps = {
  files: string[];
  selected: string;
  onSelect: (filename: string) => void;
  onUpload: (file: File) => void; 
  onDelete: (filename: string) => void;  // ✅ 추가됨
};

const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  selected,
  onSelect,
  onUpload,
  onDelete,  // ✅ 추가됨
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = ''; // 같은 파일 두 번 선택 방지
    }
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col px-4 py-3">
      {/* 헤더 */}
      <div className="mb-3">
        <h2 className="text-3xl font-bold text-gray-800">Files</h2>
      </div>

      {/* 파일 업로드 */}
      <div className="mb-3">
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

      {/* 파일 목록 */}
      <ul className="space-y-1 overflow-y-auto flex-1 min-h-0">
        {files.map((file) => (
          <li key={file} className="flex items-center justify-between group">
            <button
              onClick={() => onSelect(file)}
              className={`flex-1 text-left px-3 py-2 rounded text-lg truncate transition-colors
                ${file === selected
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'hover:bg-gray-200 text-gray-800'}
              `}
              title={file}
            >
              {file}
            </button>

            {/* 삭제 버튼 */}
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
    </div>
  );
};

export default FileSidebar;

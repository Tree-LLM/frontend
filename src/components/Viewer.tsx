import { useMemo, useState, useEffect } from 'react';
import EditorPanel from './EditorPanel';
import ContentsTree from './ContentsTree';
import { parseHeadings } from '../lib/parseHeadings';

interface ViewerProps {
  title: string;
  content: string;
}

export default function Viewer({ title, content }: ViewerProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const headings = useMemo(() => parseHeadings(content), [content]);

  // 클릭 시 스크롤 + 선택 표시
  const handleSelect = (id: string) => {
    setSelectedId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 Tree */}
      <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
        <ContentsTree headings={headings} onSelect={handleSelect} selectedId={selectedId} />
      </div>

      {/* 우측 Editor */}
      <div className="w-3/4 overflow-y-auto">
        <EditorPanel
          title={title}
          content={content}
          headings={headings}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}

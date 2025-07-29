import { useState, useEffect, useRef } from 'react';
import ContentsTree from './ContentsTree';
import { parseHeadings } from '../lib/parseHeadings';
import type { HeadingItem } from '../lib/parseHeadings';

interface Props {
  title: string;
  content: string;
  onSave: (newText: string) => void;
  onUndo: () => void;
}

export default function Viewer({ title, content, onSave, onUndo }: Props) {
  const [text, setText] = useState(content);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [suggestion, setSuggestion] = useState<string>(''); // Suggestion 추가

  useEffect(() => {
    setText(content);
  }, [content]);

  useEffect(() => {
    setHeadings(parseHeadings(text));
  }, [text]);

  useEffect(() => {
    updateEditorHTML(content);
  }, [content]);

  const updateEditorHTML = (htmlText: string) => {
    if (editorRef.current) {
      const html = htmlText
        .split('\n')
        .map((line, i) => {
          const id = `heading-${i}`;
          return `<p id="${id}" style="margin: 0; margin-bottom: 0.5rem; min-height: 1.4em;">${line || '<br>'}</p>`;
        })
        .join('');
      editorRef.current.innerHTML = html;
    }
  };

  const handleSelectHeading = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 문단 강조
    if (editorRef.current) {
      const children = editorRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const p = children[i] as HTMLElement;
        const isSelected = p.id === id;
        p.style.color = isSelected ? '#2563eb' : '';
        p.style.fontWeight = isSelected ? 'bold' : '';
      }
    }

    // Suggestion mock 연결
    const mockSuggestions: { [key: string]: string } = {
      'heading-0': '이 문단은 배경 설명이 부족하므로 연구 동기를 보완하세요.',
      'heading-1': '이 문단은 중복된 정보가 있습니다. 간결하게 정리해보세요.',
      'heading-2': '이 문단은 핵심 메시지가 불명확하니 마지막 문장을 강조하세요.',
    };
    setSuggestion(mockSuggestions[id] || 'No suggestions');
  };

  const handleInputChange = () => {
    if (editorRef.current) {
      const newHTML = editorRef.current.innerHTML;
      setHistory((prev) => [...prev, text]);
      setFuture([]);
      setText(newHTML);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((next) => [text, ...next]);
    setText(previous);
    updateEditorHTML(previous);
    onUndo();
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, text]);
    setText(next);
    updateEditorHTML(next);
  };

  const handleSave = () => {
    onSave(text);
  };

  return (
    <div className="flex h-full">
      {/* 왼쪽 Contents Tree + Suggestion */}
      <div className="text-xl w-1/4 border-r border-gray-300 p-4 overflow-y-auto">
        <ContentsTree
          headings={headings}
          onSelect={handleSelectHeading}
          selectedId={selectedId}
        />

        {/* Suggestion 박스 왼쪽에 표시 */}
        <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300 text-m text-gray-800">
          <div className="font-semibold mb-1">Suggestion</div>
          <div>{suggestion}</div>
        </div>

        {/* Undo / Redo */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUndo}
            className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            ⤺ Undo
          </button>
          <button
            onClick={handleRedo}
            className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            ⤻ Redo
          </button>
        </div>

        {/* Save 버튼 */}
        <button
          onClick={handleSave}
          className="w-full mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      {/* 오른쪽 에디터 */}
      <div className="w-3/4 text-xl">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInputChange}
          className="p-6 h-full overflow-y-auto outline-none"
          style={{ lineHeight: '1.6', whiteSpace: 'normal' }}
        />
      </div>
    </div>
  );
}

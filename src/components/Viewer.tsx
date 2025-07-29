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

  // 외부 content가 바뀌었을 때 초기화
  useEffect(() => {
    setText(content);
  }, [content]);

  // text가 바뀌면 heading도 갱신
  useEffect(() => {
    setHeadings(parseHeadings(text));
  }, [text]);

  // 최초 렌더링 시 HTML 생성
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

    if (editorRef.current) {
      const children = editorRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const p = children[i] as HTMLElement;
        const isSelected = p.id === id;
        if (isSelected) {
          p.style.color = '#2563eb';
          p.style.fontWeight = 'bold';
        } else {
          p.style.color = '';
          p.style.fontWeight = '';
        }
      }
    }
  };

  const handleInputChange = () => {
    if (editorRef.current) {
      const newHTML = editorRef.current.innerHTML;
      setHistory((prev) => [...prev, text]); // 현재 text를 history에 저장
      setFuture([]); // redo stack 초기화
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
    onUndo(); // 외부 처리
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
      {/* 왼쪽 Contents Tree */}
      <div className="w-1/4 border-r border-gray-300 p-4 overflow-y-auto">
        
        <ContentsTree
          headings={headings}
          onSelect={handleSelectHeading}
          selectedId={selectedId}
        />

        {/* Undo / Redo 버튼 */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUndo}
            className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 flex items-center justify-center"
          >
            ⤺ Undo
          </button>
          <button
            onClick={handleRedo}
            className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 flex items-center justify-center"
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
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInputChange}
        className="w-3/4 p-6 overflow-y-auto outline-none"
        style={{
          lineHeight: '1.6',
          whiteSpace: 'normal',
        }}
      />
    </div>
  );
}

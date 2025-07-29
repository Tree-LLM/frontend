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
  const [suggestion, setSuggestion] = useState<string>('');
  const isComposing = useRef(false);
  const cursorOffset = useRef<number | null>(null);

  useEffect(() => {
    setText(content);
    updateEditorHTML(content);
    setHistory([]);
    setFuture([]);
  }, [content]);

  useEffect(() => {
    setHeadings(parseHeadings(text));
  }, [text]);

  const getCursorOffset = (): number | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editorRef.current!);
    preRange.setEnd(range.endContainer, range.endOffset);
    return preRange.toString().length;
  };

  const setCursorOffset = (offset: number) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    let currentOffset = 0;
    for (const node of editorRef.current.childNodes) {
      const text = node.textContent || '';
      const nextOffset = currentOffset + text.length;
      if (offset <= nextOffset) {
        const innerOffset = offset - currentOffset;
        const range = document.createRange();
        const target = node.firstChild || node;
        range.setStart(target, Math.min(innerOffset, target.textContent?.length ?? 0));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        break;
      }
      currentOffset = nextOffset;
    }
  };

  const updateEditorHTML = (htmlText: string) => {
    if (!editorRef.current) return;
    const offset = cursorOffset.current;
    const html = htmlText
      .split('\n')
      .map((line, i) => {
        const id = `heading-${i}`;
        return `<p id="${id}" style="margin: 0; margin-bottom: 0.5rem; min-height: 1.4em;">${line || '<br>'}</p>`;
      })
      .join('');
    editorRef.current.innerHTML = html;
    if (offset !== null) setCursorOffset(offset);
  };

  const handleInputChange = () => {
    if (editorRef.current) {
      cursorOffset.current = getCursorOffset();
      const newText = Array.from(editorRef.current.children)
        .map((el) => (el as HTMLElement).innerText)
        .join('\n');
      if (newText !== text) {
        setHistory((prev) => [...prev, text]);
        setFuture([]);
        setText(newText);
      }
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    cursorOffset.current = getCursorOffset();
    updateEditorHTML(text);
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
        p.style.color = isSelected ? '#2563eb' : '';
        p.style.fontWeight = isSelected ? 'bold' : '';
      }
    }

    const mockSuggestions: { [key: string]: string } = {
      'heading-0': '이 문단은 배경 설명이 부족하므로 연구 동기를 보완하세요.',
      'heading-1': '이 문단은 중복된 정보가 있습니다. 간결하게 정리해보세요.',
      'heading-2': '이 문단은 핵심 메시지가 불명확하니 마지막 문장을 강조하세요.',
    };
    setSuggestion(mockSuggestions[id] || 'No suggestions');
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const previous = history[history.length - 2];
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
      <div className="text-xl w-1/4 border-r border-gray-300 p-4 overflow-y-auto">
        <ContentsTree
          headings={headings}
          onSelect={handleSelectHeading}
          selectedId={selectedId}
        />
        <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300 text-m text-gray-800">
          <div className="font-semibold mb-1">Suggestion</div>
          <div>{suggestion}</div>
        </div>
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
        <button
          onClick={handleSave}
          className="w-full mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      <div className="w-3/4 text-xl">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="p-6 h-full overflow-y-auto outline-none"
          style={{ lineHeight: '1.6', whiteSpace: 'normal' }}
        />
      </div>
    </div>
  );
}
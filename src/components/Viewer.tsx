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

  // undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  // 오른쪽 제안
  const [suggestion, setSuggestion] = useState<string>('');

  // IME 조합 상태/커서
  const isComposing = useRef(false);
  const cursorOffset = useRef<number | null>(null);

  // 최초 저장을 제목(파일/섹션명) 단위로 1회만 수행
  const initiallySavedForTitle = useRef<string | null>(null);

  // ---------- 유틸: 커서 위치 보존 ----------
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
      const t = node.textContent || '';
      const nextOffset = currentOffset + t.length;
      if (offset <= nextOffset) {
        const innerOffset = offset - currentOffset;
        const range = document.createRange();
        const target = (node as HTMLElement).firstChild || node;
        range.setStart(target, Math.min(innerOffset, target.textContent?.length ?? 0));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        break;
      }
      currentOffset = nextOffset;
    }
  };

  // ---------- 에디터 HTML 갱신 ----------
  const updateEditorHTML = (plainText: string) => {
    if (!editorRef.current) return;
    const offset = cursorOffset.current;

    // 줄 단위로 <p> 생성 (스타일은 컨테이너에서 통일)
    const html = plainText
      .split('\n')
      .map((line, i) => {
        const id = `heading-${i}`;
        // 빈 줄은 <br>을 넣되, CSS/JS로 표시 안 되게 처리
        const body = line ? line : '<br>';
        return `<p id="${id}">${body}</p>`;
      })
      .join('');

    editorRef.current.innerHTML = html;

    // 빈 블록 정리(브라우저가 남기는 <p><br></p> 등)
    cleanupEmptyBlocks();

    if (offset !== null) setCursorOffset(offset);
  };

  // ---------- 빈 블록 정리 ----------
  const cleanupEmptyBlocks = () => {
    if (!editorRef.current) return;
    const root = editorRef.current;
    root.querySelectorAll('p,div').forEach((el) => {
      const text = (el.textContent || '').replace(/\u200B/g, '').trim();
      const onlyBr = el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR';
      if (!text && (onlyBr || !el.innerText.trim())) {
        el.remove();
      }
    });
  };

  // ---------- 입력 처리 ----------
  const handleInputChange = () => {
    if (!editorRef.current) return;
    cursorOffset.current = getCursorOffset();

    cleanupEmptyBlocks();

    const newText = Array.from(editorRef.current.children)
      .map((el) => (el as HTMLElement).innerText)
      .join('\n');

    if (newText !== text) {
      setHistory((prev) => (prev.length ? [...prev, text] : [text])); // 최초 변경 시 현재 스냅샷을 넣어 undo 가능
      setFuture([]);
      setText(newText);
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

  // ---------- 헤딩 파싱 ----------
  useEffect(() => {
    setHeadings(parseHeadings(text));
  }, [text]);

  // ---------- content/title 바뀔 때: 에디터 갱신 + 최초 자동 저장 ----------
  useEffect(() => {
    setText(content);
    updateEditorHTML(content);
    setHistory([content]); // 초기 스냅샷 1개 넣어둠(→ 즉시 Undo 가능)
    setFuture([]);

    // 제목(파일/섹션) 기준으로 최초 1회 자동 저장
    if (initiallySavedForTitle.current !== title) {
      onSave(content); // ✅ 업로드/선택 직후 자동 저장 1회
      initiallySavedForTitle.current = title;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title]);

  // ---------- 목차에서 섹션 선택 ----------
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

    const mockSuggestions: Record<string, string> = {
      'heading-0': '이 문단은 배경 설명이 부족하므로 연구 동기를 보완하세요.',
      'heading-1': '이 문단은 중복된 정보가 있습니다. 간결하게 정리해보세요.',
      'heading-2': '이 문단은 핵심 메시지가 불명확하니 마지막 문장을 강조하세요.',
    };
    setSuggestion(mockSuggestions[id] || 'No suggestions');
  };

  // ---------- Undo/Redo ----------
  const handleUndo = () => {
    // history = [초기스냅샷, ...변경들]
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
      {/* 좌측: 목차/버튼/제안 */}
      <div
      className="
        text-2xl w-1/4 border-r border-gray-300 p-4 overflow-y-auto
        [&_ul]:space-y-2
        [&_li]:py-1
        [&_li]:leading-7
        [&_li>*]:block
      "
    >
        <ContentsTree
          headings={headings}
          onSelect={handleSelectHeading}
          selectedId={selectedId}
        />
        <div className="mt-10 p-3 bg-gray-100 rounded border border-gray-300 text-m text-gray-800">
          <div className="font-semibold mb-1">Suggestion</div>
          <div>{suggestion}</div>
        </div>
        <div className="mt-5 flex space-x-2">
          <button
            onClick={handleUndo}
            className="flex-1 bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
          >
            ⤺ Undo
          </button>
          <button
            onClick={handleRedo}
            className="flex-1 bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
          >
            ⤻ Redo
          </button>
        </div>
        <button
          onClick={handleSave}
          className="w-full mt-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      {/* 우측: 에디터 */}
      <div className="w-3/4 text-3xl">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="
            p-6 h-full overflow-y-auto outline-none
            /* 문단 간 간격은 space-y로 통일, 각 p의 margin은 0 */
            space-y-3
            [&>p]:m-0
            /* 완전히 빈 p 또는 <br>만 있는 p는 표시하지 않음 */
            [&>p:empty]:hidden
            [&>p:has(>br:only-child)]:hidden
          "
          style={{ lineHeight: '1.6', whiteSpace: 'normal' }}
        />
      </div>
    </div>
  );
}

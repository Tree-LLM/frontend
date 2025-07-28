export interface HeadingItem {
  id: string;
  level: number;
  title: string;
}

export function parseHeadings(text: string): HeadingItem[] {
  const lines = text.split('\n');
  const headingRegex = /^(\d+(\.\d+)*\.)?\s*(.+)$/; // 예: 1. Introduction / 1.1 Motivation

  return lines
    .map((line, index) => {
      const trimmed = line.trim();

      // 'Abstract', 'Introduction' 같은 키워드도 포함
      if (/^(Abstract|Introduction|Method|Related Work|Experiment|Conclusion|Introduction)$/i.test(trimmed)) {
        return {
          id: `heading-${index}`,
          level: 1,
          title: trimmed,
        };
      }

      // 숫자 기반 섹션 탐지
      const match = trimmed.match(headingRegex);
      if (match) {
        const numberPart = match[1]; // "1.", "1.2.", 등
        const title = match[3]; // 나머지 제목

        if (numberPart && title) {
          const level = numberPart.split('.').filter(Boolean).length;
          return {
            id: `heading-${index}`,
            level,
            title: title.trim(),
          };
        }
      }

      return null;
    })
    .filter(Boolean) as HeadingItem[];
}

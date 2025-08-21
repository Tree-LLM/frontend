// src/lib/sections.ts
export type SectionKey =
  | "Abstract"
  | "Introduction"
  | "Related Work"
  | "Method"
  | "Experiment"
  | "Discussion"
  | "Conclusion";

const ALIASES: Record<string, SectionKey> = {
  abstract: "Abstract",
  introduction: "Introduction",
  "relatedwork": "Related Work",
  "related work": "Related Work",
  method: "Method",
  methods: "Method",
  methodology: "Method",
  experiment: "Experiment",
  experiments: "Experiment",
  discussion: "Discussion",
  conclusions: "Conclusion",
  conclusion: "Conclusion",
  "resultsanddiscussion": "Discussion",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

const bareHeadingRe =
  /^\s*(Abstract|Introduction|Related\s*Work|Methods?|Methodology|Experiments?|Discussion|Conclusions?)\s*:?\s*$/i;

const numberedHeadingRe =
  /^\s*(\d+(?:\.\d+)*)\s*[\.\)]\s*([A-Za-z][\w\s-]+?)\s*$/;

export function splitIntoSections(raw: string): { title: SectionKey; content: string }[] {
  const lines = raw.split(/\r?\n/);
  const heads: { title: SectionKey; line: number }[] = [];

  lines.forEach((L, i) => {
    const line = L.trim();
    if (!line) return;
    if (/^(contents|table of contents)$/i.test(line)) return;

    let m = line.match(numberedHeadingRe);
    if (m) {
      const canonical = ALIASES[norm(m[2])];
      if (canonical) heads.push({ title: canonical, line: i });
      return;
    }
    m = line.match(bareHeadingRe);
    if (m) {
      const canonical = ALIASES[norm(line)];
      if (canonical) heads.push({ title: canonical, line: i });
    }
  });

  if (!heads.length) return [];

  // 같은 섹션은 첫 등장만 사용
  const seen = new Set<SectionKey>();
  const uniq = heads.filter(h => (seen.has(h.title) ? false : (seen.add(h.title), true)));

  return uniq.map((h, idx) => {
    const start = h.line + 1;
    const end = idx + 1 < uniq.length ? uniq[idx + 1].line : lines.length;
    return { title: h.title, content: lines.slice(start, end).join("\n").trim() };
  }).filter(s => s.content);
}

/** ✅ 섹션을 가상 파일로 변환 (이 함수를 EditorPage가 import합니다) */
export function makeSectionFileEntries(baseName: string, text: string) {
  const secs = splitIntoSections(text);
  return secs.map(s => ({
    name: `${baseName}__${s.title}.section.txt`,
    content: s.content,
  }));
}

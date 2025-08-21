export interface HeadingItem {
  id: string;
  level: number; // 여기서는 모두 1로 고정
  title: string; // Canonical title
}

export function parseHeadings(text: string): HeadingItem[] {
  // 1) 허용 섹션(복수/변형 포함) → 정규화 명칭으로 매핑
  const ALIASES: Record<string, string> = {
    abstract: "Abstract",
    introduction: "Introduction",
    "relatedwork": "Related Work",
    "related work": "Related Work",
    method: "Method",
    methods: "Method",
    methodology: "Method",
    experiment: "Experiment",
    experiments: "Experiment",
    "experimentalsetup": "Experiment",
    discussion: "Discussion",
    "resultsanddiscussion": "Discussion",
    conclusion: "Conclusion",
    conclusions: "Conclusion",
  };

  // 정규화 유틸: 소문자 + 영문/숫자 외 제거 + 공백 축약
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  const lines = text.split(/\r?\n/);

  // 2) 중복 방지 (같은 canonical title 한 번만)
  const seen = new Set<string>();
  const out: HeadingItem[] = [];

  // 3) 정규식
  const bareHeadingRe = /^\s*(Abstract|Introduction|Related\s*Work|Methods?|Methodology|Experiments?|Discussion|Conclusions?)\s*:?\s*$/i;
  const numberedHeadingRe = /^\s*(\d+(?:\.\d+)*)\s*[\.\)]\s*([A-Za-z][\w\s-]+?)\s*$/;

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;

    // 노이즈 제거
    if (/^(contents|table of contents)$/i.test(line)) return;

    // (A) 숫자 섹션: "0. Abstract" / "2. Related Work" 등
    let m = line.match(numberedHeadingRe);
    if (m) {
      const titleRaw = m[2].trim();
      const key = norm(titleRaw);
      const canonical = ALIASES[key];
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        out.push({
          id: `heading-${idx}`,
          level: 1,
          title: canonical,
        });
      }
      return; // 숫자 패턴이면 여기서 종료
    }

    // (B) 텍스트-only 섹션: "Abstract" / "Introduction" 등
    m = line.match(bareHeadingRe);
    if (m) {
      const titleRaw = m[0].replace(/:$/,'').trim();
      const canonical = ALIASES[norm(titleRaw)];
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        out.push({
          id: `heading-${idx}`,
          level: 1,
          title: canonical,
        });
      }
    }
  });

  return out;
}

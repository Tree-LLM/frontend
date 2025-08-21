// src/lib/api.ts

export type UploadResp = { file_path: string };

// 업로드: 파일을 서버로 보내고 file_path를 돌려받음
export async function uploadFile(file: File): Promise<UploadResp> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("파일 업로드 실패");
  return res.json();
}

// 스트리밍: 업로드에서 받은 file_path로 SSE 연결 (EventSource 반환)
export function openPipelineStream(filePath: string): EventSource {
  if (!filePath) throw new Error("filePath가 비어 있습니다. 먼저 uploadFile()로 file_path를 받으세요.");
  const url = `/api/pipeline/stream?file_path=${encodeURIComponent(filePath)}`;
  return new EventSource(url);
}

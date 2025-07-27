import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'; // legacy 버전은 CORS 덜 민감
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';

// PDF.js에 워커 경로 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * PDF 파일에서 텍스트 추출하는 함수
 * @param file - 업로드된 PDF 파일 (File 객체)
 * @returns 추출된 전체 텍스트 (string)
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textList: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const strings = content.items.map((item: any) => item.str);
    textList.push(strings.join(' '));
  }

  return textList.join('\n');
}
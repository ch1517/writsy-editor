/**
 * URL을 검증하고 안전하게 정제합니다.
 * @param url - 검증할 URL 문자열
 * @returns 정제된 URL 또는 null (유효하지 않은 경우)
 */
export function sanitizeUrl(url: string): string | null {
  try {
    // 빈 문자열이나 공백만 있는 경우
    if (!url || !url.trim()) {
      return null;
    }

    const trimmedUrl = url.trim();

    // 위험한 프로토콜 차단
    const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;

    if (dangerousProtocols.test(trimmedUrl)) {
      return null;
    }

    // 프로토콜이 없는 경우 https:// 추가
    const urlWithProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

    // URL 객체로 검증
    const urlObj = new URL(urlWithProtocol);

    // http, https만 허용
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
}

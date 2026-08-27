import { COLORS, SPACING } from '../constants/config';
import tiptapBundleCode from './tiptapBundle';

/**
 * Tiptap HTML 콘텐츠를 WebView에서 렌더링하기 위한 HTML 문자열 생성
 * @param {string} content - Tiptap HTML 콘텐츠
 * @param {number} bottomPadding - 하단 패딩 (insets.bottom + 20)
 * @returns {string} WebView source.html에 전달할 HTML 문자열
 */
export const buildTiptapHtml = (content, bottomPadding) => {
  // </script> 시퀀스를 이스케이프하여 스크립트 블록 조기 종료 방지
  const safeContent = JSON.stringify(content || '').replace(/<\/script>/gi, '<\\/script>');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-user-select: none; user-select: none; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif;
      font-size: 14px;
      line-height: 22px;
      padding: ${SPACING.xl}px;
      padding-bottom: ${bottomPadding}px;
      -webkit-text-size-adjust: 100%;
    }
    img { max-width: 100% !important; height: auto !important; display: inline-block; }
    .element .tiptap { outline: none; }
    .element .tiptap p[style*="text-align: center"], .element .tiptap h1[style*="text-align: center"], .element .tiptap h2[style*="text-align: center"], .element .tiptap h3[style*="text-align: center"] { text-align: center; }
    .element .tiptap p[style*="text-align: right"], .element .tiptap h1[style*="text-align: right"], .element .tiptap h2[style*="text-align: right"], .element .tiptap h3[style*="text-align: right"] { text-align: right; }
    .element .tiptap h1 { font-size: 20px; font-weight: 700; color: ${COLORS.textPrimary}; margin-bottom: 12px; }
    .element .tiptap h2 { font-size: 18px; font-weight: 700; color: ${COLORS.textPrimary}; margin-bottom: 10px; }
    .element .tiptap h3 { font-size: 16px; font-weight: 600; color: ${COLORS.textPrimary}; margin-bottom: 8px; }
    .element .tiptap p { margin-top: 0; margin-bottom: 8px; }
    .element .tiptap ul, .element .tiptap ol { padding-left: 16px; }
    .element .tiptap li { margin-bottom: 4px; }
    .element .tiptap strong { font-weight: 700; }
    .element .tiptap a { color: ${COLORS.primary}; }
  </style>
</head>
<body>
  <div class="element"></div>
  <script>
    // 로드 실패 시 스피너 무한 표시 방지 폴백
    function notifyReady() {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('TIPTAP_READY');
    }
    window.onerror = notifyReady;
    window.addEventListener('unhandledrejection', notifyReady);
    setTimeout(notifyReady, 15000);
  </script>
  <script>${tiptapBundleCode}</script>
  <script>
    var editor = new window.__TiptapEditor({
      element: document.querySelector('.element'),
      extensions: [
        window.__TiptapExtensions.StarterKit,
        window.__TiptapExtensions.TiptapImage.configure({ inline: true, allowBase64: true }),
        window.__TiptapExtensions.TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: ${safeContent},
      editable: false,
      onCreate: function() {
        window.ReactNativeWebView.postMessage('TIPTAP_READY');
      },
    });
  </script>
</body>
</html>
`;
};

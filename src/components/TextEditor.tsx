import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { sanitizeUrl } from '@/utils/sanitizeUrl';

export type TextEditorProps = {
  html: string;
  onHtmlChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  ({ html = '', onHtmlChange, placeholder = '텍스트를 입력하세요...', disabled = false }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRef = useRef<Range | null>(null);
    const [hasSelection, setHasSelection] = useState(false);

    useImperativeHandle(ref, () => editorRef.current!, []);

    useEffect(() => {
      if (editorRef.current && html !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = html;
        onHtmlChange(html);
      }
    }, [html, onHtmlChange]);

    useEffect(() => {
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        const editor = editorRef.current;

        if (!editor || !selection) {
          return;
        }

        // selection 영역이 텍스트 에디터 영역 안에 있고 선택된 텍스트가 있을 때
        if (editor.contains(selection.anchorNode) && !selection.isCollapsed) {
          selectionRef.current = selection.getRangeAt(0);
          setHasSelection(true);
        } else {
          selectionRef.current = null;
          setHasSelection(false);
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }, []);

    const emitChange = () => {
      const content = editorRef.current?.innerHTML ?? '';

      onHtmlChange(content);
    };

    const restoreSelection = () => {
      const selection = window.getSelection();

      if (selection && selectionRef.current) {
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
      }
    };

    const execCommand = (command: string, value?: string) => {
      if (!hasSelection || disabled) {
        return;
      }

      restoreSelection();
      document.execCommand(command, false, value);
      emitChange();
      editorRef.current?.focus();
    };

    const handleFontSize = (size: number) => {
      if (!selectionRef.current || disabled) {
        return;
      }

      restoreSelection();

      const range = selectionRef.current;

      if (!range || range.collapsed) {
        return;
      }

      const selectedContents = range.cloneContents();
      const fragment = document.createDocumentFragment();

      selectedContents.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const span = document.createElement('span');

          span.style.fontSize = `${size}px`;
          span.textContent = node.textContent;
          fragment.appendChild(span);
        } else {
          // 이미 스타일이 있는 요소인 경우 중첩 적용을 피하고 override
          const element = node as HTMLElement;
          const cloned = element.cloneNode(true) as HTMLElement;

          cloned.style.fontSize = `${size}px`;
          fragment.appendChild(cloned);
        }
      });

      // 기존 선택 영역 제거하고 새 fragment 삽입
      range.deleteContents();
      range.insertNode(fragment);

      // 커서 이동
      selectionRef.current = document.createRange();
      selectionRef.current.setStartAfter(fragment.lastChild!);
      selectionRef.current.collapse(true);

      emitChange();
      editorRef.current?.focus();
    };

    const handleLink = () => {
      const url = prompt('URL을 입력하세요:', 'https://');

      if (!url) {
        return;
      }

      const sanitizedUrl = sanitizeUrl(url);

      if (sanitizedUrl) {
        execCommand('createLink', sanitizedUrl);
      } else {
        alert('유효하지 않은 URL입니다.');
      }
    };

    const isDisabled = !hasSelection || disabled;

    return (
      <div style={styles.wrapper}>
        <div style={styles.toolbar} data-toolbar>
          <button
            onClick={() => execCommand('bold')}
            onMouseDown={(e) => e.preventDefault()}
            disabled={isDisabled}
            style={{ ...styles.button, ...(isDisabled && styles.disabled) }}
            title="굵게"
          >
            B
          </button>

          <select
            onChange={(e) => handleFontSize(Number(e.target.value))}
            disabled={isDisabled}
            style={{ ...styles.select, ...(isDisabled && styles.disabled) }}
            title="글자 크기"
          >
            <option value="">크기</option>
            {[14, 16].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            onMouseDown={(e) => e.preventDefault()}
            disabled={isDisabled}
            style={{ ...styles.color, ...(isDisabled && styles.disabled) }}
            title="글자 색상"
          />

          <button
            onClick={handleLink}
            onMouseDown={(e) => e.preventDefault()}
            disabled={isDisabled}
            style={{ ...styles.button, ...(isDisabled && styles.disabled) }}
            title="링크"
          >
            🔗
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          style={{
            ...styles.editor,
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
          }}
          data-placeholder={placeholder}
        />
      </div>
    );
  },
);

TextEditor.displayName = 'TextEditor';

// TODO lucy: 추후 제거될 스타일
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
  },
  button: {
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  select: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  color: {
    width: '40px',
    height: '32px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  editor: {
    minHeight: '200px',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
  },
  summary: {
    cursor: 'pointer',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  preview: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f8f8f8',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '150px',
  },
};

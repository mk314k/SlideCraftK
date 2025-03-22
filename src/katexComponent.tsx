import React, { useMemo } from 'react';
import katex from 'katex';

export interface KatexRendererProps {
  latex: string;
  id?: string;
  onDoubleClick?: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function renderKatexWithStatus(latex: string): { html: string; error: string | null } {
  const expr = latex && latex !== 'latex' ? latex : 'E = mc^2';
  try {
    katex.renderToString(expr, {
      throwOnError: true,
      displayMode: true,
    });
    return {
      html: katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
      }),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message.replace(/^KaTeX parse error:\s*/, '') : 'Invalid LaTeX syntax';
    return {
      html: katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
      }),
      error: message,
    };
  }
}

export const KatexRenderer: React.FC<KatexRendererProps> = ({
  latex,
  id,
  onDoubleClick,
}) => {
  const { html } = useMemo(() => renderKatexWithStatus(latex), [latex]);

  return (
    <div
      id={id}
      className="element katex-element"
      onDoubleClick={onDoubleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default KatexRenderer;

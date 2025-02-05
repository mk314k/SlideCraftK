import React, { useMemo } from 'react';
import katex from 'katex';

export interface KatexRendererProps {
  latex: string;
  id?: string;
  onDoubleClick?: () => void;
}

export const KatexRenderer: React.FC<KatexRendererProps> = ({
  latex,
  id,
  onDoubleClick,
}) => {
  const html = useMemo(() => {
    const expr = latex && latex !== 'latex' ? latex : '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}';
    try {
      return katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return expr;
    }
  }, [latex]);

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

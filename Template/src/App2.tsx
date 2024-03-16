import './App.css';


import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';

const LatexEditor: React.FC = () => {
  const [latex, setLatex] = useState('Enter LaTeX here');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLatex, setEditedLatex] = useState(latex);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    renderLatex(latex);
  }, [latex]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setLatex(editedLatex);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedLatex(event.target.value);
  };

  // Render LaTeX content
  const renderLatex = (latex: string) => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const el = document.createElement('div');
      katex.render(latex, el);
      containerRef.current.appendChild(el);
    }
  };

  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={editedLatex}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div onDoubleClick={handleDoubleClick} ref={containerRef}>
          Enter LaTeX here
        </div>
      )}
    </div>
  );
};









const App: React.FC = () => {
 
  
  

  return (
    <>
    <LatexEditor>

    </LatexEditor>
    </>
  );
};

export default App;

import './App.css';
import React, { useState } from 'react';
import katex from 'katex';

const LatexEditor: React.FC = () => {
  const [latex, setLatex] = useState('Enter LaTeX here');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLatex, setEditedLatex] = useState(latex);

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
        <span onDoubleClick={handleDoubleClick}>
          {katex.renderToString(latex)}
        </span>
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

import './App.css';
import { produce } from 'immer';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

interface Dimension {
  width: number;
  height: number;
}

interface KWindow extends Window {
  MathJax?: {
    typeset: () => void;
    tex2mml: (tex:string) => string;
  };
}


const tex2mml = (tex:string) => {
  let res = tex;
  if (window !== undefined){
    res = (window as KWindow).MathJax?.tex2mml(res)??'';
  }
  return res;
}

const handleEditText = (id: number, ltx = false) => {
  const element = document.getElementById(`${id}`);
  if (element) {
    const parentElement = element.parentElement;
    const textInput = document.createElement('input');
    
    // Set initial input value to button's text
    textInput.value = element.innerText;

    // Set input styles
    textInput.style.width = `${element.clientWidth}px`;
    textInput.style.height = `${element.clientHeight}px`;
    textInput.style.zIndex = '2';

    const handleClick = (e:MouseEvent) => {
      if (!textInput.contains(e.target as Node)) {
        element.innerHTML = ltx ? tex2mml(textInput.value) : textInput.value;
        parentElement?.replaceChild(element, textInput);
        document.removeEventListener('click', handleClick);
      }
    }

    // Handle click outside of input to update button text
    document.addEventListener('click', handleClick);

    // Replace button with input
    parentElement?.replaceChild(textInput, element);

    // Set focus to input
    textInput.focus();
  }
};



const AppFrame: React.FC = () => {

  const [elementList, setElementList] = useState<React.ReactNode[]>([]);
  const [posList, setPosList] = useState<Position[]>([]);
  const [dimList, setDimList] = useState<Dimension[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState<string>('auto');
  // const [image, setImage] = useState(null);




  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (dragging !== null) {
        const updatedPositions = posList.map((pos, index) =>
          index === dragging
            ? { x: event.clientX - offset.x, y: event.clientY - offset.y }
            : pos
        );
        setPosList(updatedPositions);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, posList, offset]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    if ((rect.x + 5 <= mouseX) && 
        (mouseX <= rect.x + rect.width - 5) &&
        (rect.y + 5 <= mouseY) && 
        (mouseY <= rect.y + rect.height - 5)
    ){
        setDragging(id);
        const clickedElement = elementList[id];
        if (clickedElement) {
          const clickedPos = posList[id];
          const newOffset = {
            x: event.clientX - clickedPos.x,
            y: event.clientY - clickedPos.y
          };
          setOffset(newOffset);
        }
      }else{
        setCursorStyle('nwse-resize');
        const handleResizeMouseMove = (e: MouseEvent) => {
          const dx = e.clientX - mouseX;
          const dy = e.clientY - mouseY;
    
          const updatedDimList = dimList.map((dim, index) =>
            index === id
              ? {
                  width: rect.width + dx,
                  height: rect.height + dy,
                }
              : dim
          );
    
          setDimList(updatedDimList);
        };
    
        const handleResizeMouseUp = () => {
          setCursorStyle('auto');
          document.removeEventListener('mousemove', handleResizeMouseMove);
          document.removeEventListener('mouseup', handleResizeMouseUp);
        };
    
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
      }
    
  };

  const handleAddElement = (elem: React.ReactNode, pos: Position, dim: Dimension) => {
    setElementList(prevList => produce(prevList, (draft: React.ReactNode[]) => {draft.push(elem)}));
    setPosList((prevList) => produce(prevList, (draft: Position[]) => {draft.push(pos)}));
    setDimList((prevList) => produce(prevList, (draft: Dimension[]) => {draft.push(dim)}));
  };

  return (
    <div className="app-container">
      <div className="slideview">
        {elementList.map((element, index) => (
          <div
            key={index}
            className='element-container'
            style={{
              position: 'absolute',
              left: posList[index]?.x,
              top: posList[index]?.y,
              width: dimList[index]?.width,
              height: dimList[index]?.height,
              cursor: cursorStyle
            }}
            onMouseDown={e => handleMouseDown(e, index)}
          >
            {element}
          </div>
        ))}
      </div>
    </div>
  );
};

const Tools:React.FC = () => {

  const handleAddButton = () => {
    const index = elementList.length + 1;
    const buttonElem = <button key={index} className='element' id={`${index}`} onDoubleClick={() => handleEditText(index)}>Button</button>;
    handleAddElement(buttonElem, { x: 0, y: 0 }, { width: 100, height: 50 });
  };

  const handleAddLatex = () => {
    const index = elementList.length + 1;
    const latexElem = <p key={index} className='element' id={`${index}`} onDoubleClick={() => handleEditText(index, true)}></p>;
    handleAddElement(latexElem, { x: 0, y: 0 }, { width: 100, height: 50 });
  };

  const handleAddTextArea = () => {
    const buttonElem = <textarea name="hello" id="text" className='element'></textarea>
    handleAddElement(buttonElem, { x: 0, y: 0 }, { width: 100, height: 50 });
  };

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageDataUrl = reader.result as string; // Cast to string
        const index = elementList.length + 1;
        const imgElem = <img src={imageDataUrl} key={index} className='element' id={`${index}`} draggable="false" />;
        handleAddElement(imgElem, { x: 0, y: 0 }, { width: 100, height: 50 });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="toolbar">
        <button className="tool" onClick={handleAddButton}>
          Add Button
        </button>
        <button className="tool" onClick={handleAddTextArea}>
          Add Text
        </button>
        <button className="tool" onClick={handleAddLatex}>
          Add latex
        </button>
        <label className="tool" style={{ display: 'inline-block', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Add Image
          <input type="file" accept="image/*" onChange={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
        </label>
      </div>
  )
}

const SlideSet:React.FC = () => {
  return (
    <div className="slideset">
      <Link to={'/1'}> <AppFrame /></Link>
    </div>
  )
}

const App:React.FC = () => {
  const [frameList, setFrameList] = useState<React.FC[]>([]);

  return (
    <>
      <Router>
        <Tools />
        <Routes>
          {frameList.map((frame, index) => (
            <Route path={`/${index}`} element = {frame()}></Route>
          ))}
        </Routes>
        <SlideSet />
      </Router>
    
    </>
  )
}

export default App;

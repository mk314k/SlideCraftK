import './App.css';
import { produce } from 'immer';
import React, { useState, useEffect } from 'react';
import {KImage, KLatex, KTextArea, Kbutton} from './component/component';
import { Frame } from './frame';

const frameList = [new Frame([])];

interface ToolsProps {
  newId: number,
  handleAddElement: (elem:React.ReactNode)=>void
}

const Tools:React.FC<ToolsProps> = ({newId, handleAddElement}) => {

  const handleAddButton = () => {
    const buttonElem = <Kbutton id={newId}></Kbutton>
    handleAddElement(buttonElem);
  };

  const handleAddLatex = () => {
    const latexElem = <KLatex id={newId}></KLatex>
    handleAddElement(latexElem);
  };

  const handleAddTextArea = () => {
    const buttonElem = <KTextArea id={newId}></KTextArea>
    handleAddElement(buttonElem);
  };

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageDataUrl = reader.result as string; // Cast to string
        const imgElem = <KImage id={newId} imgUrl={imageDataUrl}></KImage>
        handleAddElement(imgElem);
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

const SlideSet: React.FC<{
  totalFrame: number;
  handleAddFrame: () => void;
  setFrameId: React.Dispatch<React.SetStateAction<number>>
}> = ({ totalFrame, handleAddFrame, setFrameId }) => {

  // const handleAddFrame = () => {
  //     frameList[frame]
  //     frameList.push(new Frame([]));
  //     setFrameId (totalFrame + 1);
  // };

  return (
      <div className="slideset">
          {Array.from({ length: totalFrame }, (_, i) => (
              <div className="mini" id={`${i}`} key={`${i}ss`} onClick={() => setFrameId(i)}> Frame {i}</div>
          ))}
          <div className="mini" onClick={handleAddFrame}>
              Add
          </div>
      </div>
  );
};



const App:React.FC = () => {
  const [elementList, setElementList] = useState<React.ReactNode[]>([]);
  const [frameId, setFrameId] = useState(0);

  const handleAddElement = (elem: React.ReactNode) => {
    setElementList(prevList => produce(prevList, (draft: React.ReactNode[]) => {draft.push(elem)}));
    // frameList[frameId].elemList.push(elem);
  };

  const handleAddFrame = () => {
    frameList[frameId].elemList = elementList;
    frameList.push(new Frame([]));
    setFrameId (frameList?.length);
  };

  useEffect(()=>{
    setElementList(frameList[frameId]?.elemList);
  },[frameId]);

  return (
    <div className="app-container">
      <Tools newId= {elementList?.length} handleAddElement={handleAddElement}/>
      <div className="slideview">
        {elementList?.map((element) => (
          element
        ))}
      </div>
      <SlideSet totalFrame={frameList?.length} handleAddFrame={handleAddFrame} setFrameId = {setFrameId} />
    </div>
  )
}

export default App;

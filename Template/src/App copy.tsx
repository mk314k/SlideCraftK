import './App.css';
import React, { useState, useEffect } from 'react';
import {KImage, KLatex, KTextArea, Kbutton} from './component/component';
import { KSlide, KSlideSet } from './frame';

interface ToolsProps {
  newId: number,
  handleAddElement: (elem:React.ReactNode, elemType:string)=>void
}

const Tools:React.FC<ToolsProps> = ({newId, handleAddElement}) => {

  const handleAddButton = () => {
    const buttonElem = <Kbutton key={`${newId}e`} id={newId}></Kbutton>
    handleAddElement(buttonElem, 'button');
  };

  const handleAddLatex = () => {
    const latexElem = <KLatex key={`${newId}e`} id={newId}></KLatex>
    handleAddElement(latexElem, 'latex');
  };

  const handleAddTextArea = () => {
    const buttonElem = <KTextArea key={`${newId}e`} id={newId}></KTextArea>
    handleAddElement(buttonElem, 'textarea');
  };

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageDataUrl = reader.result as string; // Cast to string
        const imgElem = <KImage key={`${newId}e`} id={newId} imgUrl={imageDataUrl}></KImage>
        handleAddElement(imgElem, 'image');
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
  setFrameId: React.Dispatch<React.SetStateAction<number>>
}> = ({ setFrameId }) => {

  const handleAddFrame = () => {
      KSlideSet.slides.push(new KSlide());
      setFrameId (KSlideSet.slides.length - 1);
      console.log(KSlideSet);
  };

  return (
      <div className="slideset">
          {Array.from({ length: KSlideSet.slides.length }, (_, i) => (
              <div className="mini" id={`${i}ss`} key={`${i}ss`} onClick={() => setFrameId(i)}> Frame {i}</div>
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

  const handleAddElement = (elem: React.ReactNode, elemType:string) => {
    console.log("check2 addelement");
    setElementList(prevList => [...prevList, elem]);
    KSlideSet.slides[frameId].elemList.push(elem);
    KSlideSet.slides[KSlideSet.curFrame].pushProp(elemType);
  };

  useEffect(()=>{
    console.log("check1 useeffect", frameId);
    setElementList(KSlideSet.slides[frameId]?.elemList.slice());
    KSlideSet.curFrame = frameId;
  },[frameId]);

  return (
    <div className="app-container">
      <Tools newId= {elementList?.length} handleAddElement={handleAddElement}/>
      <div className="slideview">
        {elementList?.map((element) => (
          element
        ))}
      </div>
      <SlideSet setFrameId = {setFrameId} />
    </div>
  )
}

export default App;

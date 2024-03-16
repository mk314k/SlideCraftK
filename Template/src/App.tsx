import './App.css';
import React, { useState, useEffect } from 'react';
import {KComponents, KElementProps} from './component/component';
import {KElement, KSlide, KSlideSet } from './frame';
import { downloadFile } from './component/utility';

interface ToolsProps {
  handleAddElement: (elemType:string, info?:string)=>void
}

// const components:Map<string, React.FC> = new Map([
//   ["button", (eid:number)=> {<Kbutton key={`${eid}e`} id={eid}/>}],

// ]);

function propL2ElementL(props: KElement[]) {
  const elems:React.FunctionComponentElement<KElementProps>[] = [];
  for (let j=0; j<props.length; j++){
    const comp:React.FC<KElementProps>|undefined = KComponents.get(props[j].name);
    if (comp){
      const elem = React.createElement(comp, {eid:j, info:props[j].inner});
      elems.push(elem);
    } 
  }
  return elems;
}


const Tools:React.FC<ToolsProps> = ({handleAddElement}) => {

  // const handleAddButton = () => {
  //   // const buttonElem = (components.get('button')??defC)(newId);
  //   handleAddElement('button');
  // };

  // const handleAddLatex = () => {
  //   // const latexElem = <KLatex key={`${newId}e`} id={newId}></KLatex>
  //   // handleAddElement(latexElem, 'latex');
  // };

  // const handleAddTextArea = () => {
  //   // const buttonElem = <KTextArea key={`${newId}e`} id={newId}></KTextArea>
  //   // handleAddElement(buttonElem, 'textarea');
  // };

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageDataUrl = reader.result as string; // Cast to string
        // const imgElem = <KImage key={`${newId}e`} id={newId} imgUrl={imageDataUrl}></KImage>
        handleAddElement('image', imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="toolbar">
        <button className="tool" onClick={()=>handleAddElement('button')}>
          Add Button
        </button>
        <button className="tool" onClick={()=>handleAddElement('textarea')}>
          Add Text
        </button>
        <button className="tool" onClick={()=>handleAddElement('latex')}>
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
              <button className="mini" id={`${i}ss`} key={`${i}ss`} onClick={() => setFrameId(i)}> Frame {i}</button>
          ))}
          <button className="mini" onClick={handleAddFrame}>
              Add
          </button>
      </div>
  );
};



const App:React.FC = () => {
  const [elementList, setElementList] = useState<React.ReactNode[]>([]);
  const [frameId, setFrameId] = useState(0);

  const handleAddElement = (elemType:string, info?:string) => {
    const comp:React.FC<KElementProps>|undefined = KComponents.get(elemType);
    if (comp){
      const elem = React.createElement(comp, {eid:elementList.length, info:info});
      setElementList(prevList => [...prevList, elem]);
      KSlideSet.slides[frameId].elemList.push(elem);
      KSlideSet.slides[frameId].pushProp(elemType);
    }
  };

  useEffect(()=>{
    setElementList(KSlideSet.slides[frameId]?.elemList.slice());
    KSlideSet.curFrame = frameId;
  },[frameId]);

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        KSlideSet.load(content);
        for (let i=0; i<KSlideSet.slides.length; i++){
          KSlideSet.slides[i].elemList = propL2ElementL(
            KSlideSet.slides[i].elemProp
          );
        }
        setFrameId(0); // Trigger re-render after loading the file
        setElementList(KSlideSet.slides[0]?.elemList.slice());
      };
      reader.readAsText(file);
    }
    // setFrameId(0);
  };
  
  const handleFullScreen = () => {

  }

  return (
    <div className="app-container">
      <Tools handleAddElement={handleAddElement}/>
      <div className="slideview">
        {elementList?.map((element) => (
          element
        ))}
      </div>
      <SlideSet setFrameId = {setFrameId} />
      <div className='top-sect'>
          <button onClick={() => downloadFile('1hello.kms', KSlideSet.save())}>download</button>
          <input type="file" onChange={handleLoad}/>
          <button onClick={handleFullScreen}>FullScreen</button>
      </div>
    </div>
  )
}

export default App;

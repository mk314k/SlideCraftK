import './App.css';
import React, { useState, useEffect } from 'react';
import {KComponents, KElementProps} from './component/component';
import {KElementData, KSlide, KSlideSet, defaultFileName } from './frame';
import { downloadFile, toggleFullscreen } from './component/utility';

// interface ToolsProps {
//   handleAddElement: (elemType:string, info?:string)=>void
// }

function propL2ElementL(props: KElementData[]) {
  console.log("propl2eL called");
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


const Tools:React.FC = () => {
  console.log("rendering tools");

  const handleAddElement = (elemType:string, info?:string) => {
    console.log("handleAddElement called");
    const comp:React.FC<KElementProps>|undefined = KComponents.get(elemType);
    const eid = KSlideSet.numElement(KSlideSet.curFrame);
    if (comp){
      const elem = React.createElement(comp, {eid:eid, info:info});
      KSlideSet.slides[KSlideSet.curFrame].elemList.push(elem);
      KSlideSet.slides[KSlideSet.curFrame].setProp(eid, elemType);
    }
  };

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleAdd Image called");
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageDataUrl = reader.result as string; // Cast to string
        console.log(imageDataUrl);
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
  console.log("renedring slideset");

  const handleAddFrame = () => {
      console.log("addFrame called");
      KSlideSet.slides.push(new KSlide());
      setFrameId (KSlideSet.slides.length - 1);
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

const SlideView:React.FC = () =>{

  return (
    <div id='view' className="slideview">
      {KSlideSet.slides[KSlideSet.curFrame].elemList?.map((element) => (
        element
      ))}
    </div>
  )
}



const App:React.FC = () => {
  console.log("rendering app");
  // const [elementList, setElementList] = useState<React.ReactNode[]>([]);
  const [frameId, setFrameId] = useState(0);

  useEffect(()=>{
    console.log("frameId effect hook");
    const eList = [];
    for (let i=0; i<KSlideSet.numElement(frameId); i++ ){
      if (KSlideSet.slides[frameId]?.elemProp[i]?.name !== 'none'){
        eList.push(KSlideSet.slides[frameId]?.elemList[i])
      }
    }
    // setElementList(eList);
    KSlideSet.curFrame = frameId;
  },[frameId]);

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleLoad called");
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
        setFrameId(0);
        // setElementList(KSlideSet.slides[0]?.elemList.slice());
      };
      reader.readAsText(file);
    }
  };
  
  const handleFullScreen = () => {
    console.log("fullscreen called");
    toggleFullscreen();
  }

  return (
    <div className="app-container">
      <Tools />
      <SlideView />
      <SlideSet setFrameId = {setFrameId} />
      <div className='top-sect'>
          <button onClick={() => downloadFile(defaultFileName, KSlideSet.save())}>download</button>
          <input type="file" onChange={handleLoad}/>
          <button onClick={handleFullScreen}>FullScreen</button>
      </div>
    </div>
  )
}

export default App;
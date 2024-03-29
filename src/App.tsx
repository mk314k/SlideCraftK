import './App.css';
import React, { useState, useEffect } from 'react';
import {KComponents, KElementProps} from './component/component';
import { KElementData, KSlide, KSlideSet, defaultFileName } from './frame';
import {downloadFile, handleFullScreen, insertCode } from './component/utility';
import { Tools } from './tools';


function propL2ElementL(props:Map<number, KElementData>) {
  console.log("propl2eL called");
  const elems:React.FunctionComponentElement<KElementProps>[] = [];
  for (const [index, prop] of props.entries()){
    const comp:React.FC<KElementProps>|undefined = KComponents.get(prop.name);
    if (comp){
      const elem = React.createElement(comp, {eid:index, info:prop.inner});
      elems.push(elem);
    } 
  }
  return elems;
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

const SlideView: React.FC = () => {
  console.log("rendering ElementRenderer");
  // const [viewWidth, setViewWidth] = useState(0);
  // const [viewHeight, setViewHeight] = useState(0);
  KSlideSet.activeEID = null;
  return (
      <div id='slide' className="slideview" onClick={()=>{KSlideSet.activeEID = null;console.log(KSlideSet.activeEID)}}>
          {KSlideSet.slides[KSlideSet.curFrame].elemList.map((element, index) => (
              <React.Fragment key={index}>{element}</React.Fragment>
          ))}
      </div>
  );
};


const App:React.FC = () => {
  console.log("rendering app");
  const [elementList, setElementList] = useState<React.ReactNode[]>([]);
  const [frameId, setFrameId] = useState(0);

  const handleAddElement = (elemType:string, info?:string) => {
    console.log("handleAddElement called");
    const comp:React.FC<KElementProps>|undefined = KComponents.get(elemType);
    if (comp){
      const elem = React.createElement(comp, {eid:elementList.length, info:info});
      setElementList(prevList => [...prevList, elem]);
      KSlideSet.slides[frameId].push(elemType, elem);
    }
  };

  useEffect(()=>{
    console.log("frameId effect hook");
    const eList = KSlideSet.slides[frameId].elements();
    setElementList(eList);
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
        setElementList(KSlideSet.slides[0]?.elemList.slice());
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="app-container">
      <Tools handleAddElement={handleAddElement}/>
      <SlideView />
      <SlideSet setFrameId = {setFrameId} />
      <div className='top-sect'>
          <button onClick={() => downloadFile(defaultFileName+'.scs', KSlideSet.save())}>Save</button>
          <input type="file" onChange={handleLoad}/>
          <button onClick={handleFullScreen}>FullScreen</button>
      </div>
      <div className='bot-sect'>
        <textarea name="code" id="code" cols={30} rows={12}></textarea>
        <button onClick={()=>{insertCode('style')}}>Add CSS</button>
        <button onClick={()=>{insertCode('script')}}>Add JS</button>
      </div>
    </div>
  )
}

export default App;
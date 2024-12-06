import './App.css';
import React, { useState, useEffect } from 'react';
import {KComponents} from './component/component';
import { KSlide, KSlideSet, defaultFileName } from './frame';
import {downloadFile, handleFullScreen } from './component/utility';
import { Tools } from './tools';

const SlideSet: React.FC<{
  setFrameId: React.Dispatch<React.SetStateAction<number>>
}> = ({ setFrameId }) => {
  console.log("renedring slideset");

  const handleAddFrame = () => {
      console.log("addFrame called");
      KSlideSet.slides.push(new KSlide());
      setFrameId (KSlideSet.slides.length - 1);
      KSlideSet.slideBG.addBinding(`slide${KSlideSet.slides.length - 1}`, 'azure');
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
  KSlideSet.activeEID = null;
  const currentSlide = KSlideSet.slides[KSlideSet.curFrame];

  return (
      <div 
        id={`slide${KSlideSet.curFrame}`} 
        style={{background:KSlideSet.slideBG.current(KSlideSet.curFrame)}} 
        className="slideview" 
        onClick={()=>{KSlideSet.activeEID = null}}
      >
          {currentSlide.elements().map(([eid, elemData]) => {
              const Comp = KComponents.get(elemData.name);
              if (!Comp) return null;
              return <Comp key={`${KSlideSet.curFrame}-${eid}`} eid={eid} info={elemData.inner} />;
          })}
      </div>
  );
};


const App:React.FC = () => {
  console.log("rendering app");
  const [, setRenderTick] = useState(0);
  const [frameId, setFrameId] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleAddElement = (elemType:string, info?:string) => {
    console.log("handleAddElement called");
    if (KComponents.has(elemType)){
      KSlideSet.slides[frameId].push(elemType, info);
      setRenderTick(tick => tick + 1);
    }
  };

  useEffect(()=>{
    console.log("frameId effect hook");
    KSlideSet.curFrame = frameId;
    setRenderTick(tick => tick + 1);
  },[frameId]);

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleLoad called");
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          KSlideSet.load(content);
          setLoadError(null);
          setFrameId(0);
          setRenderTick(tick => tick + 1);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load .scs file.';
          console.error(message);
          setLoadError(message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  return (
    <div className="app-container">
      <Tools handleAddElement={handleAddElement}/>
      <SlideView />
      <SlideSet setFrameId = {setFrameId} />
      <div className='top-sect'>
          <button onClick={() => downloadFile(defaultFileName+'.scs', KSlideSet.save())}>Save</button>
          <input type="file" accept=".scs,application/json" onChange={handleLoad}/>
          <button onClick={handleFullScreen}>Presentation</button>
          {loadError && (
            <span className="load-error" role="alert" onClick={() => setLoadError(null)}>
              {loadError}
            </span>
          )}
      </div>
      {/* <div className='bot-sect'>
        <textarea name="code" id="code" cols={30} rows={12}></textarea>
        <button onClick={()=>{insertCode('style')}}>Add CSS</button>
        <button onClick={()=>{insertCode('script')}}>Add JS</button>
      </div> */}
    </div>
  )
}

export default App;
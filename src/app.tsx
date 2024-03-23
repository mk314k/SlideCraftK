import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import './app.css';
import { KComponents } from './component';
// import { KSlide, KSlideSet } from './frame';
// import { downloadFile, toggleFullscreen } from './utility';

interface ToolsProps {
  handleAddElement: (elemType: string, info?: string) => void;
}

const Tools = component$<ToolsProps>(({ handleAddElement }) => {
  // const handleAddImage = $(async (event: Event) => {
  //   const file = (event.target as HTMLInputElement).files?.[0];
  //   if (file) {
  //     const imageDataUrl = await new Promise<string>((resolve) => {
  //       const reader = new FileReader();
  //       reader.onload = () => {
  //         resolve(reader.result as string);
  //       };
  //       reader.readAsDataURL(file);
  //     });
  //     handleAddElement('image', imageDataUrl);
  //   }
  // });

  return (
    <div class="toolbar">
      <button class="tool" onClick$={() => handleAddElement('button')}>
        Add Button
      </button>
      {/* <button class="tool" onClick$={() => handleAddElement('textarea')}>
        Add Text
      </button>
      <button class="tool" onClick$={() => handleAddElement('latex')}>
        Add Latex
      </button>
      <label class="tool" style={{ display: 'inline-block', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
        Add Image
        <input type="file" accept="image/*" onChange$={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
      </label> */}
    </div>
  );
});

// const SlideSet = component$<{ setFrameId: (id: number) => void }>(() => {

const SlideSet = component$(() => {
  // const handleAddFrame = $(() => {
  //   KSlideSet.slides.push(new KSlide());
  //   KSlideSet.curFrame = KSlideSet.slides.length - 1;
  // });

  return (
    <div class="slideset">
      {/* {KSlideSet.slides.map((_, i) => (
        <button class="mini" id={`${i}ss`} key={`${i}ss`} onClick$={() => KSlideSet.curFrame = i}>
          Frame {i}
        </button>
      ))}
      <button class="mini" onClick$={handleAddFrame}>
        Add
      </button> */}
    </div>
  );
});

export const App = component$(() => {
  console.log("rendering app");
  const store = useStore({
    elementList: [] as any[],
  });

  // const frameIdSignal = useSignal(0);

  // const handleAddElement = $(async (elemType: string, info?: string) => {
  //   const comp = KComponents.get(elemType);
  //   if (comp) {
  //     const elem = await comp({ eid: store.elementList.length, info });
  //     store.elementList.push(elem);
  //     KSlideSet.slides[frameIdSignal.value].elemList.push(elem);
  //     KSlideSet.slides[frameIdSignal.value].push(elemType);
  //   }
  // });

  // useTask$(({ track }) => {
  //   const frameId = track(() => frameIdSignal.value);
  //   const eList: any[] = [];
  //   for (let i = 0; i < KSlideSet.numElement(frameId); i++) {
  //     if (KSlideSet.slides[frameId]?.elemProp[i]?.name !== 'none') {
  //       eList.push(KSlideSet.slides[frameId]?.elemList[i]);
  //     }
  //   }
  //   store.elementList = eList;
  //   KSlideSet.currentFrameId = frameId;
  // });

  // const handleLoad = $(async (event: Event) => {
  //   const file = (event.target as HTMLInputElement).files?.[0];
  //   if (file) {
  //     const content = await new Promise<string>((resolve) => {
  //       const reader = new FileReader();
  //       reader.onload = () => {
  //         resolve(reader.result as string);
  //       };
  //       reader.readAsText(file);
  //     });
  //     KSlideSet.load(content);
  //     for (let i = 0; i < KSlideSet.slides.length; i++) {
  //       KSlideSet.slides[i].elemList = propL2ElementL(KSlideSet.slides[i].elemProp);
  //     }
  //     frameIdSignal.value = 0;
  //     store.elementList = KSlideSet.slides[0]?.elemList.slice() || [];
  //   }
  // });

  // const handleFullScreen = $(() => {
  //   toggleFullscreen();
  // });
  const handleAddElement = $((sth:string) =>{
    console.log(sth);
    const comp = KComponents.get(sth);
    if (comp){
      const elem = comp();
      store.elementList.push(elem);
    }
    
  });

  return (
    <div class="app-container">
      <Tools handleAddElement={handleAddElement} />
      <div id="slide" class="slideview">
        {store.elementList.map((element) => element)}
      </div>
      <SlideSet />
      {/* <SlideSet setFrameId={(id) => (frameIdSignal.value = id)} /> */}
      {/* <div class="top-sect">
        <button onClick$={() => downloadFile('1hello.kms', KSlideSet.save())}>download</button>
        <input type="file" onChange$={handleLoad} />
        <button onClick$={handleFullScreen}>FullScreen</button>
      </div> */}
    </div>
  );
});

export default App;
import { component$, useSignal } from '@builder.io/qwik'
import './app.css'
// import { KSlideSet } from './frame';
// import KComponents from './component';



const Tools = component$((handleAddElement:(sth:string)=>{}) => {
  console.log("rendering tools");

  // const handleAddImage = $(event:Event) => {
  //   console.log("handleAdd Image called");
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       const imageDataUrl = reader.result as string; // Cast to string
  //       console.log(imageDataUrl);
  //       handleAddElement('image', imageDataUrl);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  return (
    <div class="toolbar flex-vertical">
        <button class="tool" onClick$={()=>handleAddElement('button')}>
          Add Button
        </button>
        <button class="tool" onClick$={()=>handleAddElement('textarea')}>
          Add Text
        </button>
        <button class="tool" onClick$={()=>handleAddElement('latex')}>
          Add latex
        </button>
        {/* <label class="tool" style={{ display: 'inline-block', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Add Image
          <input type="file" accept="image/*" onChange$={handleAddImage} style={{ position: 'absolute', left: '-9999px' }} />
        </label> */}
    </div>
  )
})



export const App = component$(() => {
  let count =0;

  const increment = () => {
    count++; // Update state
  };



  return (
    <div class="app-container">
      <Tools />
      <div>
        <h1>Count: {count}</h1> {/* Data binding with curly braces */}
        <button on:click={increment}>Increment</button>
      </div>
      {/* <div id='slide' className="slideview">
        {elementList?.map((element) => (
          element
        ))}
      </div>
      <SlideSet setFrameId = {setFrameId} />
      <div className='top-sect'>
          <button onClick={() => downloadFile('1hello.kms', KSlideSet.save())}>download</button>
          <input type="file" onChange={handleLoad}/>
          <button onClick={handleFullScreen}>FullScreen</button>
      </div> */}
    </div>
  )
})

export default App;
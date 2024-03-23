// import { useSignal, useEffect } from 'react';
import { useSignal, $ } from '@builder.io/qwik';
import { KSlideSet, defaultSV } from './frame';



const useKElemHook = (eid:number, sv = defaultSV) => {
    console.log("Khook");
    // if (eid < KSlideSet.slides[KSlideSet.curFrame].elemList.length){
    //     const prop = KSlideSet.slides[KSlideSet.curFrame].elemProp.get(eid);
    //     if (prop){
    //         sv = {
    //             x: prop.x,
    //             y: prop.y,
    //             width: prop.width,
    //             height: prop.height
    //         }
    //     }
        
    //     // const elem = document.getElementById(`${eid}`);
    //     // if (elem){
    //     //     elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].inner;
    //     // }
    // }
    const posx = useSignal(sv.x);
    const posy = useSignal(sv.y);
    const width = useSignal(sv.width);
    const height = useSignal(sv.height);
    const cursorStyle = useSignal('auto');

    // useEffect(()=>{
    //     console.log("Khook effect pos");
    //     KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].x = posx;
    //     KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].y = posy;
    // }, [posx, posy, eid])

    // useEffect(()=>{
    //     console.log("khook effect dim");
    //     KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].width = width;
    //     KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].height = height;
    // }, [width, height, eid])

    const handleMouseDown = $((event: MouseEvent) => {
        console.log("handleMouseDown called");
        
        const rect = {x:posx.value, y:posy.value, width:width.value, height:height.value};
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        if ((rect.x + 5 <= mouseX) && 
            (mouseX <= rect.x + rect.width - 5) &&
            (rect.y + 5 <= mouseY) && 
            (mouseY <= rect.y + rect.height - 5)
        ){
            const handleMouseMove = $((e: MouseEvent) => {
                console.log("mousemove pos called");
                posx.value = e.clientX - mouseX + posx.value;
                posy.value = e.clientY - mouseY + posy.value;
            });
        
            const handleMouseUp = $(() => {
                console.log("mouseup pos called");
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            });
        
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }else{
            cursorStyle.value = 'nwse-resize';
            const handleResizeMouseMove = $((e: MouseEvent) => {
                console.log("mousemove dim called");
                const dx = e.clientX - mouseX;
                const dy = e.clientY - mouseY;
                width.value = width.value + dx;
                height.value = height.value + dy;
            });
        
            const handleResizeMouseUp = $(() => {
                console.log("mousemov dimL called");
                cursorStyle.value = 'auto';
                document.removeEventListener('mousemove', handleResizeMouseMove);
                document.removeEventListener('mouseup', handleResizeMouseUp);
            });
        
            document.addEventListener('mousemove', handleResizeMouseMove);
            document.addEventListener('mouseup', handleResizeMouseUp);
        }
        
    });

    const style = {
        x: posx,
        y: posy,
        width: width,
        height: height,
        cursor:cursorStyle
    }

    return {
        style,
        handleMouseDown
    };
};

export default useKElemHook;

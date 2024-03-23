import { useState, useEffect } from 'react';
import { defaultSV } from './utility';
import { KSlideSet } from '../frame';



const useKElemHook = (eid:number, sv = defaultSV) => {
    console.log("Khook");
    if (eid < KSlideSet.slides[KSlideSet.curFrame].elemProp.length){
        sv = {
            x: KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].x,
            y: KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].y,
            width: KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].width,
            height: KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].height
        }
        // const elem = document.getElementById(`${eid}`);
        // if (elem){
        //     elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].inner;
        // }
    }
    const [posx, setPosX] = useState(sv.x);
    const [posy, setPosY] = useState(sv.y);
    const [width, setWidth] = useState(sv.width);
    const [height, setHeight] = useState(sv.height);
    const [cursorStyle, setCursorStyle] = useState('auto');

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].x = posx;
        KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].y = posy;
    }, [posx, posy, eid])

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].width = width;
        KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].height = height;
    }, [width, height, eid])

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        if ((rect.x + 5 <= mouseX) && 
            (mouseX <= rect.x + rect.width - 5) &&
            (rect.y + 5 <= mouseY) && 
            (mouseY <= rect.y + rect.height - 5)
        ){
            const handleMouseMove = (e: MouseEvent) => {
                setPosX(e.clientX - mouseX + posx);
                setPosY(e.clientY - mouseY + posy);
            };
        
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }else{
            setCursorStyle('nwse-resize');
            const handleResizeMouseMove = (e: MouseEvent) => {
                const dx = e.clientX - mouseX;
                const dy = e.clientY - mouseY;
                setWidth(width + dx);
                setHeight(height + dy);
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

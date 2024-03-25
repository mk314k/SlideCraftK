import { useState, useEffect } from 'react';
import { KSlideSet, defaultSV } from '../frame';



const useKElemHook = (eid:number, sv = defaultSV) => {
    console.log("Khook");
    if (eid < KSlideSet.slides[KSlideSet.curFrame].numElement()){
        sv = {
            x: KSlideSet.slides[KSlideSet.curFrame].get(eid).x,
            y: KSlideSet.slides[KSlideSet.curFrame].get(eid).y,
            width: KSlideSet.slides[KSlideSet.curFrame].get(eid).width,
            height: KSlideSet.slides[KSlideSet.curFrame].get(eid).height
        }
    }
    const [posx, setPosX] = useState(sv.x);
    const [posy, setPosY] = useState(sv.y);
    const [width, setWidth] = useState(sv.width);
    const [height, setHeight] = useState(sv.height);
    const [cursorStyle, setCursorStyle] = useState('auto');

    useEffect(()=>{
        console.log("Khook effect pos");
        KSlideSet.slides[KSlideSet.curFrame].get(eid).x = posx;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).y = posy;
    }, [posx, posy, eid])

    useEffect(()=>{
        console.log("khook effect dim");
        KSlideSet.slides[KSlideSet.curFrame].get(eid).width = width;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).height = height;
    }, [width, height, eid])

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log("handleMouseDown called");
        
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        if ((rect.x + 5 <= mouseX) && 
            (mouseX <= rect.x + rect.width - 5) &&
            (rect.y + 5 <= mouseY) && 
            (mouseY <= rect.y + rect.height - 5)
        ){
            const handleMouseMove = (e: MouseEvent) => {
                console.log("mousemove pos called");
                setPosX(e.clientX - mouseX + posx);
                setPosY(e.clientY - mouseY + posy);
            };
        
            const handleMouseUp = () => {
                console.log("mouseup pos called");
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }else{
            setCursorStyle('nwse-resize');
            const handleResizeMouseMove = (e: MouseEvent) => {
                console.log("mousemove dim called");
                const dx = e.clientX - mouseX;
                const dy = e.clientY - mouseY;
                setWidth(width + dx);
                setHeight(height + dy);
            };
        
            const handleResizeMouseUp = () => {
                console.log("mousemov dimL called");
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

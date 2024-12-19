import { useState, useEffect } from 'react';
import { KSlideSet, defaultSV } from '../frame';
import { useDeck } from '../context/DeckContext';

const useKElemHook = (eid:number, sv = defaultSV) => {
    const { currentSlide, updateElement } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);

    const initialX = elemState?.x ?? sv.x;
    const initialY = elemState?.y ?? sv.y;
    const initialWidth = elemState?.width ?? sv.width;
    const initialHeight = elemState?.height ?? sv.height;

    const [posx, setPosX] = useState(initialX);
    const [posy, setPosY] = useState(initialY);
    const [width, setWidth] = useState(initialWidth);
    const [height, setHeight] = useState(initialHeight);
    const [cursorStyle, setCursorStyle] = useState('auto');

    useEffect(() => {
        if (elemState) {
            setPosX(elemState.x);
            setPosY(elemState.y);
            setWidth(elemState.width);
            setHeight(elemState.height);
        }
    }, [elemState?.x, elemState?.y, elemState?.width, elemState?.height, elemState]);

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].get(eid).x = posx;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).y = posy;
    }, [posx, posy, eid]);

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].get(eid).width = width;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).height = height;
    }, [width, height, eid]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const scale = KSlideSet.scale > 0 ? KSlideSet.scale : 1;
        const borderThreshold = 8 * scale;

        if ((rect.x + borderThreshold <= mouseX) && 
            (mouseX <= rect.x + rect.width - borderThreshold) &&
            (rect.y + borderThreshold <= mouseY) && 
            (mouseY <= rect.y + rect.height - borderThreshold)
        ){
            let latestX = posx;
            let latestY = posy;
            const handleMouseMove = (e: MouseEvent) => {
                const dx = (e.clientX - mouseX) / scale;
                const dy = (e.clientY - mouseY) / scale;
                latestX = Math.round(posx + dx);
                latestY = Math.round(posy + dy);
                setPosX(latestX);
                setPosY(latestY);
            };
        
            const handleMouseUp = () => {
                updateElement(eid, (el) => {
                    el.x = latestX;
                    el.y = latestY;
                });
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            setCursorStyle('nwse-resize');
            let latestW = width;
            let latestH = height;
            const handleResizeMouseMove = (e: MouseEvent) => {
                const dx = (e.clientX - mouseX) / scale;
                const dy = (e.clientY - mouseY) / scale;
                latestW = Math.max(24, Math.round(width + dx));
                latestH = Math.max(24, Math.round(height + dy));
                setWidth(latestW);
                setHeight(latestH);
            };
        
            const handleResizeMouseUp = () => {
                setCursorStyle('auto');
                updateElement(eid, (el) => {
                    el.width = latestW;
                    el.height = latestH;
                });
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
        cursor: cursorStyle
    };

    return {
        style,
        handleMouseDown
    };
};

export default useKElemHook;

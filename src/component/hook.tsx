import { useState, useEffect } from 'react';
import { KSlideSet, defaultSV } from '../frame';
import { useDeck } from '../context/DeckContext';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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
    const [cursorStyle, setCursorStyle] = useState('move');

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
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const scale = KSlideSet.scale > 0 ? KSlideSet.scale : 1;

        let latestX = posx;
        let latestY = posy;
        setCursorStyle('grabbing');

        const handleMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - mouseX) / scale;
            const dy = (e.clientY - mouseY) / scale;
            latestX = Math.round(posx + dx);
            latestY = Math.round(posy + dy);
            setPosX(latestX);
            setPosY(latestY);
        };

        const handleMouseUp = () => {
            setCursorStyle('move');
            updateElement(eid, (el) => {
                el.x = latestX;
                el.y = latestY;
            });
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeStart = (
        direction: ResizeDirection,
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation();
        event.preventDefault();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const scale = KSlideSet.scale > 0 ? KSlideSet.scale : 1;

        let latestW = width;
        let latestH = height;

        const handleResizeMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - mouseX) / scale;
            const dy = (e.clientY - mouseY) / scale;
            if (direction.includes('e')) {
                latestW = Math.max(24, Math.round(width + dx));
            }
            if (direction.includes('s')) {
                latestH = Math.max(24, Math.round(height + dy));
            }
            setWidth(latestW);
            setHeight(latestH);
        };

        const handleResizeMouseUp = () => {
            updateElement(eid, (el) => {
                el.width = latestW;
                el.height = latestH;
            });
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
        };

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
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
        handleMouseDown,
        handleResizeStart
    };
};

export default useKElemHook;

import { useState, useEffect } from 'react';

const useKElemHook = () => {
    const [posx, setPosX] = useState(0);
    const [posy, setPosY] = useState(0);
    const [width, setWidth] = useState(100);
    const [height, setHeight] = useState(100);
    const [cursorStyle, setCursorStyle] = useState('auto');
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // const handlePositionChange = (newX: number, newY: number) => {
    //     setPosX(newX);
    //     setPosY(newY);
    // };

    // const handleDimensionChange = (newWidth: number, newHeight: number) => {
    //     setWidth(newWidth);
    //     setHeight(newHeight);
    // };


    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
        if (dragging) {
            setPosX(event.clientX - offset.x);
            setPosY(event.clientY - offset.y);
        }
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        if (dragging !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, offset]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        if ((rect.x + 5 <= mouseX) && 
            (mouseX <= rect.x + rect.width - 5) &&
            (rect.y + 5 <= mouseY) && 
            (mouseY <= rect.y + rect.height - 5)
        ){
            setDragging(true);
            const newOffset = {
                x: event.clientX - posx,
                y: event.clientY - posy
            };
            setOffset(newOffset);
        }else{
            setCursorStyle('nwse-resize');
            const handleResizeMouseMove = (e: MouseEvent) => {
                const dx = e.clientX - mouseX;
                const dy = e.clientY - mouseY;
                setWidth(rect.width + dx);
                setHeight(rect.height + dy);
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

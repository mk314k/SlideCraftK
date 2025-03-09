import { useState, useEffect } from 'react';
import { KSlideSet, defaultSV, SLIDE_WIDTH, SLIDE_HEIGHT } from '../frame';
import { useDeck, AlignmentGuide } from '../context/DeckContext';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const SNAP_THRESHOLD = 6;
const GRID_SIZE = 10;

const useKElemHook = (eid:number, sv = defaultSV) => {
    const { state, currentSlide, updateElement, setGuides } = useDeck();
    const elemState = currentSlide.elements.find((el) => el.id === eid);

    const initialX = elemState?.x ?? sv.x;
    const initialY = elemState?.y ?? sv.y;
    const initialWidth = elemState?.width ?? sv.width;
    const initialHeight = elemState?.height ?? sv.height;
    const initialRotation = elemState?.rotation ?? 0;

    const [posx, setPosX] = useState(initialX);
    const [posy, setPosY] = useState(initialY);
    const [width, setWidth] = useState(initialWidth);
    const [height, setHeight] = useState(initialHeight);
    const [rotation, setRotation] = useState(initialRotation);
    const [cursorStyle, setCursorStyle] = useState('move');

    useEffect(() => {
        if (elemState) {
            setPosX(elemState.x);
            setPosY(elemState.y);
            setWidth(elemState.width);
            setHeight(elemState.height);
            setRotation(elemState.rotation ?? 0);
        }
    }, [elemState?.x, elemState?.y, elemState?.width, elemState?.height, elemState?.rotation, elemState]);

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].get(eid).x = posx;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).y = posy;
    }, [posx, posy, eid]);

    useEffect(()=>{
        KSlideSet.slides[KSlideSet.curFrame].get(eid).width = width;
        KSlideSet.slides[KSlideSet.curFrame].get(eid).height = height;
    }, [width, height, eid]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (state.presenting) return;
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const scale = KSlideSet.scale > 0 ? KSlideSet.scale : 1;

        let latestX = posx;
        let latestY = posy;
        setCursorStyle('grabbing');

        const handleMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - mouseX) / scale;
            const dy = (e.clientY - mouseY) / scale;
            let nextX = Math.round(posx + dx);
            let nextY = Math.round(posy + dy);
            const activeGuides: AlignmentGuide[] = [];

            if (e.shiftKey) {
                nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
                nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;
            } else {
                const centerX = nextX + width / 2;
                const centerY = nextY + height / 2;
                if (Math.abs(centerX - SLIDE_WIDTH / 2) <= SNAP_THRESHOLD) {
                    nextX = Math.round(SLIDE_WIDTH / 2 - width / 2);
                    activeGuides.push({ axis: 'vertical', position: SLIDE_WIDTH / 2 });
                }
                if (Math.abs(centerY - SLIDE_HEIGHT / 2) <= SNAP_THRESHOLD) {
                    nextY = Math.round(SLIDE_HEIGHT / 2 - height / 2);
                    activeGuides.push({ axis: 'horizontal', position: SLIDE_HEIGHT / 2 });
                }

                for (const other of currentSlide.elements) {
                    if (other.id === eid) continue;
                    if (Math.abs(nextX - other.x) <= SNAP_THRESHOLD) {
                        nextX = other.x;
                        activeGuides.push({ axis: 'vertical', position: other.x });
                    } else if (Math.abs(nextX + width - (other.x + other.width)) <= SNAP_THRESHOLD) {
                        nextX = other.x + other.width - width;
                        activeGuides.push({ axis: 'vertical', position: other.x + other.width });
                    }
                    if (Math.abs(nextY - other.y) <= SNAP_THRESHOLD) {
                        nextY = other.y;
                        activeGuides.push({ axis: 'horizontal', position: other.y });
                    } else if (Math.abs(nextY + height - (other.y + other.height)) <= SNAP_THRESHOLD) {
                        nextY = other.y + other.height - height;
                        activeGuides.push({ axis: 'horizontal', position: other.y + other.height });
                    }
                }
            }

            latestX = nextX;
            latestY = nextY;
            setPosX(latestX);
            setPosY(latestY);
            setGuides(activeGuides);
        };

        const handleMouseUp = () => {
            setCursorStyle('move');
            setGuides([]);
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
        const MIN_SIZE = 24;

        const startX = posx;
        const startY = posy;
        const startW = width;
        const startH = height;

        let latestX = startX;
        let latestY = startY;
        let latestW = startW;
        let latestH = startH;

        const handleResizeMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - mouseX) / scale;
            const dy = (e.clientY - mouseY) / scale;

            if (direction.includes('e')) {
                latestW = Math.max(MIN_SIZE, Math.round(startW + dx));
            }
            if (direction.includes('w')) {
                const clampedDx = Math.min(dx, startW - MIN_SIZE);
                latestX = Math.round(startX + clampedDx);
                latestW = Math.round(startW - clampedDx);
            }
            if (direction.includes('s')) {
                latestH = Math.max(MIN_SIZE, Math.round(startH + dy));
            }
            if (direction.includes('n')) {
                const clampedDy = Math.min(dy, startH - MIN_SIZE);
                latestY = Math.round(startY + clampedDy);
                latestH = Math.round(startH - clampedDy);
            }

            setPosX(latestX);
            setPosY(latestY);
            setWidth(latestW);
            setHeight(latestH);
        };

        const handleResizeMouseUp = () => {
            updateElement(eid, (el) => {
                el.x = latestX;
                el.y = latestY;
                el.width = latestW;
                el.height = latestH;
            });
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
        };

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    const handleRotateStart = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        event.preventDefault();
        const container = event.currentTarget.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let latestRotation = rotation;

        const handleRotateMove = (e: MouseEvent) => {
            const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            let deg = Math.round((rad * 180) / Math.PI + 90);
            if (deg < 0) deg += 360;
            if (e.shiftKey) {
                deg = Math.round(deg / 15) * 15;
            }
            latestRotation = deg % 360;
            setRotation(latestRotation);
        };

        const handleRotateUp = () => {
            updateElement(eid, (el) => {
                el.rotation = latestRotation;
            });
            document.removeEventListener('mousemove', handleRotateMove);
            document.removeEventListener('mouseup', handleRotateUp);
        };

        document.addEventListener('mousemove', handleRotateMove);
        document.addEventListener('mouseup', handleRotateUp);
    };

    const style = {
        x: posx,
        y: posy,
        width: width,
        height: height,
        rotation: rotation,
        cursor: cursorStyle
    };

    return {
        style,
        handleMouseDown,
        handleResizeStart,
        handleRotateStart
    };
};

export default useKElemHook;

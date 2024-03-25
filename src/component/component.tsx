import useKElemHook from "./hook";
import { handleEditText } from "./utility";
import { KSlideSet } from "../frame";
import React, { useEffect, useCallback } from "react";

export interface KElementContainerProps {
    eid: number;
    childNode: React.ReactNode;
}

export interface KElementProps {
    eid: number;
    info?: string;
}


const KElement: React.FC<KElementContainerProps> = ({ eid, childNode }) => {
    console.log("rendering KElement");
    const { style, handleMouseDown } = useKElemHook(eid);

    useEffect(() => {
        console.log("KElement effect hook");
        const elem = document.getElementById(`${eid}`);
        if (elem) {
            elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].get(eid).inner;
        }
    }, [eid]);

    const handleDelete = useCallback(() => {
        console.log("handleDelete called");
        if (!KSlideSet.editingMode){
            KSlideSet.slides[KSlideSet.curFrame].del(eid);
            const elem = document.getElementById(`${eid}div`);
            if (elem) {
                elem.className = 'hidden';
            }
        }
    }, [eid]);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        console.log("onkeydown called");
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
            case 'Escape':
                handleDelete();
                break;
            default:
                break;
        }
    }, [handleDelete]);
    const view = document.getElementById('slide');
    let posx= style.x; let posy =  style.y;
    if (view){
        const vrect = view.getBoundingClientRect();
        posx = posx*100/vrect.width;
        posy = posy*100/vrect.height;
    }

    return (
        <div
            id={`${eid}div`}
            key={eid}
            className='element-container'
            style={{
                position: 'absolute',
                left: `${posx}%`,
                top: `${posy}%`,
                width: style.width,
                height: style.height,
                cursor: style.cursor
            }}
            onMouseDown={e => handleMouseDown(e)}
            onKeyDown={onKeyDown}
            tabIndex={0}
        >
            {childNode}
        </div>
    );
};

const createKElementComponent = (Component: React.ElementType, info?:string) => {
    return ({ eid }: KElementProps) => {
        console.log(`rendering ${Component}`);
        return (
            <KElement eid={eid} childNode={
                <Component
                    id={`${eid}`}
                    className='element'
                    onDoubleClick={() => { handleEditText(eid, info === 'latex') }}
                />
            } />
        );
    };
};

export const KButton = createKElementComponent('button');

export const KLatex = createKElementComponent('p', 'latex');

export const KTextArea = createKElementComponent('textarea');

export const KImage = ({ eid, info }: KElementProps) => {
    console.log("rendering KImage");
    return (
        <KElement eid={eid} childNode={
            <img
                id={`${eid}`}
                className='element'
                src={info}
                draggable="false"
            />
        } />
    );
};

export const KComponents: Map<string, React.FC<KElementProps>> = new Map([
    ["button", KButton],
    ["latex", KLatex],
    ["textarea", KTextArea],
    ["image", KImage]
]);

export default KComponents;

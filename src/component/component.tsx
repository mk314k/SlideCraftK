import useKElemHook from "./hook";
import { handleEditText } from "./utility";
import { KElementData, KSlideSet } from "../frame";
import React, { useEffect } from "react";

export interface KElementContainerProps {
    eid:number,
    childNode: React.ReactNode
}
export interface KElementProps {
    eid:number,
    info?:string
}

export const KElement:React.FC<KElementContainerProps> = ({
    eid,
    childNode
}) => {
    console.log("KElement");
    const {style, handleMouseDown} = useKElemHook(eid);
    useEffect(()=>{
        const elem = document.getElementById(`${eid}`);
        if (elem){
            elem.innerHTML = KSlideSet.slides[KSlideSet.curFrame].elemProp[eid].inner;
        }
    }, [eid])

    const handleDelete = () => {
        KSlideSet.slides[KSlideSet.curFrame].elemProp[eid] = new KElementData('none');
        const elem =document.getElementById(`${eid}div`);
        if (elem){
            elem.className = 'hidden';
        }
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
            case 'Escape':
                handleDelete();
                break;
            default:
                break;
        }
    };

    return (
        <div
            id={`${eid}div`}
            key={eid}
            className='element-container'
            style={{
                position: 'absolute',
                left: style.x,
                top: style.y,
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
    )
}

export const KButton:React.FC<KElementProps> = ({eid}) => {
    return (
        <KElement eid={eid} childNode={
            <button
                id={`${eid}`}
                className='element'
                onDoubleClick={() => {handleEditText(eid)}}
            ></button>
        } />
    )
}

export const KLatex:React.FC<KElementProps> = ({eid}) => {
    return (
        <KElement eid={eid} childNode={
            <p
                id={`${eid}`}
                className='element'
                onDoubleClick={() => handleEditText(eid, true)}
            ></p>
        } />
    )
}
export const KTextArea:React.FC<KElementProps> = ({eid}) => {
    return (
        <KElement eid={eid} childNode={
            <textarea
                id={`${eid}`}
                className='element'
            ></textarea>
        } />
    )
}

export const KImage:React.FC<KElementProps> = ({eid, info}) => {
    return (
        <KElement eid={eid} childNode={
            <img
                id={`${eid}`}
                className='element'
                src={info}
                draggable="false"
            ></img>
        } />
    )
}
export const KComponents: Map<string, React.FC<KElementProps>> = new Map([
    ["button", KButton],
    ["latex", KLatex],
    ["textarea", KTextArea],
    ["image", KImage]
]);

export default KComponents;
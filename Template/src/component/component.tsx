import useKElemHook from "./hook";
import { handleEditText } from "./utility";

interface KElementProps {
    childNode: React.ReactNode;
}

export const KElement:React.FC<KElementProps> = ({childNode}) => {
    const {style, handleMouseDown} = useKElemHook();

    return (
        <div
            key={Date.now()}
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
        >
            {childNode}
        </div>
    )
}

export const Kbutton:React.FC<{ id: number }> = ({id}) => {
    return (
        <KElement childNode={
            <button
                key={`${id}`}
                id={`${id}`}
                className='element'
                onDoubleClick={() => handleEditText(id)}
            >
                Button
            </button>
        }/>
    )
}

export const KLatex:React.FC<{ id: number }> = ({id}) => {
    return (
        <KElement childNode={
            <p
                id={`${id}`}
                key={`${id}`}
                className='element'
                onDoubleClick={() => handleEditText(id, true)}
            >
                Button
            </p>
        }/>
    )
}
export const KTextArea:React.FC<{ id: number }> = ({id}) => {
    return (
        <KElement childNode={
            <textarea
                id={`${id}`}
                key={`${id}`}
                className='element'
            ></textarea>
        }/>
    )
}

export const KImage:React.FC<{ id: number, imgUrl:string }> = ({id, imgUrl}) => {
    return (
        <KElement childNode={
            <img
                id={`${id}`}
                key={`${id}`}
                className='element'
                src={imgUrl}
                draggable="false"
            ></img>
        }/>
    )
}


export default Kbutton;
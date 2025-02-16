export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;
export const defaultSV = {x: 120, y: 120, width: 220, height: 110};
export type SV = typeof defaultSV;
export const defaultFileName = 'untitled';

export interface StyleMap {
    [key:string]:string;
}

export interface SerializedElement {
    id?: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    inner: string;
    style?: StyleMap;
}

export interface SerializedSlide {
    background?: string;
    elemProp: SerializedElement[];
}

export type SerializedDeck = SerializedSlide[];

export class KElementData {
    public name:string;
    public constructor(
        elemType:string,
        public x:number =defaultSV.x,
        public y:number =defaultSV.y,
        public width:number =defaultSV.width,
        public height:number =defaultSV.height,
        public inner = '',
        public style:StyleMap = {},
        public rotation = 0
    ){
        this.name = elemType;
        if (this.inner === ''){
            if (elemType === 'latex') {
                this.inner = '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}';
            } else if (elemType === 'code') {
                this.inner = 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}';
            } else if (elemType === 'markdown') {
                this.inner = '## Slide Heading\n- First key point\n- Second `inline` point';
            } else {
                this.inner = elemType;
            }
        }
    }
}


export class KSlide {
    public elemProp:Map<number, KElementData> = new Map();
    public background = 'azure';
    private nextEid = 0;
    
    public elements(): [number, KElementData][] {
        return Array.from(this.elemProp.entries());
    }

    public numElement():number{
        if (this.elemProp.size > 0) {
            const maxKey = Math.max(...this.elemProp.keys());
            if (maxKey + 1 > this.nextEid) {
                this.nextEid = maxKey + 1;
            }
        }
        return this.nextEid;
    }

    public push(elemType:string, info = ''): number {
        const eid = this.numElement();
        this.set(eid, elemType, info);
        this.nextEid = eid + 1;
        return eid;
    }
    public set(eid:number, elemType:string, info = ''){
        this.elemProp.set(eid, new KElementData(elemType, defaultSV.x, defaultSV.y, defaultSV.width, defaultSV.height, info));
        if (eid >= this.nextEid) {
            this.nextEid = eid + 1;
        }
    }
    public get(eid:number):KElementData{
        return this.elemProp.get(eid)?? new KElementData('none');
    }
    public del(eid:number){
        this.elemProp.delete(eid);
    }

}

export class KSlideSet {
    public static slides:KSlide[] = [new KSlide()];
    public static curFrame = 0;
    public static editingMode = false;
    public static view = {x:0, y:0};
    public static scale = 1;
    public static activeEID:number|null = null;

    public static numElement(frame = KSlideSet.curFrame){
        return KSlideSet.slides[frame].numElement();
    }

    public static getE(s:number, e:number){
        return KSlideSet.slides[s].get(e);
    }

    public static load(data: string): void {
        let parsedData: unknown;
        try {
            parsedData = JSON.parse(data);
        } catch {
            throw new Error('Invalid .scs file: malformed JSON.');
        }

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error('Invalid .scs file: expected a non-empty array of slides.');
        }

        const loadedSlides = parsedData.map((rawSlide: unknown, slideIdx: number) => {
            if (!rawSlide || typeof rawSlide !== 'object') {
                throw new Error(`Invalid .scs file: slide ${slideIdx} is not an object.`);
            }
            const slideData = rawSlide as Partial<SerializedSlide>;
            if (!Array.isArray(slideData.elemProp)) {
                throw new Error(`Invalid .scs file: slide ${slideIdx} is missing elemProp array.`);
            }

            const slide = new KSlide();
            slide.background = typeof slideData.background === 'string' && slideData.background.trim() !== ''
                ? slideData.background
                : 'azure';

            slideData.elemProp.forEach((rawElem: unknown, index: number) => {
                if (!rawElem || typeof rawElem !== 'object') {
                    return;
                }
                const elemPropData = rawElem as Partial<SerializedElement>;
                const name = typeof elemPropData.name === 'string' ? elemPropData.name : 'button';
                const x = typeof elemPropData.x === 'number' && Number.isFinite(elemPropData.x) ? elemPropData.x : defaultSV.x;
                const y = typeof elemPropData.y === 'number' && Number.isFinite(elemPropData.y) ? elemPropData.y : defaultSV.y;
                const width = typeof elemPropData.width === 'number' && Number.isFinite(elemPropData.width) ? elemPropData.width : defaultSV.width;
                const height = typeof elemPropData.height === 'number' && Number.isFinite(elemPropData.height) ? elemPropData.height : defaultSV.height;
                const rotation = typeof elemPropData.rotation === 'number' && Number.isFinite(elemPropData.rotation) ? elemPropData.rotation : 0;
                const inner = typeof elemPropData.inner === 'string' ? elemPropData.inner : '';
                const style: StyleMap = elemPropData.style && typeof elemPropData.style === 'object'
                    ? { ...elemPropData.style }
                    : {};
                const eid = typeof elemPropData.id === 'number' && Number.isInteger(elemPropData.id) && elemPropData.id >= 0
                    ? elemPropData.id
                    : index;
                slide.elemProp.set(eid, new KElementData(name, x, y, width, height, inner, style, rotation));
            });
            return slide;
        });

        KSlideSet.slides = loadedSlides;
        KSlideSet.curFrame = 0;
        KSlideSet.activeEID = null;
    }

    public static save(): string {
        // Serialize slides to JSON string
        const data: SerializedDeck = this.slides.map((slide: KSlide) => {
            const elemPropArray: SerializedElement[] = [];
            slide.elemProp.forEach((elemProp: KElementData, eid: number) => {
                elemPropArray.push({
                    id: eid,
                    name: elemProp.name,
                    x: elemProp.x,
                    y: elemProp.y,
                    width: elemProp.width,
                    height: elemProp.height,
                    rotation: elemProp.rotation,
                    inner: elemProp.inner,
                    style: { ...elemProp.style }
                });
            });
            return { background: slide.background, elemProp: elemPropArray };
        });
        return JSON.stringify(data);
    }
}

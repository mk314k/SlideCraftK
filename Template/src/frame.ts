import React from "react";
import { defaultSV } from "./component/utility";

export class KElementData {
    public name:string;
    public constructor(
        elemType:string,
        public x:number =defaultSV.x,
        public y:number =defaultSV.y,
        public width:number =defaultSV.width,
        public height:number =defaultSV.height,
        public inner = ''
    ){
        this.name = elemType;
        if (this.inner === ''){
            this.inner = elemType;
        }
    }
}


export class KSlide {
    public elemList:React.ReactNode[] = [];
    public elemProp:KElementData[] = [];

    public pushProp(elemType:string){
        this.elemProp.push(new KElementData(elemType))
    }
}

export class KSlideSet {
    public static slides:KSlide[] = [new KSlide()];
    public static curFrame = 0;

    public static numElement(frame = KSlideSet.curFrame){
        return KSlideSet.slides[frame].elemProp.length;
    }

    public static getE(s:number, e:number){
        return KSlideSet.slides[s].elemList[e]
    }

    public static load(data: string) {
        // Parse the data string and update slides and everything inside
        const parsedData = JSON.parse(data);
        // Example logic: assuming data is an array of slides
        KSlideSet.slides = parsedData.map((slideData: KSlide) => {
            const slide = new KSlide();
            slide.elemProp = slideData.elemProp.map((elemPropData: KElementData) => {
                return new KElementData(elemPropData.name, elemPropData.x, elemPropData.y, elemPropData.width, elemPropData.height, elemPropData.inner);
            });
            return slide;
        });
    }

    public static save(): string {
        // Return string of all the things inside slides
        const data = this.slides.map((slide: KSlide) => {
            return {
                elemProp: slide.elemProp.map((elemProp: KElementData) => {
                    return {
                        name: elemProp.name,
                        x: elemProp.x,
                        y: elemProp.y,
                        width: elemProp.width,
                        height: elemProp.height,
                        inner: elemProp.inner
                    };
                })
            };
        });
        return JSON.stringify(data);
    }
}

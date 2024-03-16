import React from "react";
import { defaultSV } from "./component/utility";

export class KElement {
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
        this.inner = elemType;
    }
}


export class KSlide {
    public elemList:React.ReactNode[] = [];
    public elemProp:KElement[] = [];

    public pushProp(elemType:string){
        this.elemProp.push(new KElement(elemType))
    }
}

export class KSlideSet {
    public static slides:KSlide[] = [new KSlide()];
    public static curFrame = 0;

    public static load(data: string) {
        // Parse the data string and update slides and everything inside
        const parsedData = JSON.parse(data);
        // Example logic: assuming data is an array of slides
        this.slides = parsedData.map((slideData: KSlide) => {
            const slide = new KSlide();
            slide.elemProp = slideData.elemProp.map((elemPropData: KElement) => {
                return new KElement(elemPropData.name, elemPropData.x, elemPropData.y, elemPropData.width, elemPropData.height, elemPropData.inner);
            });
            return slide;
        });
    }

    public static save(): string {
        // Return string of all the things inside slides
        const data = this.slides.map((slide: KSlide) => {
            return {
                elemProp: slide.elemProp.map((elemProp: KElement) => {
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

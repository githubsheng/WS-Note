///<reference path="typings/extended.d.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="typings/extended.d.ts"/>

namespace FreeDrawNamespace {
    
    export function* createCanvasBasedOnImageData(blob: Blob, imageDataId?: number) {
        let img = yield createImageFromBlob(blob);
        return createCanvasBasedOnImage(img, imageDataId);
    }

    export function createCanvasBasedOnImage(img: HTMLImageElement, imageDataId?: number) {
        let canvas = document.createElement("canvas");
        canvas.imageDataId = imageDataId;
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas;
    }

    export function getBlobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob>{
        return new Promise<Blob>((resolve) => {
            canvas.toBlob(function(blob: Blob){
                resolve(blob);
            });
        });
    }

    export function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
        let objectURL = window.URL.createObjectURL(blob);
        return new Promise<HTMLImageElement>(function (resolve) {
            let img = new Image();
            img.src = objectURL;
            img.onload = function () {
                // But don't leak memory!
                // This is necessary when use ObjectURL
                // this is one of the reason i don't use execCommand.insertImage
                window.URL.revokeObjectURL(this.src);
                resolve(img);
            }
        });
    }

    export function createImageFromRegularURL(url: string): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>(function (resolve) {
            let img = new Image();
            img.src = url;
            img.onload = function () {
                resolve(img);
            }
        });
    }
}


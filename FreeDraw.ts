///<reference path="typings/extended.d.ts"/>
class FreeDraw {
    private imgId: number;
    public canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(img: HTMLImageElement, imgId?: number){
        this.imgId = imgId;
        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        this.ctx = ctx;
        ctx.drawImage(img, 0, 0);
    }

    toBlob() {
        return new Promise<Blob>((resolve) => {
            this.canvas.toBlob(function(blob: Blob){
                resolve(blob);
            });
        });
    }
}
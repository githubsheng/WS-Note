/**
 * Created by wangsheng on 7/5/16.
 */

class FreeDraw {
    private imgId: number;
    public canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(imgId: number, img: HTMLImageElement){
        this.imgId = imgId;
        let canvas = document.createElement("canvas");
        this.canvas = canvas;
        canvas.width = 100;
        canvas.height = 100;
        let ctx = canvas.getContext("2d");
        this.ctx = ctx;
        ctx.drawImage(img, 0, 0);
    }
}
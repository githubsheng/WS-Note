///<reference path="typings/extended.d.ts"/>

class FreeDrawCanvas {

    static pencilMode: string = "pencil";
    static eraserMode: string = "eraser";

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private isMouseDown = false;
    private mouseX: number;
    private mouseY: number;
    private eraserSize = 4;
    private mode: string = FreeDrawCanvas.pencilMode;

    constructor(img: HTMLImageElement){
        this.canvas = document.createElement("canvas");
        this.canvas.width = img.width;
        this.canvas.height = img.height;

        this.context = this.canvas.getContext("2d");

        let canvas = this.canvas;
        let context = this.context;

        this.setPencil();
        this.setEraserSize(4);

        context.drawImage(img, 0, 0);

        let mouseMoveListener = (evt: MouseEvent) => {
            this.mouseX = evt.clientX;
            this.mouseY = evt.clientY;
        };

        canvas.onmousedown = (evt: MouseEvent) => {

            this.isMouseDown = true;

            this.mouseX = evt.clientX;
            this.mouseY = evt.clientY;

            canvas.addEventListener("mousemove", mouseMoveListener);

            let mcp = this.windowToCanvas(this.mouseX, this.mouseY);

            let startX = mcp.x;
            let startY = mcp.y;

            context.beginPath();
            context.moveTo(startX, startY);
            context.fillStyle = "white";

            this.draw();
        };

        canvas.onmouseup = (evt: MouseEvent) => {
            this.isMouseDown = false;
            canvas.removeEventListener("mousemove", mouseMoveListener);
        };

        canvas.onmouseout = (evt: MouseEvent) => {
            this.isMouseDown = false;
            canvas.removeEventListener("mousemove", mouseMoveListener);
        };
    }

    private windowToCanvas(x: number, y: number): {x: number, y: number} {
        let canvas = this.canvas;
        let bbox = canvas.getBoundingClientRect();
        return {
            x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top * (canvas.height / bbox.height)
        }
    }

    private pencil(endX: number, endY: number){
        let context = this.context;
        context.lineTo(endX, endY);
        context.stroke();
    }

    private eraser(endX: number, endY: number) {
        let context = this.context;
        let eraserSize = this.eraserSize;
        context.save();
        context.beginPath();
        context.arc(endX, endY, eraserSize, 0, Math.PI*2, false);
        context.clip();
        context.fill();
        context.restore();
    }

    private draw(){
        requestAnimationFrame(() => {
            let mcp = this.windowToCanvas(this.mouseX, this.mouseY);
            let endX = mcp.x;
            let endY = mcp.y;

            if(this.mode === FreeDrawCanvas.pencilMode) {
                this.pencil(endX, endY);
            } else if(this.mode === FreeDrawCanvas.eraserMode) {
                this.eraser(endX, endY);
            }

            if(this.isMouseDown) this.draw();
        });
    }

    public setPencil(){
        let canvas = this.canvas;
        this.mode = FreeDrawCanvas.pencilMode;
        canvas.classList.remove("eraser");
        canvas.classList.add("pencil");
    }

    public setEraser(){
        let canvas = this.canvas;
        this.mode = FreeDrawCanvas.eraserMode;
        canvas.classList.remove("pencil");
        canvas.classList.add("eraser");
    }

    public setColor(color: string) {
        this.context.strokeStyle = color;
    }

    public setLineWidth(width: number) {
        this.context.lineWidth = width;
    }

    public setEraserSize(size: number){
        let canvas = this.canvas;
        this.eraserSize = size;
        canvas.classList.remove("x1");
        canvas.classList.remove("x2");
        canvas.classList.remove("x4");
        canvas.classList.add("x"+ size);
    }

    public getBlobPromise(): Promise<Blob> {
        let canvas = this.canvas;
        return new Promise<Blob>((resolve) => {
            canvas.toBlob(function(blob: Blob){
                resolve(blob);
            });
        });
    }
}



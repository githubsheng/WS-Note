
interface HTMLCanvasElement {
    toBlob(callback: (blob: Blob) => void): void;
    imageDataId?: number;
}

interface HTMLImageElement {
    imageDataId?: number;
}

function runGenerator(genFunc:() => IterableIterator<any>) {

    let iterator = genFunc();
    let result:IteratorResult<any>;

    function iterate(value?:any) {
        result = iterator.next(value);
        if (!result.done) {
            if (result.value instanceof Promise) {
                result.value.then(iterate, reject);
            } else {
                iterate(result.value);
            }
        }
    }

    function reject(reason){
        console.log(reason);
        throw new Error("promise is rejected");
    }

    iterate();
}

let r = runGenerator;

//create an image and assign an object url to its src. once the image is loaded, release memory and resolve
function createImageFromObjectURL(objectURL:string) {
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

function createImageFromRegularURL(url: string) {
    return new Promise<HTMLImageElement>(function (resolve) {
        let img = new Image();
        img.src = url;
        img.onload = function () {
            resolve(img);
        }
    });
}
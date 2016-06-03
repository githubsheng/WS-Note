///<reference path="../CommonModels.ts"/>
///<reference path="../typings/extended.d.ts"/>
///<reference path="../ContentTransformer.ts"/>

namespace TestUtilNamespace {

    import addChildAndNormalize = ContentTransformerNamespace.addChildAndNormalize;

    export function shouldBeEqual(left: any, right: any, compareFunc?: (a: any, b: any) => boolean) {
        if(compareFunc) {
            let r = compareFunc(left, right);
            if(!r) throw new Error("should be equal");
        } else if(left !== right) {
            throw new Error("should be equal");
        }
    }

    export function shouldNotBeEqual(left: any, right: any) {
        if(left === right)
            throw new Error("should not be equal");
    }

    export function shouldBeUndefined(i: any) {
        shouldBeEqual(i, undefined);
    }

    export function shouldNotBeUndefined(i: any) {
        shouldNotBeEqual(i, undefined);
    }

    export function shouldBeTrue(i: any) {
        if(i !== true) throw new Error("should be true");
    }

    export function shouldBeFalse(i: any) {
        if(i !== false) throw new Error("should be false");
    }

    export function shouldInclude(array: any[], ...elements: any[]) {
        let found = 0;
        for(var ai of array)
            if(elements.indexOf(ai) > -1) found++;
        if(elements.length !== found) throw new Error("not all are found");
    }

    export function arrayShouldBeIdentical(a: any[], b: any[]) {
        if(a.length !== b.length) throw new Error('the two arrays are not identical');
        for(let i = 0; i < a.length; i++)
            if(a[i] !== b[i]) throw new Error('the two arrays are not identical');
    }

    export function mapShouldBeIdentical(a: Map<any, any>, b: Map<any, any>) {
        if(a.size !== b.size) throw new Error('the two maps are not identical');
        let aKeys = a.keys();
        for(let key of aKeys) {
            if(a.get(key) !== b.get(key)) throw new Error('the two maps are not identical');
        }
    }

    export function shouldBeInstanceOf(i: any, t: any) {
        if(!(i instanceof t)) throw new Error("not expected type");
    }

    function tn(val: string){
        return document.createTextNode(val);
    }

    function br(){
        return document.createElement("br");
    }

    function img(imageDataId: number){
        let img = document.createElement("img");
        img.imageDataId = imageDataId;
        return img;
    }

    export function createDummyDomContent(root: Node, imgId?: number){
        root.appendChild(tn("WSNote is amazing"));root.appendChild(br());
        root.appendChild(tn(" Data structure 101: there are 一些中文乱入 many types"));root.appendChild(tn(" of lists, singly linked list, doubly linked list, and array list. ,"));root.appendChild(br());
        root.appendChild(tn("this line has some inline `code` and some ~bold text~. another inline `code_fragment`"));root.appendChild(br());
        root.appendChild(tn("@js"));root.appendChild(br());
        root.appendChild(tn("function foo(){"));root.appendChild(br());
        root.appendChild(tn("    console.log(1);"));root.appendChild(br());
        root.appendChild(tn("}"));root.appendChild(br());
        root.appendChild(tn("@"));root.appendChild(br());
        root.appendChild(tn("@line"));root.appendChild(br());
        root.appendChild(img(imgId || 1));root.appendChild(br());
        root.appendChild(br());
    }

    export function createDummyComponents(imgId?: number) {
        let components: Component[] = [];
        components.push({nodeName: "#text", value: "WSNote is amazing"});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: " Data structure 101: there are 一些中文乱入 many types"});
        components.push({nodeName: "#text", value: " of lists, singly linked list, doubly linked list, and array list. ,"});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "this line has some inline `code` and some ~bold text~. another inline `code_fragment`"});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "@js", isBlockLevelMarkup: true});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "function foo(){", codeLanguage: CodeLanguage.js});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "    console.log(1);", codeLanguage: CodeLanguage.js});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "}", codeLanguage: CodeLanguage.js});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "@", isBlockLevelMarkup: true});components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "@line", isBlockLevelMarkup: true});components.push({nodeName: "br"});
        components.push({nodeName: "img", imageDataId: imgId || 1});components.push({nodeName: "br"});
        components.push({nodeName: "br"});
        return components;
    }

    export function normalizeComponents(components: Component[]) {
        let normalized = [];
        for(let c of components) {
            addChildAndNormalize(normalized, c);
        }
        return normalized;
    }

}


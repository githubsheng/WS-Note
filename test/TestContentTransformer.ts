///<reference path="../ContentTransformer.ts"/>
///<reference path="TestUtil.ts"/>

namespace TestContentTransformerNamespace {

    import convertToComponentFormat = ContentTransformerNamespace.convertToComponentFormat;
    import Component = ContentTransformerNamespace.Component;

    function testConvertToComponentFormat() {
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

        let codeEditorEle = document.createElement("div");
        codeEditorEle.appendChild(tn("abc"));
        codeEditorEle.appendChild(tn("merge"));
        codeEditorEle.appendChild(br());
        codeEditorEle.appendChild(br());
        codeEditorEle.appendChild(tn("def"));
        codeEditorEle.appendChild(br());
        codeEditorEle.appendChild(tn("ghi"));
        codeEditorEle.appendChild(img(1));
        codeEditorEle.appendChild(br());
        codeEditorEle.appendChild(br());

        let result = convertToComponentFormat(codeEditorEle);
        let expected: Component[] = [];
        expected.push({nodeName: "#text", value: "abcmerge"});
        expected.push({nodeName: "br"});
        expected.push({nodeName: "br"});
        expected.push({nodeName: "#text", value: "def"});
        expected.push({nodeName: "br"});
        expected.push({nodeName: "#text", value: "ghi"});
        expected.push({nodeName: "img", imageDataId: 1});
        expected.push({nodeName: "br"});
        expected.push({nodeName: "br"});

        for(let i = 0; i < expected.length; i++)
            shouldBeEqual(result[i], expected[i], function(a: Component, b: Component):boolean {
                let r = true;
                if(a.nodeName !== b.nodeName) r = false;
                if(a.value !== b.value) r = false;
                if(a.imageDataId !== b.imageDataId) r = false;
                return r;
            });
    }

    export function runContentTransformerTest(){
        testConvertToComponentFormat();
    }

}
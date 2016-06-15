///<reference path="../CommonModels.ts"/>
///<reference path="../Tokenizor.ts"/>
///<reference path="../Digest.ts"/>
///<reference path="TestUtil.ts"/>

namespace TestDigestNamespace {

    import tokenize = TokenizorNamespace.tokenize;
    import shouldBeEqual = TestUtilNamespace.shouldBeEqual;
    import digest = DigestNamespace.digest;
    function createBRComponent(){
        return {nodeName: "br"};
    }

    function createTextComponentWith(text: string):Component {
        return {nodeName: "#text", value: text};
    }

    function createDummyTokenizedParagraph(): Component[]{
        let c1 = createTextComponentWith("concat creates a new array consisting of the elements in the object on which it is called, followed in ");
        c1.tokens = tokenize(c1);
        let c2 = createBRComponent();
        let c3 = createTextComponentWith("order by, for each argument, the elements of that argument (if the argument is an array) or the argument itself");
        c3.tokens = tokenize(c3);
        let c4 = createBRComponent();
        let c5 = createTextComponentWith("(if the argument is not an array). concat does not alter this or any of the arrays provided as arguments (and here extra content to make really long and long and long and long) but instead ");
        c5.tokens = tokenize(c5);
        let c6 = createBRComponent();
        let c7 = createTextComponentWith("returns a shallow copy that contains copies of the same elements combined from the original arrays.");
        c7.tokens = tokenize(c7);
        let c8 = createBRComponent();
        return [c1, c2, c3, c4, c5, c6, c7, c8];
    }

    export function testDigest(){
        let components = createDummyTokenizedParagraph();
        let keyWords = new Set<string>();
        keyWords.add("array");
        keyWords.add("elements");
        keyWords.add("shallow");
        let frag = digest(components, keyWords);
        /*
         * append the frag to document.body to see what the frag looks like
         */
        let generatedNodes = frag.childNodes;
        shouldBeEqual(generatedNodes[0].nodeValue, "...");
        shouldBeEqual(generatedNodes[1].nodeValue, "is not an ");
        shouldBeEqual(generatedNodes[2].firstChild.nodeValue, "array");
        shouldBeEqual(generatedNodes[3].nodeValue, "). concat does not alter this or any of the arrays provided as arguments (and ... content to make really long and long and long and long) but instead  returns a ");
        shouldBeEqual(generatedNodes[4].firstChild.nodeValue, "shallow");
        shouldBeEqual(generatedNodes[5].nodeValue, " copy that contains copies of the same ");
        shouldBeEqual(generatedNodes[6].firstChild.nodeValue, "elements");
        shouldBeEqual(generatedNodes[7].nodeValue, " combined from the");
        shouldBeEqual(generatedNodes[8].nodeValue, "...");
    }


}
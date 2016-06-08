///<reference path="../CommonModels.ts"/>
///<reference path="../Tokenizor.ts"/>
///<reference path="TestUtil.ts"/>

namespace TestTokenizerNamespace {

    import tokenize = TokenizorNamespace.tokenize;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;
    import shouldBeUndefined = TestUtilNamespace.shouldBeUndefined;

    export function runTokenizorTest(){

        let w = WordType.word;
        let sw = WordType.stopWord;
        let ws = WordType.whitespace;
        let im = WordType.inlineLevelMarkup;
        let ud = WordType.unknownDelimiter;
        let fn = WordType.functionName;
        let ds = WordType.codeDoubleQuoteString;
        let ss = WordType.specialCodeSymbol;
        let uc = WordType.unknownCodeWord;
        let jk = WordType.jsKeyword;

        let componentA: Component = {nodeName: "#text", value: "This `some code` means something here!"};

        let resultA = tokenize(componentA);
        let expectedResultA ={
            tokenValues: ["This", " ", "`", "some", " ", "code", "`", " ", "means", " ", "something", " ", "here", "!"],
            tokenTypes: [w, ws, im, sw, ws, w, im, ws, w, ws, sw, ws, sw, ud]
        };

        arrayShouldBeIdentical(resultA.tokenValues, expectedResultA.tokenValues);
        arrayShouldBeIdentical(resultA.tokenTypes, expectedResultA.tokenTypes);

        let componentB: Component = {nodeName: "br"};
        shouldBeUndefined(tokenize(componentB));

        let componentC: Component = {nodeName: "#text", value: "  function foo(a, b) {console.log(a, b, \"wang sheng\");}", codeLanguage: CodeLanguage.js};
        let resultC = tokenize(componentC);
        let expectedResultC = {
            tokenValues: ["  ", "function", " ", "foo", "(", "a", ",", " ", "b", ")", " ", "{", "console", ".", "log", "(", "a", ",", " ", "b", ",", " ", "\"wang sheng\"", ")", ";", "}"],
            tokenTypes: [ws, jk, ws, fn, ss, uc, ss, ws, uc, ss, ws, ss, uc, ss, fn, ss, uc, ss, ws, uc, ss, ws, ds, ss, ss, ss]
        };

        arrayShouldBeIdentical(resultC.tokenValues, expectedResultC.tokenValues);
        arrayShouldBeIdentical(resultC.tokenTypes, expectedResultC.tokenTypes);
    }


}
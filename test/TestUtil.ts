/**
 * Created by wangsheng on 16/5/16.
 */

function shouldBeEqual(left: any, right: any, compareFunc?: (a: any, b: any) => boolean) {
    if(compareFunc) {
        let r = compareFunc(left, right);
        if(!r) throw new Error("should be equal");
    } else if(left !== right) {
        throw new Error("should be equal");
    }
}

function shouldNotBeEqual(left: any, right: any) {
    if(left === right)
        throw new Error("should not be equal");
}

function shouldBeUndefined(i: any) {
    shouldBeEqual(i, undefined);
}

function shouldNotBeUndefined(i: any) {
    shouldNotBeEqual(i, undefined);
}

function shouldBeTrue(i: any) {
    if(i !== true) throw new Error("should be true");
}

function shouldBeFalse(i: any) {
    if(i !== false) throw new Error("should be false");
}

function shouldInclude(array: any[], ...elements: any[]) {
    let found = 0;
    for(var ai of array)
        if(elements.indexOf(ai) > -1) found++;
    if(elements.length !== found) throw new Error("not all are found");
}

function arrayShouldBeIdentical(a: any[], b: any[]) {
    if(a.length !== b.length) throw new Error('the two arrays are not identical');
    for(let i = 0; i < a.length; i++)
        if(a[i] !== b[i]) throw new Error('the two arrays are not identical');
}

function shouldBeInstanceOf(i: any, t: any) {
    if(!(i instanceof t)) throw new Error("not expected type");
}
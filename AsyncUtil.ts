/**
 * Created by wangsheng on 11/5/16.
 */

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

    function reject(){
        throw new Error("promise is rejected");
    }

    iterate();
}

let r = runGenerator;
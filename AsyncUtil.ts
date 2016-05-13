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
                result.value.then(iterate);
            } else {
                iterate(result.value);
            }
        }
    }

    iterate();
}

let r = runGenerator;
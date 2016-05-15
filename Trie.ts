/**
 * Created by wangsheng on 15/5/16.
 */

class TrieST {

    public get(key: string): boolean {
        switch (key) {
            case "there":
            case "are":
            case "many":
            case "types":
            case "of":
            case "and":
                return true;
            default:
                return false;
        }
    }

    public put(key: string): void {

    }
}
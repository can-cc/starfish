'use strict';

export class MapDone {
    constructor(cb) {
        this.set = new Set();
        this.cb = cb;
        this.n = 0;
        this.hasExec = false;
    }

    callBack(cb) {
        if( !this.hasExec ){
            this.hasExec = true;
            this.cb();
        }
    }

    reg() {
        let s = Symbol();
        this.set.add(s);
        return () => {
            this.set.delete(s);
            if( this.set.size === 0 ){
                this.callBack();
            }
        };
    }

    done() {
        if( this.set.size === 0 ){
            this.callBack();
        }
    }
}

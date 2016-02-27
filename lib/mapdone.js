'use strict';

export class MapDone {
    constructor(cb) {
        this.set = new Set();
        this.cb = cb;
        this.n = 0;
        console.log('****');
    }

    callBack(cb) {
        this.cb = cb;
    }

    reg() {
        let s = Symbol();
        this.set.add(s);
        return () => {
            this.set.delete(s);
            if( this.set.size === 0 ){
                console.log('ss');
                this.cb();
            }
        };
    }

    done() {
        if( this.set.size === 0 ){
            console.log('ss');
            this.cb();
        }
    }
}

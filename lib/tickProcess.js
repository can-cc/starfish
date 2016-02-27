'use strict';

const interval = 5;

export class TickProcess {
    constructor() {
        this.continue = false;
    }

    start() {
        this.continue = true;
        let tick = () => {
            process.stdout.write('.');
            setTimeout(() => {
                if( this.continue ){
                    tick();
                }
            }, interval);
        };
        tick();
    }

    stop() {
        this.continue = false;
        console.log();
    }
} 

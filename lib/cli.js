'use strict';

import meow from 'meow';

let cli = meow({
    help: [
        'Usage:',
        'wing <command>'
    ]
});

let needHelp = (flags) => {
    if(flags['h'] || flags['help']) {
        cli.help();
        process.exit();
    }
};

let showVersion = (flags) => {
    if(flags['v'] || flags['version']){
        cli.version();
        process.exit();
    }
};


cli.run = function() {
    let cmd = this.input[0] || '',
        flags = this.flags,
        isThere = !! (flags['t'] || flags['there']);

    needHelp(flags);
    showVersion(flags);
    
    switch (cmd) {
    case 'render':
        
        break;
    case 'serve':
        break;
    case 'help':
        this.help();
        break;
    case 'version':
        cli.version();
        break;
    default:
        this.help();
    }
};

export default cli;

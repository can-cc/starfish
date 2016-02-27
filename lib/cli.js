'use strict';

import meow from 'meow';
import {isFile, isDir} from './util';
import {output, error, log} from './message';
import {renderFile, renderDir, writeFile, joinPwd} from './render';
import {DEFAULT_THEME, TMP_NAME, TMPDIR} from '../config';
import {TickProcess} from './tickProcess';
import {server} from './server';
import * as path from 'path';

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
        isThere = !! (flags['t'] || flags['there']),
        outputPath = (flags['output']);

    needHelp(flags);
    showVersion(flags);
    
    switch (cmd) {
    case 'render':
        let input = this.input[1];
        if( input ) {
            if( isFile(input) ){
                renderFile(input, DEFAULT_THEME, (data) => {
                    if( outputPath ){
                        writeFile(joinPwd(outputPath), data, () => {
                            
                        });
                    } else {
                        output(data);
                    }
                });
            } else if( isDir(input) ) {
                let outputPath = outputPath || 'build';
                
                let tickProcess = new TickProcess();
                tickProcess.start();
                renderDir(input, DEFAULT_THEME, outputPath, () => {
                    tickProcess.stop();
                    log('Render completion!');
                });
            } else {
                error('Invalid input!');
            }
        } else {
            
        }
        break;
    case 'serve':
        let host = flags['host'] || flags['h'],
        port = flags['port'] || flags['p'];
        
        let inputPath = this.input[1] || '.';

        let outputTmpPath = path.join(TMPDIR, TMP_NAME);
        

        renderDir(inputPath, DEFAULT_THEME, outputTmpPath, () => {
            server(outputTmpPath);
        });
        break;
    case 'init':        
        break;
    case 'new':
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

cli.help = () => {
    cli.showHelp();
};


export default cli;

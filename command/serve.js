'use strict';
import * as path from 'path';

import {server} from '../lib/server';
import {TickProcess} from '../lib/tickProcess';
import {loadConfig, readConfigure} from '../lib/loadConfig';
import {DEFAULT_CONFIG_FILE} from '../config';
import {output, error, log} from '../lib/message';
import {isFile, isDir, logCurrentTime, injectGlobal, filterDotFiles} from '../lib/util';
import {renderFile, RenderController, renderDir, writeFile, joinPwd} from '../lib/render';

export default class ServeCommand {
    constructor() {
        this.name = 'serve';
    }

    getName() {
        return this.name;
    }

    run(inputs, flags) {
        
        let host = flags['host'] || flags['h'],
            port = flags['port'] || flags['p'];
        
        let inputPath = inputs[0] || '.';

        let options = readConfigure(inputPath);
        
        let outputTmpPath = path.join(options.BLOG.TMPDIR, options.BLOG.TMPNAME);
        
        let themeDir = options.STYLE.THEMEDIR[0] === '/' ? options.STYLE.THEMEDIR :
            path.resolve(inputPath, options.STYLE.THEMEDIR),
            
            themePath = path.join(themeDir, options.STYLE.THEME);
        
        let tickProcess = new TickProcess();
        tickProcess.start();
        
        let renderControl = new RenderController(inputPath,
                                                 outputTmpPath,
                                                 options);

        renderControl.render(() => {
            tickProcess.stop();
            logCurrentTime();
            log('Render completion!');
            
            server(outputTmpPath, themePath, inputPath, () => {
                let tickProcess = new TickProcess();
                tickProcess.start();
                renderControl.render(() => {
                    tickProcess.stop();
                    logCurrentTime();
                    log('Render completion!');
                });
            }, port, host);
        });

    }
}


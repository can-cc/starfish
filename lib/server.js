'use strict';


import {takeFileName, isSuffix} from './util';
import {DEFAULT_PORT, DEFAULT_HOST} from '../config';
import {log} from './message';
import httpServer from 'http-server/lib/http-server';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

let R = require('ramda');

export let server = (targetPath, port = DEFAULT_PORT, host = DEFAULT_HOST, themePath, reload) => {
    let options = {
        root: targetPath
    };
    
    let server = httpServer.createServer(options);
    server.listen(port, host, () => {
        console.log(`Server Listen on ${host}:${port} `);
    });

    let themeStaticPath = path.join(themePath, 'static');
    fs.watch(themeStaticPath, {persistent: true,
                               recursive: true},
             (event, filename) => {
                 // ignore dot file
                 // TODO do it better
                 if( filename && takeFileName(filename)[0] !== '.' ){
                     fs.createReadStream(path.join(themeStaticPath, filename))
                         .pipe(fs.createWriteStream(path.join(targetPath, 'static', filename)));
                 }  
             });

    let isHtmlFile = R.curry(isSuffix, 'html');
    fs.watch(themePath, {
        persistent: true,
        recursive: true
    }, (event, filename) => {
        if( isHtmlFile(filename) ){
            reload();
        }
    });
};


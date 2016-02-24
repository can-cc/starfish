'use strict';

import * as path from 'path';
import * as fs from 'fs';

const configFileName = 'config.yaml';

export function createConfigFile(path, cb) {
    let tempAbsolutePath = path.resolve(__dirname, '../temp/config.temp.yaml');
    fs.readFile(tempAbsolutePath, 'utf-8', (data) => {
        let targetFilePath = path.resolve(path, configFileName);
        fs.writeFile(targetFilePath, data, (err) => {
            if( err ){
                throw err;
            } else {
                cb();
            }
        });
    });
}



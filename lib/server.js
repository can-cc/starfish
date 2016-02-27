'use strict';

import {DEFAULT_PORT, DEFAULT_HOST} from '../config';
import {log} from './message';
import httpServer from 'http-server/lib/http-server';


export let server = (path, port = DEFAULT_PORT, host = DEFAULT_HOST) => {
    let options = {
        root: path
    };

    let server = httpServer.createServer(options);
    server.listen(port, host, () => {
        console.log(`Server Listen on ${host}:${port} `);
    });
};


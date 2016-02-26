'use strict';

import express from 'express';

import * as fs from 'fs';
import * as path from 'path';

let app = express();

app.use(express.static('www'));

import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import moment from 'moment';
import md5 from 'blueimp-md5';
import R from 'fw-ramda';
const pfs = bluebird.promisifyAll(fs);

export default class Category {
  constructor(inputPath, outputPath, meta, controller) {
    this.name = meta.name;
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    this.controller = controller;
  }

  async loadArticles() {
    const paths = await pfs.readdirAsync(this.inputPath);

  }

  render() {

  }
}

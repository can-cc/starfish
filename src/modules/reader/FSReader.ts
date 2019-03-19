import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import { Reader } from "./Reader";
import { isDir } from '../../lib/util';

export class FSReader implements Reader {

    // TODO rename more common
    public readCategoryPaths(blogInputPath: string): string[] {
        return fs
            .readdirSync(blogInputPath)
            .filter(p => isDir(path.join(blogInputPath, p)));
    }

    public readDirPaths(dirPath: string): string[] {
        return fs.readdirSync(dirPath);
    }

    public readYaml(filePath: string): string {
        return yaml.safeLoad(
            fs.readFileSync(filePath, 'utf8')
          );
    }

    public fileExist(filePath: string): boolean {
        return fs.existsSync(filePath);
    }
}
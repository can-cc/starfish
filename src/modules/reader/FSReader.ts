import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import { Reader } from "./Reader";
import { isDir } from '../../lib/util';

// 
export class FSReader implements Reader {

    public readCategoryPaths(blogInputPath: string): string[] {
        return fs
            .readdirSync(blogInputPath)
            .filter(p => isDir(path.join(blogInputPath, p)));
    }

    public readYaml(filePath: string): string {
        return yaml.safeLoad(
            fs.readFileSync(filePath, 'utf8')
          );
    }
}
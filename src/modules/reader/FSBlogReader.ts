import fs from 'fs';
import path from 'path';
import { BlogReader } from "./BlogReader";
import { isDir } from '../../lib/util';

// 
export class FSBlogReader implements BlogReader {

    public readCategoryPaths(blogInputPath: string): string[] {
        return fs
            .readdirSync(blogInputPath)
            .filter(p => isDir(path.join(blogInputPath, p)));
    }
}
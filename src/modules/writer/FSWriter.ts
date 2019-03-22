import fs from 'fs';
import { Writer } from "./Writer";
import * as fsExtra from 'fs-extra';


export class FSWriter implements Writer {
    public writeFileSync(filePath: string, content: string): void {
      fs.writeFileSync(filePath, content);
    }

    public mkdirSync(path: string): void {
      fs.mkdirSync(path);
    }

    public copySync(sourcePath: string, targetPath: string): void {
      fsExtra.copySync(
        sourcePath,
        targetPath
      );
    }
}
import fs from 'fs';
import { Writer } from "./Writer";

export class FSWriter implements Writer {
    public writeFileSync(filePath: string, content: string): void {
      fs.writeFileSync(filePath, content);
    }

    public mkdirSync(path: string): void {
      fs.mkdirSync(path);
    }
}
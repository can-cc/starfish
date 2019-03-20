

export interface Writer {
    writeFileSync: (filePath: string, content: string) => void;
    mkdirSync: (path: string) => void;
    
}

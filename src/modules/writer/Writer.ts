

export interface Writer {
    writeFileSync: (filePath: string, content: string) => void;
}

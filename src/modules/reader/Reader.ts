

export interface Reader {
  readCategoryPaths(blogInputPath: string): string[];
  readYaml(filePath: string): any;
  // TODO remove
  fileExist(filePath: string): boolean;
  existsSync: (path: string) => boolean;
  readDirPaths(dirPath: string): string[];
  readFileSync(filePath: string): string;
}
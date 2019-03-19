

export interface Reader {
  readCategoryPaths(blogInputPath: string): string[];
  readYaml(filePath: string): any;
  fileExist(filePath: string): boolean;
  readDirPaths(dirPath: string): string[];
}
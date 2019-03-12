

export interface Reader {
  readCategoryPaths(blogInputPath: string): string[];
  readYaml(filePath: string): any;
}
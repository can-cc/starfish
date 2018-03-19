interface CategoryConfigure {
  aliasName?: string;
}

interface ArticleData {
  id: string;
  type: string;
  path: string;
  title: string;
  content: string;
  hasAsset: boolean;
  createTime: number;
  modifyTime: number;
  showTime: number;
}

interface CategoryData {
  path: string;
  categoryName: string;
  articles: ArticleData[];
}

interface PluginOptions {
  rootInputPath: string;
  rootOutputPath: string;
}

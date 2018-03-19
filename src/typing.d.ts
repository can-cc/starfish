interface CategoryConfigure {
  aliasName?: string;
}

interface ArticleData {
  id: string;
  type: string;
  path: string;
  dirPath: string;
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

interface CategoryItem {
  categoryName: string;
}

interface CategoryListData {
  categoryList: CategoryItem[];
  categoryListOutputPath: string;
}

interface PluginOptions {
  rootInputPath: string;
  rootOutputPath: string;
  blogConfigure: any;
}

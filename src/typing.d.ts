declare interface CategoryConfigure {
  aliasName?: string;
}

declare interface ArticleData {
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

declare interface CategoryItem {
  path: string;
  categoryName: string;
}

declare interface CategoryData extends CategoryItem {
  articles: ArticleData[];
}

declare interface CategoryListData {
  categoryList: CategoryItem[];
  path: string;
}

declare interface PluginOptions {
  rootInputPath: string;
  rootOutputPath: string;
  blogConfigure: any;
}

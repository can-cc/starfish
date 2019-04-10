declare interface BlogConfigure {
  AUTHOR: {
    NAME: string;
    GITHUB: string;
  };
  BLOG: {
    DOMAIN: string;
    ARTICLES_DIR: string;
    NAME: string;
    DESC: string;
    TMPDIR: string;
    TMPNAME: string;
    PORT: number;
    HOST: string;
    INDEX_ARTICLE_NUMBER: number;
    SORT_ARTICLE_BY: 'create' | 'update';
    IGNORE_CATEGORY_RENDER: boolean;
  };
  CONFIG: {
    CONFIG_FILE: string;
    IGNORE_FILE: string;
  };
  STYLE: {
    THEMEDIR: string;
    THEME: string;
    THEME_CONFIG_FILE: string;
  };
  MAPPING: {
    [key: string]: string;
  };
  LANG: string;
}

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

declare interface ArticleDocument {
  title: string;
  date?: string;
  content: string;
  type: string;
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

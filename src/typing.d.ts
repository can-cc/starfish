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
  createTime: Date;
  modifyTime: Date;
  showTime: Date;
}

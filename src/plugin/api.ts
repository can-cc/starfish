import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';

export default class StarflishRenderAjaxPlugin {
  name = 'api';
  type = 'redner';

  constructor(
    private options: {
      rootInputPath: string;
      rootOutputPath: string;
    }
  ) {}

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }

  beforeArticleRender(articleData) {}

  afterArticleRender(rawDocument, articleData) {
    let outputPath = path.join(
      articleData.categoryOutputPath,
      articleData.articleFileNameWithoutSuffix
    );
    let outputName = 'index.json';

    fs.writeFileSync(path.join(outputPath, outputName), JSON.stringify(articleData));
  }

  afterwCategoryListRender(data, meta) {
    if (!fs.existsSync(meta.outputPath)) {
      fs.mkdirSync(meta.outputPath);
    }
    fs.writeFileSync(path.join(meta.outputPath, 'index.json'), JSON.stringify(data));
  }

  afterwCategoryRender(rendered, data) {
    fs.writeFileSync(path.join(data.categoryPath, 'index.json'), JSON.stringify(data));
  }

  afterIndexRender(indexData) {
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, 'index.json'),
      JSON.stringify(JSON.stringify(indexData))
    );
  }

  afterRender() {}
}

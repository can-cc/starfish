import RenderController from '../../modules/render/render';

async function main() {
  try {
    const renderCtrl = new RenderController(
      'test/mock-source/',
      'test/test-build/'
      // {
      //   AUTHOR: { NAME: 'rebot', GITHUB: 'AbyChan' },
      //   BLOG: {
      //     NAME: 'test blog name',
      //     DESC: 'describtion',
      //     TMPDIR: '/tmp',
      //     TMPNAME: 'nobbbtmp',
      //     INDEX_ARTICLE_NUMBER: 7,
      //     CATEGORY_ARTICLE_NUMBER: 20,
      //     ALL_PAGE_ARTICLE_NUMBER: 20,
      //     SORT_ARTICLE_BY: 'create',
      //     ARTICLE_SUMMARY_CHAR_NUMBER: 300
      //   },
      //   CONFIG: {
      //     CONFIG_FILE: 'nobbb.config.yaml',
      //     DIR_CONFIG_FILE: '.nobbbconfig.yaml',
      //     IGNORE_FILE: '.nobbbignore'
      //   },
      //   STYLE: { THEMEDIR: '@themes', THEME: 'ng' },
      //   SERVE: { HOST: '0.0.0.0', PORT: '8080' },
      //   MAPPING: {
      //     '@image': '/static/img/',
      //     '@root-asset': '/',
      //     '@demo': '/demo/'
      //   },
      //   LANG: 'zh-CN'
      // }
    );

    await renderCtrl.render();
  } catch (error) {
    console.error(error);
  }
}

main();

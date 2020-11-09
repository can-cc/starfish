# Starfish

a blog render system, support `org-mode` and `markdown`.

also support custom renderer by write a plugin.

## install

`npm install -g starfish-cli`

or 

`yarn add -g starfish-cli`

## use

### render
`starfish render [blog source path]`

### init

# blog source structure

``` bash

```

### configure

`config.yml` example:

``` yaml
AUTHOR:
  NAME: 'test-reboot'
  GITHUB: 'reboot'

BLOG:
  ARTICLES_DIR: 'articles' # place where store articles
  DOMAIN: 'test.starfish.org' # expect blog domain
  HTTPS: false
  NAME: 'reboot blog'
  DESC: 'this is reboot bog'
  TMPDIR: '/tmp'
  TMPNAME: 'NobbBuildTemp'
  PORT: 8080
  HOST: '127.0.0.1'
  INDEX_ARTICLE_NUMBER: 7
  CATEGORY_ARTICLE_NUMBER: 20
  ALL_PAGE_ARTICLE_NUMBER: 20
  SORT_ARTICLE_BY: 'create'
  ARTICLE_SUMMARY_CHAR_NUMBER: 300
  IGNORE_CATEGORY_RENDER: false  # ignore category render

STYLE:
  THEMEDIR: '@themes'
  THEME: 'mock-theme'
  THEME_CONFIG_FILE: 'theme.config.yaml'

CONFIG:
  CONFIG_FILE: 'config.yaml'
  DIR_CONFIG_FILE: '.nobbbconfig.yaml'
  IGNORE_FILE: '.ignore'

SERVE:
  HOST: '0.0.0.0'
  PORT: '8080'

MAPPING:
  '@root-asset/*': '/'

LANG: 'zh-CN'

```



## FAQ
在windows下渲染markdown会有问题
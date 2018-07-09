import { markdown } from 'markdown';
import * as R from 'ramda';

export default class NobbbParseMarkdown {
  name = 'markdown';
  constructor() {
  }

  check(file) {
    return /\.md$/.test(file);
  }

  parse(mdCode) {
    let lines = mdCode.split('\n');
    let infos: any = {};
    let i = 0;
    for (; ; i++) {
      if (/^<!--.+-->$/.test(lines[i])) {
        let info = lines[i].substring(4, lines[i].length - 3);

        let un = info.split(':'),
          key = un[0].toLowerCase(),
          value = R.drop(1, un).join(':');

        infos[key] = value;
      } else {
        break;
      }
    }

    return {
      title: infos.title,
      content: markdown.toHTML(R.drop(i, lines).join('\n')),
      type: this.name
    };
  }
}

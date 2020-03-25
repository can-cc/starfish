import * as marked from 'marked';
import { Parser, ParseResult } from './parser';

export default class MarkdownParser implements Parser {
  public name = 'markdown';

  public check(filePath: string): boolean {
    return /\.md$/.test(filePath);
  }

  public parse(content: string): ParseResult {
    const [infoPart, mdCode] = content.split('---\n');
    const infoItems: string[] = infoPart.split('\n');
    const info: any = infoItems.reduce((infoMap: { [key: string]: string }, item: string) => {
      const [key, value] = item.split(/:(.+)/).map(a => a.trim());
      if (key && (key === 'title' || key === 'date')) {
        infoMap[key] = value;
      }
      return infoMap;
    }, {});

    return {
      title: info.title,
      date: info.date,
      content: marked(mdCode),
      type: this.name
    };
  }
}

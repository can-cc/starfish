import { markdown } from 'markdown';
import * as R from 'ramda';

export default class NobbbParseMarkdown {
  public name = 'markdown';


  public check(filePath: string) {
    return /\.md$/.test(filePath);
  }

  public parse(content: string) {
    const [infoPart, mdCode] = content.split('---\n');
    const infoItems: string[] = infoPart.split('\n');
    const info: any = infoItems.reduce((infoMap: {[key:string]: string}, item: string) => {
      const [key, value] = item.split(':').map(a => a.trim());
      if (key && (key === 'title' || key === 'date')) {
        infoMap[key] = value;
      }
      return infoMap
    }, {})
 
    return {
      title: info.title,
      date: info.date,
      content: markdown.toHTML(mdCode),
      type: this.name
    };
  }
}

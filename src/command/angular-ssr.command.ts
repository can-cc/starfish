import path from 'path';
import ora from 'ora';
import { Command } from './command';

export default class StarFishSSRCommand implements Command {
  public name = 'angular-ssr';
  public type = 'command';

  public run(inputs, flags, blogConfigure) {
    const inputPath = path.resolve(inputs[0]);

    if (!inputPath) {
      return console.error('Please spec blog path.');
    }

    const spinner = ora('Start angular ssr render...').start();

    try {
      let themePath;
      if (blogConfigure.STYLE.THEMEDIR.startsWith('/')) {
        themePath = path.join(blogConfigure.STYLE.THEMEDIR, blogConfigure.STYLE.THEME);
      } else {
        themePath = path.join(inputPath, blogConfigure.STYLE.THEMEDIR, blogConfigure.STYLE.THEME);
      }

      // TODO: let `blog-static` input
      const renderedDistPath = path.join(inputPath, 'blog-static');
      console.log('renderedDistPath', renderedDistPath);
      const renderFn = require(path.join(themePath, 'ssr/ssr.js')).default;
      renderFn({
        rootInputPath: inputPath,
        renderedDistPath,
        themePath
      });
      spinner.succeed('Angular ssr completion 🎉🎉');
    } catch (error) {
      console.error(error);
      spinner.fail('Render Fail...');
    }
  }
}

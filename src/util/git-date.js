import _ from 'lodash';

var exec = require('child_process').exec;

export const getModifyDates = (filePath, rootInputPath, cb) => {
  return new Promise((resovle, reject) => {
    exec(`git log --pretty=format:\'%ad\' ${filePath} | cat`, {
      cwd: rootInputPath
    }, function (error, stdout, stderr) {
      if (error) {return reject(error);}
      const dates =  stdout.split('\n');
      return resovle({
        create: new Date(_.last(dates) || new Date()),
        modify: new Date(_.head(dates) || new Date())
      });
    });
  });
};
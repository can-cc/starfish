'use strict';

let spawn = require('./spawn/spawn.js');

let message = 'Site updated: {{ now(\'YYYY-MM-DD HH:mm:ss\') }}';



let push = (repo, deployDir) => {
    let git = () => {
        var len = arguments.length;
        var args = new Array(len);

        for (var i = 0; i < len; i++) {
            args[i] = arguments[i];
        }

        return spawn('git', args, {
            cwd: deployDir,
            verbose: true
        });
    };
    
    return git('init').then(function(){
        return git('add', '-A').then(function() {
            return git('commit', '-m', message).catch(function() {
                // Do nothing. It's OK if nothing to commit.
            });
        });
    }).then(function() {
        return git('push', '-u', repo.url, 'HEAD:' + repo.branch, '--force');
    });
};


export {push};

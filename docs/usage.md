# 使用
## 渲染
```
./bin/starfish render ~/blog
```
此命令会把 `~/blog` 这个博客项目渲染出一个静态博客站点，在当前的目录下 `build`， 你也可以加上 `--output` 参数，如：
```
./bin/starfish render ~/blog --output="target-dist"
```


### angular-ssr 渲染
> 注意：现在需要到 theme 目录下把 npm 依赖安装好
```
./bin/starfish angular-ssr ~/blog
```
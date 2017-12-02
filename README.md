# fusebox-aurelia-plugin
A FuseBox plugin for bundling Aurelia applications.

[Demo here](https://github.com/arabsight/aurelia-fusebox-demo)

```bash
npm i fusebox-aurelia-plugin fuse-box@next
```

```js
const { FuseBox, BabelPlugin, HTMLPlugin } = require('fuse-box');

const {
    AureliaModuleDependencies,
    AureliaHtmlDependencies
} = require('fusebox-aurelia-plugin');

FuseBox.init({
    homeDir: 'src',
    output: 'dist/$name.js',
    plugins: [
        HTMLPlugin({ useDefault: true }),
        AureliaModuleDependencies(),
        AureliaHtmlDependencies(),
        BabelPlugin()
    ],
    runAllMatchedPlugins: true
});
```

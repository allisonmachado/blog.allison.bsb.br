# My [Blog Website Template](https://blog.allison.bsb.br)

## Install

```sh
npm install bulma-start
```

## What's included

The `npm` dependencies included in `package.json` are:

* <code>[bulma](https://github.com/jgthms/bulma)</code>
* <code>[node-sass](https://github.com/sass/node-sass)</code> to compile your own Sass file
* <code>[postcss-cli](https://github.com/postcss/postcss-cli)</code> and <code>[autoprefixer](https://github.com/postcss/autoprefixer)</code> to add support for older browsers
* <code>[babel-cli](https://babeljs.io/docs/usage/cli/)</code>, <code>[babel-preset-env](https://github.com/babel/babel-preset-env)</code> and <code>[babel-preset-es2015-ie](https://github.com/jmcriffey/babel-preset-es2015-ie)</code> for compiling ES6 JavaScript files

Apart from `package.json`, the following files are included:

* `.babelrc` configuration file for [Babel](https://babeljs.io/)
* `.gitignore` common [Git](https://git-scm.com/) ignored files
* `index.html` this HTML5 file
* `_sass/main.scss` a basic SCSS file that **imports Bulma** and explains how to **customize** your styles, and compiles to `css/main.css`
* `_javascript/main.js` an ES6 JavaScript that compiles to `lib/main.js`

## Setup 

Set up Bulma and run the watchers:

```sh
cd my-bulma-project
npm install
npm start
```

As long as `npm start` is running, it will **watch** your changes. You can edit `_sass/main.scss` and `_javascript/main.js` at will. Changes are **immediately** compiled to their destinations, where `index.html` will pick them up upon reload in your browser.

Some controlling output is written to the `npm start` console in that process:

```sh
_javascript/main.js -> lib/main.js

=> changed: $HOME/projects/start-with-bulma/_sass/main.scss
Rendering Complete, saving .css file...
Wrote CSS to $HOME/projects/start-with-bulma/css/main.css
```
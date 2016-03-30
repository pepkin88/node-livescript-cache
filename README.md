# livescript-cache

Caches the contents of required LiveScript files so that they are not
recompiled to help improve startup time.

It's a fork of `pepkin88/node-coffee-cache`, which is a fork of `trello/node-coffee-cache`.

## What it does

In a Node.js application written in LiveScript, every time you start the
application, all the relevant files must be compiled when they are required. If
you have a very large application, this process can consume a large portion of
your startup time. By caching the compiled JavaScript files, only those that
have been updated must be recompiled, and the rest can be loaded off of the
disk. In our usage, this has reduced the startup time from 7s to 2s, which means
a lot when you have to restart your application every time you want to test a
change.

## Features

- `require` extensions for `.ls` and `.json.ls`
- disk cache for compiled files
- caching source maps
- compatibility with the [`source-map-support`](https://www.npmjs.com/package/source-map-support) module
    – to make use of it, just `npm install` that module to your project

## How to use

1. Add to your package.json dependencies and run `npm install` or run `npm install livescript-cache`.

2.  In your entry point file, add the following:

    ```js
    require('livescript-cache')
    ```

3. That's it. By default the files are cached in the `./.ls/` directory. If
   you want to change this, see below.

## Extra configuration

You can specify the location of the directory to use for the cached files in one
of two ways:

1. Start the process with the `LIVESCRIPT_CACHE_DIR` variable set:

    ```sh
    $ LIVESCRIPT_CACHE_DIR=/tmp/livescript-cache lsc app.ls
    ```

2. Use the `setCacheDir` method on the required module:

    ```livescript
    require('livescript-cache').setCacheDir('../cached/')
    ```

Just make sure your process has permission to create the necessary folder or
files.

---

You can instruct the module to only use a memory cache. This may look like defeating
the main purpose of the module, but it can be still useful, if we want to have
an absolute certainty, that the correct files were loaded (e.g. on production).

To do this, invoke the `useOnlyMemory` method, with an argument or not, like this:

```js
require('livescript-cache').useOnlyMemory(true)
```

or this:

```js
require('livescript-cache').useOnlyMemory()
```

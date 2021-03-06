var fs         = require('fs')
var path       = require('path')
var mkpath     = require('mkpath')
var LiveScript = require('livescript')

// Directory to store compiled source
var cacheDir = process.env['LIVESCRIPT_CACHE_DIR'] || '.ls'

// Root directory of project - use __dirname by default
var rootDir = process.env['LIVESCRIPT_ROOT_DIR'] || '.'

// Storing LiveScript's require extension for backup use
var lsExtension = require.extensions['.ls']

var useOnlyMemory = false

var contentsByFilename = {}

// Only log once if we can't write the cache directory
var logCouldNotWriteCache = function () {
  process.stderr.write(
    "livescript-cache: Could not write cache at " + cacheDir + ".\n"
  )
  logCouldNotWriteCache = function () {}
}

// Compile a file as you would with require and return the contents
function cacheFile(filename) {
  var content = contentsByFilename[filename]
  if (content) return content

  // First, convert the filename to something more digestible and use our cache
  // folder
  var cachePath = path.join(cacheDir, path.relative(rootDir, filename))
    .replace(/\.json\.ls$/i, '.json')
    .replace(/\.ls$/i, '.js')

  if (!useOnlyMemory) {
    // Try and stat the files for their last modified time
    try {
      var cacheTime = fs.statSync(cachePath).mtime
      var sourceTime = fs.statSync(filename).mtime
      if (cacheTime > sourceTime) {
        // We can return the cached version
        content = fs.readFileSync(cachePath, 'utf8')
      }
    } catch (err) {
      // If the cached file was not created yet, this will fail, and that is okay
    }
  }

  // If we don't have the content, we need to compile ourselves
  if (!content) {
    // Read from disk and then compile
    var isJson = /\.json$/i.test(cachePath)
    var compiled = LiveScript.compile(fs.readFileSync(filename, 'utf8'), {
      bare: true,
      header: false,
      filename: filename,
      map: isJson ? 'none' : 'linked-src',
      json: isJson,
    })
    content = isJson ? compiled : compiled.code
    var isInWorkingDirectory = !/^\.\./.test(path.relative(rootDir, filename))

    if (isInWorkingDirectory && !useOnlyMemory) {
      try {
        // Try writing to cache
        mkpath.sync(path.dirname(cachePath))
        fs.writeFileSync(cachePath, content, 'utf8')
        sourceTime.setSeconds(sourceTime.getSeconds() + 1)
        fs.utimesSync(cachePath, sourceTime, sourceTime)
      } catch (err) {
        logCouldNotWriteCache()
      }
    }
  }

  return contentsByFilename[filename] = content
}

// Set up an extension map for .ls files -- we are completely overriding
// LiveScript's since it only returns the compiled module.
require.extensions['.ls'] = function (module, filename) {
  var content = cacheFile(filename)
  if (content)
    // Successfully retrieved the file from disk or the cache
    return module._compile(content, filename)
  else
    // Something went wrong, so we can use LiveScript's require
    return lsExtension.apply(this, arguments)
}

// Set up an extension map for .json.ls files.
require.extensions['.json.ls'] = function (module, filename) {
  var content = cacheFile(filename)
  if (content)
    // Successfully retrieved the file from disk or the cache
    module.exports = JSON.parse(content)
  else
    throw new Error('livescript-cache: Error while loading module ' + filename)
}

try {
  require('source-map-support').install({
    retrieveFile: function (path) {
      return /\.ls$/i.test(path) ? cacheFile(path) : null
    },
  })
} catch (err) {
  // The `source-map-support` module is only optional
}

// Export settings
module.exports = {
  setCacheDir: function (dir, root){
    if (root) {
      rootDir = root
    }

    cacheDir = dir
    return this
  },
  useOnlyMemory: function (use) {
    useOnlyMemory = use !== false
    return this
  },
  cacheFile: cacheFile,
}

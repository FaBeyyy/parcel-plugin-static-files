var fs = require('fs');
var path = require('path');
var outputDir = './dist/static/' //relative to src folder
var sourceDir = './src/'
var fileExtensionsToCopy = ['json', 'html'];
var filesToAdd = []; //obj that has all files that should be added
var filesThatExist = []; //obj that has all files that already exist 

function resolveStaticFiles() { //TODO: check if dist exists 
    fs.stat(outputDir, function (err, stats) {
        if (err) {
            //directory doesn't exist
            console.log('Folder doesnt exist, so I made the folder ');
            mkDirByPathSync(outputDir);
            resolveStaticFiles();
        }
        if (!stats.isDirectory()) {
            console.error('/dist/static/ is not a directory');
        } else {
            walkThroughPath('./src/', filesToAdd); //get all files 
            walkThroughPath(outputDir, filesThatExist); //get already existing files

            filesToAdd = filesToAdd.filter(file => { //if filesToAdd are in filesthatexist remove them from the array
                var n = file.lastIndexOf('/');
                var str = file.substring(n + 1);
                return filesThatExist.every(existingFile => { //.every returns a boolean we can use to filter the array
                    var n2 = existingFile.lastIndexOf('/');
                    var str2 = existingFile.substring(n2 + 1);
                    console.log(str, str2);
                    return str !== str2; //if string in to add is in existing return false -> remove from array
                });
            });
            filesToAdd.forEach(file => {
                const fixedOutput = file.replace(sourceDir, outputDir); //replace source dir with output dir 
                const dirs = fixedOutput.substring(0, fixedOutput.lastIndexOf('/'));
                mkDirByPathSync(dirs); //create directorys if they dont exist
                copyFile(file, fixedOutput);
            })
        }
    });
}

function walkThroughPath(path, fileArray) { //synchronously walk through the folders and add files to an array
    var files = fs.readdirSync(path) //TODO: support folders with . notation by recursevly checking if it is a folder with fs.stat
    if (!files) return;
    files.forEach(file => {
        var newPath = path + file;
        if (file.indexOf('.') === -1) {//is folder
            walkThroughPath(newPath + '/', fileArray);//if folder add /
        } else { //is file
            fileArray.push(newPath);
        }
    })
}

function copyFile(source, target) { //TODO add callback that is called on done
    var cbCalled = false;
    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            console.log();
            cbCalled = true;
        }
    }
}


function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}


resolveStaticFiles();
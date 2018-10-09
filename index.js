const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const prePath = '../../';
const appDir = __dirname;
const outputDir = path.join(appDir, "../../", '/dist/src/'); //relative to src folder
const sourceDir = path.join(appDir, "../../", '/src/');
const outputDirStatic = path.join(appDir, "../../", 'dist/static/');
const sourceDirStatic = path.join(appDir, "../../", '/static/');
const fileExtensionsToCopy = ['json', 'html', 'svg', 'jpg'];
const fileExtensionsToCopyStatic = [...fileExtensionsToCopy, 'js'];
let filesToAdd = []; //obj that has all files that should be added
let filesThatExist = []; //obj that has all files that already exist 
let timeForStatic = false;


function resolveStaticFiles(sourceDir, outputDir, fileExtensionsToCopy) { //TODO: check if dist exists 
    fs.stat(outputDir, function (err, stats) {
        if (err) {
            mkdirp(outputDir);
            return resolveStaticFiles(sourceDir, outputDir, fileExtensionsToCopy);
        }
        if (stats && !stats.isDirectory()) {
            console.error('/dist/ is not a directory');
        } else {
            filesToAdd = [];
            filesThatExist = [];

            walkThroughPath(sourceDir, filesToAdd, fileExtensionsToCopy); //get all files 
            walkThroughPath(outputDir, filesThatExist, fileExtensionsToCopy); //get already existing files

            /*filesToAdd = filesToAdd.filter(file => { //if filesToAdd are in filesthatexist remove them from the array
                const n = file.lastIndexOf('/');
                const str = file.substring(n + 1);
                return filesThatExist.every(existingFile => { //.every returns a boolean we can use to filter the array
                    const n2 = existingFile.lastIndexOf('/');
                    const str2 = existingFile.substring(n2 + 1);
                    return str !== str2; //if string in to add is in existing return false -> remove from array
                });
            });*/
            filesToAdd.forEach(file => {
                const fixedOutput = file.replace(sourceDir, outputDir); //replace source dir with output dir 
                const dirs = fixedOutput.substring(0, fixedOutput.lastIndexOf('/'));
                mkdirp(dirs); //create directorys if they dont exist
                copyFile(file, fixedOutput);
            })
        }
    });
}

function walkThroughPath(path, fileArray, fileExtensionsToCopy) { //synchronously walk through the folders and add files to an array
    const files = fs.readdirSync(path) //TODO: support folders with . notation by recursevly checking if it is a folder with fs.stat
    if (!files) return;
    files.forEach(file => {
        const newPath = path + file;
        if (file.indexOf('.') === -1) {//is folder
            walkThroughPath(newPath + '/', fileArray, fileExtensionsToCopy);//if folder add /
        } else { //is file
            if (fileExtensionsToCopy.includes(file.substring(file.lastIndexOf('.') + 1))) {//get file extension and look up if we should copy it 
                fileArray.push(newPath);
            }
        }
    })
}

function copyFile(source, target) { //TODO add callback that is called on done
    let cbCalled = false;
    const rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    const wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cbCalled = true;
        }
    }
}


module.exports = bundler => {
    bundler.on('buildStart', () => {
        resolveStaticFiles(sourceDir, outputDir, fileExtensionsToCopy);
        resolveStaticFiles(sourceDirStatic, outputDirStatic, fileExtensionsToCopyStatic);
    })
}

/*
fs.readFile(appDir + '/package.json', 'utf8', (err, contents) => {
    if (err) {
        throw new Error('Error reading package.json', err);
    } else {
        const package = JSON.parse(contents);

    }
});*/



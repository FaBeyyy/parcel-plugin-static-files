const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const prePath = '../../';
const appDir = path.dirname(require.main.filename);
const outputDir = path.join(__dirname, "../../", '/dist/static/'); //relative to src folder
const sourceDir = path.join(__dirname, "../../", '/src/');
const fileExtensionsToCopy = ['json', 'html'];
let filesToAdd = []; //obj that has all files that should be added
let filesThatExist = []; //obj that has all files that already exist 

function resolveStaticFiles() { //TODO: check if dist exists 
    fs.stat(outputDir, function (err, stats) {
        if (err) {
            //directory doesn't exist
            console.log('Folder doesnt exist, so I made the folder ');
            console.log(outputDir);
            mkdirp(outputDir);
            resolveStaticFiles();
        }
        if (!stats.isDirectory()) {
            console.error('/dist/static/ is not a directory');
        } else {
            walkThroughPath(sourceDir, filesToAdd); //get all files 
            walkThroughPath(outputDir, filesThatExist); //get already existing files

            filesToAdd = filesToAdd.filter(file => { //if filesToAdd are in filesthatexist remove them from the array
                const n = file.lastIndexOf('/');
                const str = file.substring(n + 1);
                return filesThatExist.every(existingFile => { //.every returns a boolean we can use to filter the array
                    const n2 = existingFile.lastIndexOf('/');
                    const str2 = existingFile.substring(n2 + 1);
                    return str !== str2; //if string in to add is in existing return false -> remove from array
                });
            });
            filesToAdd.forEach(file => {
                const fixedOutput = file.replace(sourceDir, outputDir); //replace source dir with output dir 
                const dirs = fixedOutput.substring(0, fixedOutput.lastIndexOf('/'));
                console.log('creating', dirs);
                mkdirp(dirs); //create directorys if they dont exist
                copyFile(file, fixedOutput);
            })
        }
    });
}

function walkThroughPath(path, fileArray) { //synchronously walk through the folders and add files to an array
    const files = fs.readdirSync(path) //TODO: support folders with . notation by recursevly checking if it is a folder with fs.stat
    if (!files) return;
    files.forEach(file => {
        const newPath = path + file;
        if (file.indexOf('.') === -1) {//is folder
            walkThroughPath(newPath + '/', fileArray);//if folder add /
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
            console.log();
            cbCalled = true;
        }
    }
}



//
module.exports = bundler => {
    bundler.on("bundled", bundle => {
        resolveStaticFiles();
    })
}


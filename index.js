var fs = require('fs');
var outputDir = './dist/' //relative to src folder
var fileExtensionsToCopy = ['json', 'html'];
var filesToAdd = []; //obj that has all files that should be added
var filesThatExist = []; //obj that has all files that already exist 

function resolveStaticFiles() { //TODO: check if dist exists 
    fs.stat(outputDir + 'static/', function (err, stats) {
        if (err) {
            //directory doesn't exist
            console.log('Folder doesnt exist, so I made the folder ');
            return fs.mkdir(outputDir + 'static/', function (err, res) {
                resolveStaticFiles(); //if folder has been created call function again 
            });
        }
        if (!stats.isDirectory()) {
            console.error('/dist/static/ is not a directory');
        } else {
            walkThroughPath('./src/', filesToAdd); //get all files 
            walkThroughPath('./dist/static/', filesThatExist); //get already existing files

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
            console.log(filesToAdd);
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

resolveStaticFiles();
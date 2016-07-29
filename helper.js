var lo = require('lodash');
var path = require('path');
var fs = require('fs');

module.exports = {
    loadObjects: loadObjects,
    getDirectoryList: getDirectoryList,
    manualRequire: manualRequire,
    constructDirectoryList: constructDirectoryList,
    extractObjectPath: extractObjectPath,
    extractScripts: extractScripts,
    getFileName: getFileName,
    validateFileList: validateFileList,
    processExcludes: processExcludes,
    overrideDependency: overrideDependency
};

function overrideDependency(param, imported_interface) {
    for (var key in param) {
        imported_interface[key] = param[key];
    }
}

function manualRequire(dir_list, file, path) {
    return require(path + '/' + lo.replace(dir_list[file], /\./g, '/'));
}

function constructDirectoryList(list, options) {
    var exclude = lo.get(options, 'exclude') || /(\.git|\.svn|node_modules)/;
    var mainList = processExcludes(list, exclude);
    mainList = extractScripts(mainList);
    var fileList = [];
    var currentFile;
    var dir_list = {};
    mainList.forEach(function(obj) {
        currentFile = getFileName(obj);
        fileList.push(currentFile);
        dir_list[currentFile] = extractObjectPath(obj);
    });
    validateFileList(fileList);
    return dir_list;
}

function processExcludes(list, exclude) {
    var response = lo.filter(list, function(entry) {
        return !exclude.test(entry);
    });
    return response;
}

function loadObjects(object_list, req_list, dir_list) {
    for (var key in dir_list) {
        if (!object_list[key])
            object_list[key] = lo.get(req_list, dir_list[key]);
    }
}

function initializeObjectList(dir_list, object_list) {
    for (var key in dir_list) {
        object_list[key] = {};
    }
}

function getDirectoryList(dir) {
    if (!dir) dir = '.';
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(getDirectoryList(file));
        else results.push(file);
    })
    return results;
}

function validateFileList(list) {
    var response = true;
    response = checkDuplicates(list);
    return response;
}

function checkDuplicates(list) {
    var dups = getDuplicates(list);
    if (dups.length > 0) {
        throw 'Dependency naming collision : ' + lo.join(dups, ', ');
        return false;
    } else {
        return true;
    }
}

function getDuplicates(array) {
    return lo.filter(array, function(value, index, iteratee) {
        return lo.includes(iteratee, value, index + 1);
    });
}

function extractObjectPath(file) {
    var response = file;
    if (response) {
        response = lo.split(response, '/');
        if (response.length > 1) {
            response = lo.drop(response);
        }
        response[response.length - 1] = stripExtension(response[response.length - 1]);
        response = lo.join(response, '.');
    }
    return response;
}

function getFileName(file) {
    var response = file;
    if (response) {
        response = lo.split(response, '/');
        response = response[response.length - 1];
        response = stripExtension(response);
    }
    return response;
}

function extractScripts(list) {
    var response = [];
    response = lo.filter(list, isValidFile);
    return response;
}

function isValidFile(file) {
    var extension = getExtension(file);
    return extension === 'js' || extension === 'json';
}

function getExtension(fileName) {
    if (!fileName) {
        return fileName;
    }
    var split = lo.split(fileName, '.');
    if (split.length > 1) {
        return split[split.length - 1];
    } else {
        return fileName;
    }
}

function stripExtension(fileName) {
    var split = lo.split(fileName, '.');
    if (split.length > 1) {
        split = lo.dropRight(split);
    }
    return lo.join(split, '.');
}

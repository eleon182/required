var req = require('require-dir-all');
var path = require('path');
var lo = require('lodash');
var helper = require('./helper');

var directory;
var dir_list;
var isInitialized = false;

var imported_interface = {
    init: init,
    get: get
};

module.exports = imported_interface;

function init(param, options) {
    if (lo.isObject(param)) {
        helper.overrideDependency(param, imported_interface);
        isInitialized = true;
        return;
    }
    var override = lo.get(options, 'override');
    if(override){
        helper.overrideDependency(override, imported_interface);
    }

    if (isInitialized) return imported_interface;
    if (!param) param = '.';

    dir_list = helper.constructDirectoryList(helper.getDirectoryList(param), options);

    var parent = module.parent;
    var parentFile = parent.filename;
    var parentDir = path.dirname(parentFile);
    directory = path.resolve(parentDir, param);

    var req_list = req(directory, {
        recursive: true,
        excludeDirs: lo.get(options, 'exclude')
    });

    helper.loadObjects(imported_interface, req_list, dir_list);
    isInitialized = true;
    return imported_interface;
}

function get(param) {
    if (imported_interface[param]) {
        return imported_interface[param];
    } else if (!isInitialized && dir_list[param]) {
        var customReq = helper.manualRequire(dir_list, param, directory);
        imported_interface[param] = customReq;
        return customReq;
    } else {
        throw 'Dependency not found: ' + param;
    }
}

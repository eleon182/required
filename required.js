var req = require('require-dir');
var lo = require('lodash');

module.exports = {
    init: init,
    get: get,
    getInit: getInit
};

var init_dir = null;

function getInit() {
    return init_dir;
}

function init(param) {
    if (param) {
        try {
            init_dir = req(param, {
                recurse: true
            });
        } catch (err) {
            console.log('Directory does not exist!');
        }
    }
}

function get(param) {
    var absolute = lo.get(init_dir, param);
    if (absolute) {
        return absolute;
    } else {
        return get_recurse(init_dir, param);
    }
}

function get_recurse(param, obj) {
    if (param && lo.isObject(param) && lo.has(param, obj)) {
        return lo.get(param, obj);
    } else {
        if (lo.isObject(param)) {
            for (var key in param) {
                if (lo.isObject(param[key])) {
                    var temp = get_recurse(param[key], obj);
                    if (temp) {
                        return temp;
                    }
                }
            }
        }
    }
}

const fs = require('fs');
const path = require('path');
const { Config } = require('fuse-box/Config');

function pathExists(path, opts = fs.constants.R_OK) {
    try {
        fs.accessSync(path, opts);
        return true;
    } catch (e) {
        return false;
    }
}

function getRelativeTo(id, file) {
    return id.startsWith('.') ? file.info.absDir : file.context.homeDir;
}

function findViewByConvention(moduleId, file) {
    const ext = path.extname(moduleId);
    const extensions = ['.html'];
    let result = { viewExists: false, viewName: null };

    if (!ext || extensions.indexOf(ext) === -1) {
        moduleId = ext === '.js' ? swapExtension(moduleId, '') : moduleId;

        extensions.forEach(extension => {
            if (pathExists(path.join(getRelativeTo(moduleId, file), moduleId) + extension)) {
                result.viewExists = true;
                result.viewName = moduleId + extension;
            }
        });
    }

    return result;
}

function addViewByConvention(moduleId, file, toRelative = true) {
    const { viewExists, viewName } = findViewByConvention(moduleId, file);

    if (!viewExists) { return; }

    const view = toRelative ? (viewName.startsWith('.') ? viewName : `~/${viewName}`) : viewName;

    file.addStringDependency(view);
}

function isNodeModule(moduleId, file) {
    if (pathExists(path.join(Config.NODE_MODULES_DIR, moduleId))) return true;

    if (!file.info.absDir.startsWith(Config.NODE_MODULES_DIR)) return false;

    return pathExists(path.join(file.info.absDir, getModuleName(moduleId)));
}

function isUserModule(moduleId, file) {
    // Node modules can not reference user code
    if (!file.info.absDir.startsWith(file.context.homeDir)) {
        return false;
    }

    return pathExists(
        path.join(getRelativeTo(moduleId, file), getModuleName(moduleId))
    );
}

const extensions = ['.js', '.html', '.css', '.scss', '.less', '.styl'];

function getModuleName(moduleId, newExtension = '.js') {
    const ext = path.extname(moduleId);

    if (!ext || extensions.indexOf(ext) === -1) {
        moduleId = moduleId + newExtension;
    }

    return moduleId;
}

function swapExtension(file, newExtension) {
    return file.replace(/\.[^\\/.]*$/, "") + newExtension;
}

module.exports = {
    getModuleName,
    isNodeModule,
    isUserModule,
    addViewByConvention
};

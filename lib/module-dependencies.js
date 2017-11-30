const { parseWithBabylon, getModuleNames } = require('./analysis');
const {
    isNodeModule,
    isUserModule,
    getModuleName,
    addViewByConvention
} = require('./utils');

class ModuleDependenciesPlugin {
    constructor(opts) {
        this.test = /\.js$/;

        this.options = Object.assign({
            pal: 'browser',
            aureliaApp: 'main',
            aureliaConfig: ['standard', 'developmentLogging']
        }, opts);
    }

    transform(file) {
        if (file.context.useCache && file.loadFromCache()) {
            return;
        }

        if (file.info.fuseBoxPath.endsWith('aurelia-bootstrapper.js')) {
            file.addStringDependency(`aurelia-pal-${this.options.pal}`);
        }

        if (file.info.fuseBoxPath.endsWith('aurelia-framework.js')) {
            let plugins = getFrameworkPlugins(this.options.aureliaConfig);
            plugins.forEach(p => file.addStringDependency(p));
        }

        file.loadContents();
        if (!file.analysis.ast) {
            file.analysis.loadAst(parseWithBabylon(file.contents));
        }

        const modules = getModuleNames(file.analysis.ast);

        if (modules.length > 0) {
            modules.forEach(id => this.addDependency(id, file));
        }
    }

    addDependency(id, file) {
        if (isNodeModule(id, file)) {

            file.addStringDependency(id);

            if (id.startsWith('.')) {
                addViewByConvention(id, file);
            }

        } else if (isUserModule(id, file)) {

            file.addStringDependency(id.startsWith('.') ? id : `~/${id}`);
            addViewByConvention(id, file);

        } else {
            throw new Error(`Can't resolve module: ${id}`);
        }
    }
}

const configModuleNames = {
    'defaultBindingLanguage': 'aurelia-templating-binding',
    'router': 'aurelia-templating-router',
    'history': 'aurelia-history-browser',
    'defaultResources': 'aurelia-templating-resources',
    'eventAggregator': 'aurelia-event-aggregator',
    'developmentLogging': 'aurelia-logging-console',
};

function getFrameworkPlugins(config) {
    if (!config) return undefined;
    if (!Array.isArray(config)) config = [config];

    let i = config.indexOf('standard');
    if (i >= 0) { config.splice(i, 1, 'basic', 'history', 'router'); }
    i = config.indexOf('basic');
    if (i >= 0) {
        config.splice(i, 1, 'defaultBindingLanguage', 'defaultResources', 'eventAggregator');
    }

    return config.map(c => configModuleNames[c]);
}

module.exports = (opts) => new ModuleDependenciesPlugin(opts);

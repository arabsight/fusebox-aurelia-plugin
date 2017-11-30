const { getModulesFromHtml } = require('./analysis');
const { isUserModule, isNodeModule, addViewByConvention } = require('./utils');

class HtmlDependenciesPlugin {
    constructor(opts) {
        this.test = /\.html$/;
    }

    transform(file) {
        file.loadContents();

        let modules = getModulesFromHtml(file.contents);

        if (modules.length === 0) return;

        modules.forEach(id => this.addDependency(id, file));
    }

    addDependency(id, file) {
        if (isUserModule(id, file)) {

            file.addStringDependency(id.startsWith('.') ? id : `~/${id}`);
            addViewByConvention(id, file);

        } else if (isNodeModule(id, file)) {

            file.addStringDependency(id);
            // addViewByConvention(id, file); hmm i dont think so

        } else {
            throw new Error(`Can't resolve module: ${id}`);
        }
    }
}

module.exports = (opts) => new HtmlDependenciesPlugin(opts);

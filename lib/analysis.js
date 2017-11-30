const babylon = require('babylon');
const parse = require('./attributes-parser');
const traverse = require('babel-traverse').default;

function parseWithBabylon(content, opts) {
    const options = Object.assign({
        sourceType: 'module',
        plugins: ['decorators', 'classProperties']
    }, opts);

    return babylon.parse(content, options);
}

function getModuleNames(ast) {
    let moduleNames = [];

    traverse(ast, {
        CallExpression(path) {
            const obj = path.node.callee.object;
            if ((obj &&
                (obj.name === 'PLATFORM' ||
                    (obj.property && obj.property.name === 'PLATFORM'))) &&
                path.node.callee.property.name === 'moduleName') {

                const moduleNode = path.node.arguments[0];
                if (moduleNode.type === 'StringLiteral') {
                    moduleNames.push(moduleNode.value);
                }
            }

            if (path.node.callee.name === 'inlineView') {
                let markup;
                const markupArg = path.node.arguments[0];

                switch (markupArg.type) {
                    case 'StringLiteral':
                        markup = markupArg.value;
                        break;
                    case 'TemplateLiteral':
                        markup = markupArg.quasis[0].value.raw;
                        break;
                    default:
                        break;
                }

                const foundModules = getModulesFromHtml(markup);
                foundModules.forEach(m => moduleNames.push(m));

                // TODO inlineView(markup, dependencies?, dependencyBaseUrl?)
                // Yeah check those args two
            }
        },

        AssignmentExpression(path) {
            const right = path.node.right;

            if (right.type === 'CallExpression' && right.callee.type === 'SequenceExpression') {

                const inlineViewFound = right.callee.expressions.find(exp => {
                    return exp.type === 'MemberExpression' && exp.property.name === 'inlineView';
                });

                if (inlineViewFound && right.arguments[0].type === 'StringLiteral') {
                    const foundModules = getModulesFromHtml(right.arguments[0].value);
                    foundModules.forEach(m => moduleNames.push(m));
                }
            }
        }
    });

    return moduleNames;
}

function getModulesFromHtml(html) {
    let attributes = {
        'require': ['from'],
        'compose': ['view', 'view-model'],
        'router-view': ['layout-view', 'layout-view-model'],
    };

    let parsed = parse(html, (tag, attr) => {
        const attrs = attributes[tag];
        return attrs && attrs.includes(attr);
    });

    return parsed.filter(attr => !/(^|[^\\])\$\{/.test(attr.value))
        .map(attr => attr.value.replace(/\\"/g, ''));
}

module.exports = {
    parseWithBabylon,
    getModuleNames,
    getModulesFromHtml
};

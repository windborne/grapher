const JSDOMGlobal = require('jsdom-global');
const chai = require('chai');
const sinonChai = require('sinon-chai');

JSDOMGlobal('<!doctype html><html><body></body></html>', {
    url: 'http://localhost'
});

global.navigator = {
    userAgent: 'node.js'
};

global.expect = require('chai').expect;

chai.use(sinonChai);

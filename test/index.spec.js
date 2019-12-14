
// For Debug ----------------------------------------
/*
function _keepOldEnv() {
    let o = {}
    for (let i in process.env) {
        o[i] = process.env[i];
    }
    return o;
}

function _compareOld(x) {
    let filtered = {};

    for (let i in process.env) {
        if (x[i] == undefined) {
            filtered[i] = process.env[i];
        }
    }

    console.log(filtered);
}
*/

test('basic', () => {

    process.env.NODE_ENV = 'development'
    let loadEnvConfig = require('../index.js')

    let output = loadEnvConfig(['./test/config'], {export:false});

    expect( output.order[0] ).toMatch("\\test\\config\\.env");
    expect( output.order[1] ).toMatch("\\test\\config\\config.yml");
    expect( output.order[2] ).toMatch("\\test\\config\\config.json");
    expect( output.order[3] ).toMatch("\\test\\config\\config.development.json");

    expect( output.values.server.port ).toBe(8000)

})

test('production', () => {

    process.env.NODE_ENV = 'production'
    let loadEnvConfig = require('../index.js')

    let output = loadEnvConfig(['./test/config'], {export:false});

    expect( output.order[0] ).toMatch("\\test\\config\\.env");
    expect( output.order[1] ).toMatch("\\test\\config\\config.yml");
    expect( output.order[2] ).toMatch("\\test\\config\\config.json");
    expect( output.order[3] ).toMatch("\\test\\config\\config.production.yml");

    expect( output.values.server.port ).toBe(80)

})

test('undefined env', () => {

    process.env.NODE_ENV = undefined;
    let loadEnvConfig = require('../index.js')

    let output = loadEnvConfig(['./test/config'], {export:false});

    expect( output.order[0] ).toMatch("\\test\\config\\.env");
    expect( output.order[1] ).toMatch("\\test\\config\\config.yml");
    expect( output.order[2] ).toMatch("\\test\\config\\config.json");

    expect( output.values.server.port ).toBe(9000)

})

test('store', () => {

    process.env.NODE_ENV = undefined;
    let loadEnvConfig = require('../index.js')

    let { order, values, store } = loadEnvConfig(['./test/config'], {export:false});

    expect( store('server.port') ).toBe(9000)

})

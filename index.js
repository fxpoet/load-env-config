let fs   = require('fs')
let path = require('path')
let dotenv = require('./dotenv.js')

//-----------------------------------------------------------------

// 여러 예상 경로 중에 파일 찾기
function loadFile(filePathArray) {
  if (typeof(filePathArray) == 'string')
    filePathArray = [filePathArray];

  for (let i = 0; i < filePathArray.length; i++) {
    if (fs.existsSync(path.resolve(process.cwd(), filePathArray[i])))
      return filePathArray[i];
  }

  return null;
}

// Dotenv 코드 (.env 로드)
function loadDotEnv(dotenvTarget) {

  let dotenvPath = loadFile(dotenvTarget);

  try {
    const parsed = dotenv.parse(fs.readFileSync(dotenvPath, { encoding: 'utf8' }));
    Object.keys(parsed).forEach(function (key) { process.env[key] = parsed[key]; })
    return { parsed };
  } catch (e) {
    return { error: e };
  }
}

function loadJSON(configJsonTarget) {
  let file = loadFile(configJsonTarget)
  if (!file) return;

  let configs  = JSON.parse(fs.readFileSync(file, {encoding:'utf8'}));
  let NODE_ENV = process.env.NODE_ENV || (configs.default && configs.default.NODE_ENV);

  if (configs[NODE_ENV]) {
    Object.keys(configs[NODE_ENV])
    .forEach( key=>{
      if (process.env[key]) return;
      process.env[key] = configs[NODE_ENV][key];
    })
  }

  if (configs.default) {
    Object.keys(configs.default)
    .forEach( key=>{
      if (process.env[key]) return;
      process.env[key] = configs.default[key];
    })
  }
}

// For Debug ----------------------------------------
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
// ------------------------------------------------

function config(overObject) {

  //let old = _keepOldEnv() // For Debug

  loadJSON([
    'config.json',
    'config/config.json',
    'conf/config.json',
    'env.config',
    'config/env.config',
    'conf/env.config'
  ])

  loadDotEnv([ '.env', 'config/.env', 'conf/.env' ])

  if (overObject)
    Object.keys(overObject)
      .forEach( key=>{
        process.env[key] = overObject[key];
    });

  //_compareOld(old) // For Debug
}

module.exports = config;

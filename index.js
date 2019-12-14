const fs     = require('fs')
const path   = require('path')
const dotenv = require('./dotenv.js')
const yaml   = require('js-yaml')
//-----------------------------------------------------------------

const default_fileList = [
  'config/config.json',
  'conf/config.json',
  'conf/config.yml',
  //'conf/config.development.yml', // auto load
  'config.json',
  'config.yml',
  'config.env',
  '.env'
];

const default_options = {
  export: true, // 직접 env에 export
  force: false  // export 할때 기존에 값이 있어도 강제로 쓰기
};

const env_list = [
  'production',
  'prod',
  'development',
  'devel',
  'test'
]

function putEnvValue(key, value, cache, options) {

  if (options.force != true) {

    // 실행전 ENV에 등록된 거면 무시 (보통 Cross-env에서 셋팅된 것이나 컨테이너에서 부여한 것)
    if (process.env[key]) {
      if (cache[key] == undefined) return;
    }
  }

  if (typeof(value) != 'object') {

    if (options.export)
      process.env[key] = value;

    cache[key] = value;
  } else
    cache[key] = (cache[key] == undefined) ? value : Object.assign(cache[key], value);

}

function loadFileJSON(filepath, cache, options) {
  const configs = JSON.parse(fs.readFileSync(filepath, {encoding:'utf8'}));
  Object.keys(configs).forEach( key=>{ putEnvValue(key, configs[key], cache, options) });
  return filepath;
}

function loadFileENV(filepath, cache, options) {
  const configs = dotenv.parse(fs.readFileSync(filepath, { encoding: 'utf8' }));
  Object.keys(configs).forEach( key=>{ putEnvValue(key, configs[key], cache, options) });
  return filepath;
}

function loadFileYML(filepath, cache, options) {
  const configs = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
  Object.keys(configs).forEach( key=>{ putEnvValue(key, configs[key], cache, options) });
  return filepath;
}

function resolveFiles(file_list) {

  let loadTarget = [];

  file_list = file_list.map(i => path.resolve(process.cwd(), i)).filter(i => fs.existsSync(i))

  // 디렉토리로 지정된 경우 안에 있는 리스트 뽑기
  file_list.forEach(file => {
    if (fs.lstatSync(file).isDirectory()) {
      let subList = fs.readdirSync(file)
      subList.sort( (a,b)=> (a.length - b.length))
      subList.forEach(subItem=> {
        if (fs.lstatSync(file+'/'+subItem).isFile())
          loadTarget.push( path.resolve(process.cwd(), file+"/"+subItem) );
      })
    } else
      loadTarget.push(file);
  })

  let env = (process.env.NODE_ENV) ? process.env.NODE_ENV : false;

  // 로딩될 필요 없는 녀석들 제거
  loadTarget = loadTarget.filter(file => {
    let flag = (file.indexOf('example.') > -1) || (file[0] == "_");

    env_list.forEach(v => {
      if (v == env) return;
      flag = flag || (file.indexOf(v+'.') > -1)
    })

    return !flag;
  })

  return loadTarget;
}

// ------------------------------------------------
// 불러올 파일을 순서대로 정한다. 이왕이면 명시적인게 좋다.
function config(loadFileList, options) {

  if (Array.isArray(loadFileList) == false) {
    options = loadFileList;
    loadFileList = undefined;
  }

  options = Object.assign(default_options, (options) ? options : {});
  loadFileList = (loadFileList) ? loadFileList : default_fileList;

  let cached = {};
  let loadedFiles = [];

  resolveFiles(loadFileList).forEach(file=>{

    let ext = path.extname(file);

    if (ext.toLowerCase() == '.json')
      loadedFiles.push( loadFileJSON(file, cached, options) );

    if (ext.toLowerCase() == '.yaml' || ext.toLowerCase() == '.yml')
      loadedFiles.push( loadFileYML(file, cached, options) );

    if (ext.toLowerCase() == '') {
      let p = path.parse(file);
      if (p.name == '.env') {
        loadedFiles.push( loadFileENV(file, cached, options) );
      }
    }

  })

  loadedFiles = loadedFiles.filter(i => i);

  return {order: loadedFiles, values: cached}
}

module.exports = config;
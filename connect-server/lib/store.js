'use strict';
// JSON 파일 저장소. 메모리에 올려두고, 바뀔 때마다 임시 파일에 쓴 뒤 rename 으로 교체해서
// 쓰다가 죽어도 파일이 깨지지 않게 한다. (동시 접속이 많아지면 DB로 교체할 자리)
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'db.json');
const EMPTY = () => ({ campaigns: [], videos: {}, videosPub: {}, hidden: {}, meta: {}, comments: {}, zealMemos: {}, refreshLog: {} });

let db = null;
let timer = null;

function load() {
  fs.mkdirSync(DIR, { recursive: true });
  try { db = Object.assign(EMPTY(), JSON.parse(fs.readFileSync(FILE, 'utf8'))); }
  catch (e) { db = EMPTY(); }
  return db;
}

function flushNow() {
  if (!db) return;
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

function save() {
  clearTimeout(timer);
  timer = setTimeout(flushNow, 50);
}

function get() { return db || load(); }

module.exports = { get, save, flushNow, DIR };

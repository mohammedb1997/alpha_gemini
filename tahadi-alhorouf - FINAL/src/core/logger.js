const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_NAMES = { 0: 'DBG', 1: 'INF', 2: 'WRN', 3: 'ERR' };

class RingBuffer {
  constructor(max) { this.max = max; this.buf = []; this.pos = 0; }
  push(entry) {
    this.buf[this.pos] = entry;
    this.pos = (this.pos + 1) % this.max;
  }
  getAll() {
    if (this.buf.length < this.max) return this.buf.slice(0, this.pos);
    return this.buf.slice(this.pos).concat(this.buf.slice(0, this.pos));
  }
}

const Logger = {
  level: 1,
  buffer: new RingBuffer(200),
  _ts() { return new Date().toISOString().slice(11, 23); },
  debug(msg) { if (this.level <= 0) this._log(0, msg); },
  info(msg) { if (this.level <= 1) this._log(1, msg); },
  warn(msg) { if (this.level <= 2) this._log(2, msg); },
  error(msg) { if (this.level <= 3) this._log(3, msg); },
  _log(level, msg) {
    const entry = `[${this._ts()}] ${LOG_NAMES[level]}: ${msg}`;
    this.buffer.push(entry);
    if (level >= 2) console[level === 2 ? 'warn' : 'error'](entry);
  },
  export() { return this.buffer.getAll().join('\n'); }
};

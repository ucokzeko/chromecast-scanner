"use strict";

const mdns = require('multicast-dns');

let defaults = {
  ttl: 10000,
  service_name: '_googlecast._tcp.local',
  service_type: 'PTR',
  mdns: {},
  count: 10
};

module.exports = (opts, cb) => {
  let devices = [];

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = Object.assign({}, defaults, opts);

  let timer = setTimeout(() => {
    close();
    cb(null, devices);
  }, opts.ttl);

  let m = mdns(opts.mdns);
  m.on('response', onResponse);
  m.query({
    questions: [{
      name: opts.service_name,
      type: opts.service_type
    }]
  });

  function onResponse(response) {
    let answer = response.answers[0];
    if (answer && (answer.name !== opts.service_name || answer.type !== opts.service_type)) {
      return;
    }

    let info = response.additionals.find(entry => entry.type === 'A');
    if (!info || (opts.name && info.name !== opts.name)) {
      return;
    }

    if (!devices.some(device => device.name === info.name)) {
      devices.push(info);
    }

    if (devices.length >= opts.count) {
      close();
      cb(null, devices);
    }
  }

  function close() {
    m.removeListener('response', onResponse);
    clearTimeout(timer);
    m.destroy();
  }

  return close;
};

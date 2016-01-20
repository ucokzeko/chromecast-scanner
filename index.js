"use strict";

const mdns = require("multicast-dns");

let defaults = {
  timeout: 10000,
  serviceName: "_googlecast._tcp.local",
  serviceType: "PTR",
  mdns: {},
  count: 10
};

module.exports = (opts, cb) => {
  let devices = [];

  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }

  opts = Object.assign({}, defaults, opts);

  let timer = setTimeout(() => {
    close();
    cb(null, devices);
  }, opts.timeout);

  let m = mdns(opts.mdns);
  m.on("response", onResponse);
  m.query({
    questions: [{
      name: opts.serviceName,
      type: opts.serviceType
    }]
  });

  function onResponse(response) {
    let answer = response.answers[0];
    if (answer && (answer.name !== opts.serviceName || answer.type !== opts.serviceType)) {
      return;
    }

    let info = response.additionals.find(entry => entry.type === "A");
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
    clearTimeout(timer);
    m.removeListener("response", onResponse);
    m.destroy();
  }

  return close;
};

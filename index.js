var mdns = require('multicast-dns');
var find = require('array-find');
var xtend = require('xtend');

var defaults = {
  ttl: 10000,
  service_name: '_googlecast._tcp.local',
  service_type: 'PTR',
  mdns: {}
};

module.exports = function(opts, count) {
  var list = []

  if (typeof opts === 'function') {
    cb = opts;
    opts = defaults;
  } else {
    opts = xtend(defaults, opts);
  }

  var m = mdns(opts.mdns);

  var timer = setTimeout(function() {
    close();
    cb(list);
  }, opts.ttl);

  var onResponse = function(response) {
    var answer = response.answers[0];

    if (answer &&
        (answer.name !== opts.service_name ||
         answer.type !== opts.service_type)) {
      return;
    }

    var info = find(response.additionals, function(entry) {
      return entry.type === 'A';
    });

    if (!info || (opts.name && info.name !== opts.name)) {
      return;
    }

    if (!contains(list, info)) {
      list.push(info);
    }

    if (list.length >= count) {
      close();
      cb(list);
    }
  };

  m.on('response', onResponse);

  m.query({
    questions:[{
      name: opts.service_name,
      type: opts.service_type
    }]
  });

  var close = function() {
    m.removeListener('response', onResponse);
    clearTimeout(timer);
    m.destroy();
  };

  return close;
};

var contains = function(list, obj) {
  var result = false;
  list.forEach(function(item) {
    if (item.name === obj.name)
      result = true;
  });
  return result;
}

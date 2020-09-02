/* jshint indent: false, maxlen: false */

(function (w, d, a) {

  var hazPinIt, firstScript, newScript, scriptUrl;

  // generate an unique-ish global variable: hazPinIt_ plus today's Unix day
  hazPinIt = 'PIN_' + ~~(new Date().getTime() / 86400000);

  if (!w[hazPinIt]) {

    // keep track of the number of times pinit.js is included for debugging purposes
    w[hazPinIt] = 1;

    // avoid KB927917 error in IE8
    w.setTimeout(function () {

      // load payload
      firstScript = d.getElementsByTagName('SCRIPT')[0];
      newScript = d.createElement('SCRIPT');
      newScript.type = 'text/javascript';
      newScript.async = true;
      newScript.src = a.mainUrl + '?' + Math.random();
      firstScript.parentNode.insertBefore(newScript, firstScript);

    }, 10);

  } else {
    w[hazPinIt] += 1;
  }
}(window, document, {
  'mainUrl': 'https://assets.pinterest.com/js/pinit_main.js'
}));

/* jshint indent: false, maxlen: false */
// Split into loader and main body; run main only if it's not been run before

(function (w, d, scriptUrl) {

  var firstScript, newScript, hazPinIt;
  
  // generate an unique-ish global ID: hazPinIt_ plus today's Unix day
  hazPinIt = 'PIN_' + ~~(new Date().getTime() / 86400000);
  
  if (!w[hazPinIt]) {

    // don't run next time
    w[hazPinIt] = true;    
    
    // avoid KB927917 error in IE8
    w.setTimeout(function () {
    
      // load the bulk of pinit.js
      firstScript = d.getElementsByTagName('SCRIPT')[0];
      newScript = d.createElement('SCRIPT');
      newScript.type = 'text/javascript';
      newScript.async = true;
      newScript.src = scriptUrl;
      firstScript.parentNode.insertBefore(newScript, firstScript);

    }, 10);

  }
}(window, document, '//assets.pinterest.com/js/pinit_main.js'));

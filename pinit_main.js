/* jshint indent: false, maxlen: false */
// update logging parameter names

(function (w, d, n, a) {
  var $ = w[a.k] = {
    'w': w,
    'd': d,
    'n': n,
    'a': a,
    's': {},
    'f': (function () {
      return {

        // an empty array for callbacks to be added later
        callback : [],

        // console.log only if debug is on
        debug: function (obj) {
          if ($.v.config.debug) {
            if ($.w.console && $.w.console.log) {
              $.w.console.log(obj);
            } else {
              $.d.URL = $.d.URL + '#' + obj;
            }
          }
        },

        // add and remove event listeners in a cross-browser fashion
        listen : function (el, ev, fn, detach) {
          if (!detach) {
            // add listener
            if (typeof $.w.addEventListener !== 'undefined') {
              el.addEventListener(ev, fn, false);
            } else if (typeof $.w.attachEvent !== 'undefined') {
              el.attachEvent('on' + ev, fn);
            }
          } else {
            // remove listener
            if (typeof el.removeEventListener !== 'undefined') {
              el.removeEventListener(ev, fn, false);
            } else if (typeof el.detachEvent !== 'undefined') {
              el.detachEvent('on' + ev, fn);
            }
          }
        },

        // find an event's target element
        // via PPK (http://www.quirksmode.org/js/events_properties.html)
        getEl: function (e) {
          var el = null;
          if (e.target) {
            el = (e.target.nodeType === 3) ? e.target.parentNode : e.target;
          } else {
            el = e.srcElement;
          }
          return el;
        },

        // get a DOM property or text attribute
        get: function (el, att) {
          var v = '';
          if (typeof el[att] === 'string') {
            v = el[att];
          } else {
            v = el.getAttribute(att);
          }
          return v;
        },

        // get a data: attribute
        getData: function (el, att) {
          att = $.a.dataAttributePrefix + att;
          return $.f.get(el, att);
        },

        // set a DOM property or text attribute
        set: function (el, att, string) {
          if (typeof el[att] === 'string') {
            el[att] = string;
          } else {
            el.setAttribute(att, string);
          }
        },

        // create a DOM element
        make: function (obj) {
          var el = false, tag, att;
          for (tag in obj) {
            if (obj[tag].hasOwnProperty) {
              el = $.d.createElement(tag);
              for (att in obj[tag]) {
                if (obj[tag][att].hasOwnProperty) {
                  if (typeof obj[tag][att] === 'string') {
                    $.f.set(el, att, obj[tag][att]);
                  }
                }
              }
              break;
            }
          }
          return el;
        },

        // remove a DOM element
        kill: function (obj) {
          if (typeof obj === 'string') {
            obj = $.d.getElementById(obj);
          }
          if (obj && obj.parentNode) {
            obj.parentNode.removeChild(obj);
          }
        },

        // replace one DOM element with another
        replace: function (before, after) {
          if (typeof before === 'object' && typeof after === 'object') {
            $.w.setTimeout(function () {
              before.parentNode.insertBefore(after, before);
              $.w.setTimeout(function() {
                $.f.kill(before);
              }, 1);
            }, 1);
          }
        },

        // parse an URL, return values for specified keys in the query string
        parse: function (str, keys) {
          var query, pair, part, i, n, v, ret;
          ret = {};
          // remove url hash, split to find query
          query = str.split('#')[0].split('?');
          // found query?
          if (query[1]) {
            // split to pairs
            pair = query[1].split('&');
            // loop through pairs
            for (i = 0, n = pair.length; i < n; i = i + 1){
              // split on equals
              part = pair[i].split('=');
              // found exactly two parts?
              if (part.length === 2) {
                // first part is key; do we have a match in keys?
                if (keys[part[0]]) {
                  // attempt to decode this
                  try {
                    v = decodeURIComponent(part[1]);
                  } catch (e) {
                    v = part[1];
                  }
                  // yes: set return value for key to second part, which is value
                  ret[part[0]] = v;
                }
              }
            }
          }
          return ret;
        },

        // stop the default event action
        preventDefault: function(v) {
          if (v.preventDefault) {
            v.preventDefault();
          } else {
            v.returnValue = false;
          }
        },

        // return moz, webkit, ms, etc
        getVendorPrefix: function () {
          var x = /^(moz|webkit|ms)(?=[A-Z])/i;
        	var r = '';
        	for (var p in $.d.b.style) {
        		if (x.test(p)) {
        			r = '-' + p.match(x)[0].toLowerCase() + '-';
        			break;
        		}
        	}
        	return r;
        },

        // call an API endpoint; fire callback if specified
        call: function (url, callback) {
          var n, id, tag, msg, sep = '?';
          // $.f.callback starts as an empty array
          n = $.f.callback.length;

          // new SCRIPT tags get IDs so we can find them, query them, and delete them later
          id = $.a.k + '.f.callback[' + n + ']';

          // the callback will fire only when the API returns
          $.f.callback[n] = function (r) {
            // do we have output?
            if (r) {
              // send the original call back with the callback so we can munge href URLs if needed
              r.theCall = url;
              // do we need to log an error?
              if (r.status && r.status === 'failure') {
                // some errors don't have messages; fall back to status
                msg = r.message || r.status;
                // has the site operator specified a callback?
                if (typeof $.v.config.error === 'string') {
                  // does the callback function actually exist?
                  if (typeof $.w[$.v.config.error] === 'function') {
                    $.w[$.v.config.error](msg);
                  }
                }
                // scope gotcha: recreate id string from n instead of relying on it already being in id
                tag = $.d.getElementById($.a.k + '.f.callback[' + n + ']');
                // found it?
                if (tag) {
                  // does it have a src attribute?
                  if (tag.src) {
                    // log only the URL part
                    $.f.log('&event=api_error&code=' + r.code + '&msg=' + msg + '&url=' + encodeURIComponent(tag.src.split('?')[0]));
                  }
                }
              }
            }
            // if a callback exists, pass the API output
            if (typeof callback === 'function') {
              callback(r, n);
            }
            // clean up the SCRIPT tag after it's run
            $.f.kill(id);
          };

          // some calls may come with a query string already set
          if (url.match(/\?/)) {
            sep = '&';
          }

          // make and call the new SCRIPT tag
          $.d.b.appendChild( $.f.make({'SCRIPT': {
              'id': id,
              'type': 'text/javascript',
              'charset': 'utf-8',
              'src': url + sep + 'callback=' + id
            }
          }));
        },

        // super-light base-64 encoder; guaranteed to choke on Unicode
        // via Dave Chambers (https://github.com/davidchambers/Base64.js)
        btoa: function (s) {
          var d = 'data:image/svg+xml;base64,';
          if ($.w.btoa) {
            d = d + $.w.btoa(s);
          } else {
            for (
              var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', b, c, i = 0;
              s.charAt(i | 0) || (a = '=', i % 1);
              d = d + a.charAt(63 & b >> 8 - i % 1 * 8)
            ) {
              c = s.charCodeAt(i += .75);
              b = b << 8 | c;
            }
          }
          return d;
        },

        // turn a path and some values into an SVG
        makeSVG: function (obj, fill) {
          var i, n, svg;

          // start svg
          svg = '<svg xmlns="http://www.w3.org/2000/svg" height="%h%px" width="%w%px" viewBox="%x1% %y1% %x2% %y2%"><g>';

          // height and width
          svg = svg.replace(/%h%/, obj.h);
          svg = svg.replace(/%w%/, obj.w);

          // view box defaults to 0, 0, w, h but can be overriden (side count bubble)
          svg = svg.replace(/%x1%/, obj.x1 || '0');
          svg = svg.replace(/%y1%/, obj.y1 || '0');
          svg = svg.replace(/%x2%/, obj.x2 || obj.w);
          svg = svg.replace(/%y2%/, obj.y2 || obj.h);

          // compute svg data for each path (round Pinterest logo has two)
          for (i = 0, n = obj.p.length; i < n; i = i + 1) {

            // start the path
            svg = svg + '<path d="' + obj.p[i].d + '"';

            // use alternate fill color if specified (white Pin It logotype)
            svg = svg + ' fill="#' + (fill || obj.p[i].f || '#000') + '"';

            // stroke
            if (obj.p[i].s) {
              svg = svg + ' stroke="#' + obj.p[i].s + '"';
              // stroke-width
              if (!obj.p[i].w) {
                obj.p[i].w = '2';
              }
              svg = svg + ' stroke-width="' + obj.p[i].w + '"';
            }

            // done
            svg = svg + '></path>';
          }

          // end svg
          svg = svg + '</g></svg>';
          return $.f.btoa(svg);
        },

        // build stylesheet
        buildStyleSheet : function () {
          var css, rules, k, re, repl;
          css = $.f.make({'STYLE': {'type': 'text/css'}});
          rules = $.v.css;
          // each rule has our randomly-created key at its root to minimize style collisions
          rules = rules.replace(/\._/g, '.' + a.k + '_')

          // strings to replace in CSS rules
          var repl = {
            '%widgetBorderRadius%': '5px',
            '%buttonBorderRadius%': '3px',
            '%buttonBorderRadiusTall%': '3px',
            // SVG replacements
            '%native%': $.f.makeSVG($.a.svg.native),
            '%above%': $.f.makeSVG($.a.svg.above),
            '%beside%': $.f.makeSVG($.a.svg.beside),
            '%repins%': $.f.makeSVG($.a.svg.repins),
            '%done%': $.f.makeSVG($.a.svg.done),
            '%menu%': $.f.makeSVG($.a.svg.menu),
            '%logo%': $.f.makeSVG($.a.svg.logo),
            '%lockup%': $.f.makeSVG($.a.svg.lockup),
            '%pinit_en_red%': $.f.makeSVG($.a.svg.pinit_en),
            '%pinit_en_white%': $.f.makeSVG($.a.svg.pinit_en, 'fff'),
            '%pinit_ja_red%': $.f.makeSVG($.a.svg.pinit_ja),
            '%pinit_ja_white%': $.f.makeSVG($.a.svg.pinit_ja, 'fff'),
            '%prefix%': $.f.getVendorPrefix()
          }

          $.f.makeSVG($.a.svg.pinit_en, 'fff');

          // replace everything in repl throughout rules
          for (k in repl) {
            if (repl[k].hasOwnProperty) {
              // re = new RegExp(k, 'g');
              rules = rules.replace(new RegExp(k, 'g'), repl[k]);
            }
          }

          // add rules to stylesheet
          if (css.styleSheet) {
            css.styleSheet.cssText = rules;
          } else {
            css.appendChild($.d.createTextNode(rules));
          }
          // add stylesheet to page
          if ($.d.h) {
            $.d.h.appendChild(css);
          } else {
            $.d.b.appendChild(css);
          }
        },

        // recursive function to make rules out of a Sass-like object
        presentation: function (obj, str) {
          // make CSS rules
          var name, i, k, pad, key, rules = '', selector = str || '';
          for (k in obj) {
            if (obj[k].hasOwnProperty) {
              // found a rule
              if (typeof obj[k] === 'string') {
                rules = rules + '\n  ' + k + ': ' + obj[k] + ';';
              }
            }
          }
          // add selector and rules to stylesheet
          if (selector && rules) {
            $.v.css = $.v.css + selector + ' { ' + rules + '\n}\n';
          }
          // any children we need to handle?
          for (k in obj) {
            if (obj[k].hasOwnProperty) {
              if (typeof obj[k] === 'object') {
                // replace & with parent selector
                // var key = k.replace(/&/g, selector);
                key = selector + ' ' + k;
                key = key.replace(/ &/g, '');
                key = key.replace(/,/g, ', ' + selector);
                $.f.presentation(obj[k], key);
              }
            }
          }
          // if this is our root, remove from current context and make stylesheet
          if (obj === $.a.styles) {
            $.w.setTimeout(function() {
              $.f.buildStyleSheet();
            }, 1);
          }
        },

        // send logging information
        log: function (str) {
          // don't log from our networks
          if (!$.v.here.match(/^https?:\/\/(.*?\.|)(pinterest|pinadmin)\.com\//)) {
            // query always starts with type=pidget&guid=something
            var query = '?type=pidget&guid=' + $.v.guid;
            // add test version if found
            if ($.a.tv) {
              query = query + '&tv=' + $.a.tv;
            }
            // add optional string &foo=bar
            if (str) {
              query = query + str;
            }
            // add user-specified logging tag, if present
            if ($.v.config.tag) {
              query = query + '&tag=' + $.v.config.tag;
            }
            // add the page we're looking at right now
            query = query + '&via=' + encodeURIComponent($.v.here);
            $.f.call($.a.endpoint.log + query);
          }
        },

        // build a query
        buildQuery: function(params) {
          var query = '';
          for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
              if (query) {
                query = query + '&';
              }
              query = query + key + '=' + encodeURIComponent(params[key]);
            }
          }
          return query;
        },

        // things that happen on click, exposed for site operators to call if needed
        util: {
          // open pinmarklet
          pinAny: function () {
            $.f.debug('opening the grid');
            $.d.b.appendChild($.f.make({
              'SCRIPT': {
                'type': 'text/javascript',
                'charset': 'utf-8',
                'pinMethod': 'button',
                'guid': $.v.guid,
                'src': $.a.endpoint.bookmark + '?guid=' + $.v.guid
              }
            }));
          },
          // pin an image
          pinOne: function (o) {
            if (o.href) {
              // parsing an URL, pinning
              var q = $.f.parse(o.href, {'url': true, 'media': true, 'description': true});
              // found valid URLs?
              if (q.url && q.url.match(/^http/i) && q.media && q.media.match(/^http/i)) {
                // log an error for Pin It buttons that don't have default descriptions
                if (!q.description) {
                  $.f.log('&event=config_warning&warning_msg=no_description&href=' + encodeURIComponent($.d.URL));
                  q.description = $.d.title;
                }
                // don't pass more than 500 characters to the board picker
                if (q.description.length > 500) {
                  q.description = q.description.substring(0, 500);
                }
                // pop the pin form
                $.w.open(o.href, 'pin' + new Date().getTime(), $.a.pop.base.replace('%dim%', $.a.pop.small));
              } else {
                // log an error
                $.f.log('&event=config_error&error_msg=invalid_url&href=' + encodeURIComponent($.d.URL));
                // fire up the bookmarklet and hope for the best
                $.f.util.pinAny();
              }
            } else {
              // we're pinning an image
              if (o.media) {
                if (!o.url) {
                  $.f.log('&event=config_warning&warning_msg=no_url&href=' + encodeURIComponent($.d.URL));
                  o.url = $.d.URL;
                }
                if (!o.description) {
                  $.f.log('&event=config_warning&warning_msg=no_description&href=' + encodeURIComponent($.d.URL));
                  o.description = $.d.title;
                }
                // don't pass more than 500 characters to the board picker
                if (o.description.length > 500) {
                  o.description = o.description.substring(0, 500);
                }
                // pop the pin form
                $.f.log('&event=button_pinit_custom');
                o.href = $.v.config.pinterest + '/pin/create/button/?guid=' + $.v.guid + '&url=' + encodeURIComponent(o.url) + '&media=' + encodeURIComponent(o.media) + '&description=' + encodeURIComponent(o.description);
                $.w.open(o.href, 'pin' + new Date().getTime(), $.a.pop.base.replace('%dim%', $.a.pop.small));
              } else {
                // no media
                $.f.log('&event=config_error&error_msg=no_media&href=' + encodeURIComponent($.d.URL));
                $.f.util.pinAny();
              }
            }

            if (o.v && o.v.preventDefault) {
              o.v.preventDefault();
            } else {
              $.w.event.returnValue = false;
            }
          },
          // open repin dialog from hoverbutton
          repinHoverButton: function (id) {
            $.f.util.repin(id, true);
          },
          // open repin dialog
          repin: function (data, fromHover) {
            var href, logType, pinId;
            if (typeof data === 'object') {
              if (data.href) {
                pinId = data.href.split('/')[4];
              }
            } else {
              pinId = data;
            }
            if (parseInt(pinId)) {
              var href = $.v.config.pinterest + $.a.path.repin.replace('%s', pinId) + '?guid=' + $.v.guid;
              $.w.open(href, 'pin' + new Date().getTime(), $.a.pop.base.replace('%dim%', $.a.pop.small));
            } else {
              $.f.debug($.v.config.util + '.repin requires an integer pinId');
            }
          },
          // open follow dialog
          follow: function (o) {
            $.w.open(o.href, 'pin' + new Date().getTime(), $.a.pop.base.replace('%dim%', $.a.pop.large));
          },
          // play or pause animated GIF
          play: function (o) {
            var img = o.el.previousSibling;
            if (o.el.className.match('_playing')) {
              o.el.className = $.a.k + '_control ' + $.a.k + '_paused';
              img.style.backgroundImage = 'url(' + $.f.getData(img, 'src') + ')';
            } else {
              o.el.className = $.a.k + '_control ' + $.a.k + '_playing';
              img.style.backgroundImage = 'url(' + $.f.getData(o.el, 'src') + ')';
            }
          },
          // play native video
          native: function (o) {
            var video = o.el.previousSibling;
            video.style.display = 'block';
            video.play();
            $.f.kill(o.el);
          },
          // open the three-dot menu
          menu: function (o) {
            var menu = o.el.nextSibling;
            if (menu.style.display === 'block') {
              menu.style.display = '';
            } else {
              menu.style.display = 'block';
            }
          },
          // send a log request
          log: function(params) {
            if (params) {
              $.f.log('&' + $.f.buildQuery(params));
            } else {
              $.f.debug($.v.config.util + '.log requires valid query params');
            }
          }
        },

        // build a complex element from a JSON template
        buildOne: function (obj, el) {
          if (!el) {
            var opts = {};
            // Add links to buttons for SEO.
            if (obj.tagName === 'A' && obj.href) {
              opts.A = {
                'className': $.a.k + '_' + obj.className.replace(/ /g, ' ' + $.a.k + '_'),
                'href': obj.href
              };
            } else {
              opts.SPAN = {
                'className': $.a.k + '_' + obj.className.replace(/ /g, ' ' + $.a.k + '_')
              };
            }
            var root = $.f.make(opts);
            $.f.buildOne(obj, root);
            return root;
          } else {
            if ( obj && obj.length) {
              for (var i = 0; i < obj.length; i = i + 1) {
                $.f.buildOne(obj[i], el);
              }
            } else {
              for (var key in obj) {
                if (typeof obj[key] === 'string') {
                  // set an attribute
                  var value = obj[key];
                  if (key === 'text') {
                    el.innerHTML = el.innerHTML + value;
                  }
                  if (key === 'addClass') {
                    el.className = el.className + ' ' + $.a.k + '_' +  value;
                  }
                  if ($.a.build.setStyle[key]) {
                    if (key === 'backgroundImage') {
                      el.style[key] = 'url(' + value + ')';
                      $.f.set(el, 'data-pin-src', value);
                    } else {
                      el.style[key] = value;
                    }
                  }
                  if ($.a.build.setData[key]) {
                    $.f.set(el, 'data-pin-' + key, value);
                  }
                } else {
                  // create a new container
                  var child = $.f.make({
                    'SPAN': {
                      'className': $.a.k + '_' + key.replace(/ /g, ' ' + $.a.k),
                      'data-pin-href': $.f.getData(el, 'href'),
                      'data-pin-log': $.f.getData(el, 'log')
                  }});
                  if (key === 'embed' || key === 'video') {
                    if (key === 'embed') {
                      var embed = obj[key];
                      if (embed.type && embed.type === 'gif') {
                        // it's an animated gif
                        el.appendChild($.f.make({'SPAN': {
                          'className': $.a.k + '_control ' + $.a.k + '_paused',
                          'data-pin-log': 'embed_pin_play',
                          'data-pin-src': embed.src
                        }}));
                      } else {
                        if (embed.src) {
                          el.appendChild($.f.make({'IFRAME': {
                            'className': $.a.k + '_iframe',
                            'src': embed.src.replace(/autoplay=/i, 'nerfAutoPlay=')
                          }}));
                        }
                      }
                    } else {
                      // native video
                      var video = $.f.make({'VIDEO': {
                        'controls': 'controls',
                        'width': obj.video.width + '',
                        'className': $.a.k + '_video',
                        'data-pin-log': 'embed_pin_video'
                      }});
                      video.appendChild($.f.make({'SOURCE': {
                        'src': obj.video.m3u8,
                        'type': 'video/m3u8'
                      }}));
                      video.appendChild($.f.make({'SOURCE': {
                        'src': obj.video.mp4,
                        'type': 'video/mp4'
                      }}));
                      video.style.display = 'none';
                      el.appendChild(video);
                      el.appendChild($.f.make({'SPAN': {
                        'className': $.a.k + '_native',
                        'data-pin-log': 'embed_pin_native'
                      }}));
                    }
                  } else {
                    el.appendChild(child);
                    $.f.buildOne(obj[key], child);
                  }
                }
              }
            }
          }
        },

        // a click!
        click: function (v) {
          v = v || $.w.event;
          var el, log, x, pinId, href;
          el = $.f.getEl(v);
          if (el) {
            log = $.f.getData(el, 'log');
            // custom buttons with child nodes may not pass clicks; check one level up
            if (!log && el.parentNode) {
              el = el.parentNode;
              log = $.f.getData(el, 'log');
            }
            // is it one of ours?
            if (log) {
              x = $.f.getData(el, 'x') || '';
              href = $.f.getData(el, 'href');
              if (x) {
                // sticky and hoverbuttons will pass in &tall=1&round=1
                // embedded pin widget will show a naked value so report &x=value
                if (x.substr(0, 1) !== '&') {
                  x = '&x=' + encodeURIComponent(x);
                }
              }
              $.f.log('&event=click&target=' + log + '&lang=' + $.v.lang + '&sub=' + $.v.sub + x + '&href=' + encodeURIComponent(href));
              if (typeof $.f.util[$.a.util[log]] === 'function') {
                // got a special utility handler? run it
                $.f.util[$.a.util[log]]({'el': el, 'href': href, 'v': v});
              } else {
                if (href) {
                  // some elements are controls, like pause/play and menu toggle; they won't open new pages
                  $.w.open(href, '_blank');
                }
              }
            }
          }
        },

        // BEGIN HOVERBUTTON-RELATED STUFF

        // return the selected text, if any
        getSelection: function () {
          return ("" + ($.w.getSelection ? $.w.getSelection() : $.d.getSelection ? $.d.getSelection() : $.d.selection.createRange().text)).replace(/(^\s+|\s+$)/g, "");
        },

        // return current style property for element
        // via PPK (http://www.quirksmode.org/dom/getstyles.html)
        getStyle: function (el, prop, getNum) {
          var r = null;
          // modern browsers
          if ($.w.getComputedStyle) {
            r = $.w.getComputedStyle(el).getPropertyValue(prop);
          } else {
            // IE browsers
            if (el.currentStyle) {
              r = el.currentStyle[prop];
            }
          }
          // if we only want the numeric part, shave off px
          if (r && getNum) {
            r = parseInt(r) || 0;
          }
          return r;
        },

        // get the natural position of an element
        // via PPK (http://www.quirksmode.org/js/findpos.html)
        getPos: function (el) {
          var html, marginTop, paddingTop, marginLeft, paddingLeft;
          var x = 0, y = 0;
          if (el.offsetParent) {
            do {
              x = x + el.offsetLeft;
              y = y + el.offsetTop;
            } while (el = el.offsetParent);
            // add padding or margin set to the HTML element - fixes Wordpress admin toolbar
            if (!$.v.hazIE) {
              var html = $.d.getElementsByTagName('HTML')[0];
              var marginTop = $.f.getStyle(html, "margin-top", true) || 0;
              var paddingTop = $.f.getStyle(html, "padding-top", true) || 0;
              var marginLeft = $.f.getStyle(html, "margin-left", true) || 0;
              var paddingLeft = $.f.getStyle(html, "padding-left", true) || 0;
              x = x + (marginLeft + paddingLeft);
              y = y + (marginTop + paddingTop);
            }
            return {"left": x, "top": y};
          }
        },

        // show hoverbuttons and stickybuttons
        showHoverButton: function (el, sticky) {

          // always try to kill it
          $.f.kill($.s.hoverButton);

          // get config options
          var c = {
            'id': $.f.getData(el, 'id'),
            'url': $.f.getData(el, 'url'),
            'media': $.f.getData(el, 'media'),
            'description': $.f.getData(el, 'description'),
            'height': $.f.getData(el, 'height') || $.v.config.height || '20',
            'color': $.f.getData(el, 'color') || $.v.config.color || 'gray',
            'shape': $.f.getData(el, 'shape') || $.v.config.shape || 'rect',
            'lang': $.f.getData(el, 'lang') || $.v.config.lang,
            // new params
            'tall': $.f.getData(el, 'tall') || $.v.config.tall,
            'round': $.f.getData(el, 'round') || $.v.config.round
          };

          // legacy translations
          if (c.height === '28') {
            c.tall = true;
          }
          if (c.shape === 'round') {
            c.round = true;
          }

          var h, w;

          if (sticky) {
            // default round buttons to tall
            if (c.round) {
              c.tall = true;
            }
            // use actual image dimensions because they may be scaled below 120x120
            h = el.naturalHeight;
            w = el.naturalWidth;
          } else {
            // use rendered height/width so we don't wind up with hoverbuttons over scaled-down icons
            h = el.height;
            w = el.width;
          }

          // size > 120x120?
          if (h > $.a.hoverButtonMinImgSize && w > $.a.hoverButtonMinImgSize) {

            var x ='', impressionLogExtras = '&lang=' + c.lang + '&sub=' + $.v.sub;

            // make it fresh each time; this pays attention to individual image config options
            var buttonClass = $.a.k + '_button_pin';
            if (c.round) {
              buttonClass = buttonClass + ' ' + $.a.k + '_round';
              x = '&round=1';
            } else {
              buttonClass = buttonClass + ' ' + $.a.k + '_save'
            }

            if (c.tall) {
              buttonClass = buttonClass + ' ' + $.a.k + '_tall';
              x = x + '&tall=1';
            }

            impressionLogExtras = impressionLogExtras + x;

            // get position, start href
            var p = $.f.getPos(el), href, log;

            var log, href;
            if (c.id) {
              impressionLogExtras = impressionLogExtras + '&id=' + c.id;
              href = $.v.config.pinterest + $.a.path.repin.replace(/%s/, c.id);
              if (sticky) {
                log = 'button_pinit_sticky_repin';
              } else {
                log = 'button_pinit_floating_repin';
              }
            } else {
              // set the button href
              href = $.v.config.pinterest + $.a.path.create + 'guid=' + $.v.guid;
              href = href + '&url=' + encodeURIComponent(c.url || $.d.URL);
              href = href + '&media=' + encodeURIComponent(c.media || el.src);
              href = href + '&description=' + encodeURIComponent($.f.getSelection() || c.description || el.title || $.d.title);
              if (sticky) {
                log = 'button_pinit_sticky';
              } else {
                log = 'button_pinit_floating';
              }
            }

            $.s.hoverButton = $.f.make({'SPAN': {
              'className': buttonClass,
              'data-pin-log': log,
              'data-pin-href': href
            }});

            // add round=1 or tall=1 so we know on click
            if (x) {
              $.f.set($.s.hoverButton, 'data-pin-x', x);
            }

            // save button? use translated string
            if (!c.round) {
              $.s.hoverButton.innerHTML = $.a.strings[c.lang].save;
            }

            // add ID if we're repinning
            if (c.id) {
              $.f.set($.s.hoverButton, 'data-pin-id', c.id);
            }

            // log impressions after a button has actually rendered
            if (!$.v.hazLoggedHoverButton) {
              if (sticky) {
                $.f.log('&event=impression_sticky' + impressionLogExtras);
              } else {
                $.f.log('&event=impression_floating' + impressionLogExtras);
              }
              $.v.hazLoggedHoverButton = true;
            }

            // set height and position
            $.s.hoverButton.style.position = 'absolute';
            $.s.hoverButton.style.top = (p.top + $.a.hoverButtonOffsetTop) + 'px';
            $.s.hoverButton.style.left = (p.left + $.a.hoverButtonOffsetLeft) + 'px';
            $.s.hoverButton.style.zIndex = '8675309';

            $.d.b.appendChild($.s.hoverButton);

          }
        },

        // mouse over; only active if we have hoverbuttons
        over: function (v) {
          var t, el, src;
          t = v || $.w.event;
          el = $.f.getEl(t);
          if ($.f.canHazButton(el)) {
            // we are inside an image
            if (!$.v.hazHoverButton) {
              // show the hoverbutton
              $.v.hazHoverButton = true;
            }
            $.f.showHoverButton(el);
          } else {
            // we are outside an image. Do we need to hide the hoverbutton?
            if ($.v.hazHoverButton) {
              // don't hide the hoverbutton if we are over it
              if (el !== $.s.hoverButton) {
                // hide it
                $.v.hazHoverButton = false;
                $.f.kill($.s.hoverButton);
              }
            }
          }
        },

        // END HOVERBUTTON-RELATED STUFF

        // turn a raw number into a shortened pin count
        formatCount: function (n) {
          if (!n) {
            n = '0';
          } else {
            if (n > 999) {
              if (n < 1000000) {
                n = parseInt(n / 1000, 10) + 'K+';
              } else {
                if (n < 1000000000) {
                  n = parseInt(n / 1000000, 10) + 'M+';
                } else {
                  n = '++';
                }
              }
            }
          }
          n = n + '';
          return n;
        },

        // each kind of widget has its own structure
        structure: {
          buttonPin: function (r, options) {
            var template, formatCount, formattedCount, sep;
            template = {
              'className': 'button_pin',
              'log': options.log
            };

            if (options.id) {
              template.id = options.id;
            }
            if (options.log === 'button_pinit') {
              template.tagName = 'A';
              template.href = $.v.config.pinterest + '/pin/create/button/?guid=' + $.v.guid + '-' + $.v.countButton + '&url=' + encodeURIComponent(options.url) + '&media=' + encodeURIComponent(options.media) + '&description=' + encodeURIComponent(options.description);
            }
            if (options.log === 'button_pinit_bookmarklet') {
              template.href = $.v.config.pinterest + '/pin/create/button/';
            }
            if (options.log === 'button_pinit_repin') {
              template.href = $.v.config.pinterest + '/pin/' + options.id + '/repin/x/?guid=' + $.v.guid;
            } else {
              if (options.count) {
                // show count if positive, or configured to show above, or configured to show beside with data-pin-zero set
                if (r.count || options.count === 'above' || (options.count === 'beside' && options.zero)) {
                  formattedCount = $.f.formatCount(r.count);
                  template.className = template.className + ' ' + options.count;
                  // data-pin-x will log as an extra parameter when the button is clicked
                  template.x = formattedCount;
                  template.count = {
                    'text': formattedCount,
                    // data-pin-x needed here too because counts are clickable
                    'x': formattedCount
                  }
                }
              }
            }

            // round buttons require no innerHTML
            if (options.round) {
              template.className = template.className + ' round';
            } else {
              // data-pin-save="false" gets a Pin It button
              // instead of data-pin-save="true" getting a Save button (breaking change, 20171003)
              if (options.save !== 'false') {
                template.className = template.className + ' save';
                template.text = $.a.strings[options.lang].save || $.a.strings[$.v.config.lang].save;
              } else {
                // we're going to make an old-school Pin It button
                if (options.lang === 'ja') {
                  template.className = template.className + ' ja';
                }
                if (options.color === 'red') {
                  template.className = template.className + ' red';
                }
                if (options.color === 'white') {
                  template.className = template.className + ' white';
                }
              }
            }

            if (options.padded) {
              template.className = template.className + ' padded';
            }
            if (options.tall) {
              template.className = template.className + ' tall';
            }

            return $.f.buildOne(template);
          },
          buttonFollow: function (r, options) {
            var template = {
              'className': 'button_follow',
              'log': 'button_follow',
              'text': r.name
            };
            if (options.tall) {
              template.className = template.className + ' tall';
            }
            if (r.id.match(/\//)) {
              // found a forward-slash? follow a board
              template.href = $.v.config.pinterest + '/' + r.id + '/follow/?guid=' + $.v.guid;
            } else {
              // no forward-slash? follow a pinner
              template.href = $.v.config.pinterest + '/' + r.id + '/pins/follow/?guid=' + $.v.guid;
            }
            $.v.countFollow = $.v.countFollow + 1;
            return $.f.buildOne(template);
          },
          embedGrid: function (r, options) {
            var p, template, colHeight, i, pin, minValue, minIndex, j, buttonUrl, buttonLog, boardUrl, str, tt, labelClass, labelContent, profileUrl;
            if (r.data) {
              p = r.data;
              if (!options.columns || options.columns < 1 || options.columns > 10) {
                options.columns = 5;
              }
              if (options.height < 200) {
                options.height = 340;
              }

              // profileUrl is not internationalized by API; fix inline
              profileUrl = $.v.config.pinterest + '/' + p.user.profile_url.split('pinterest.com/')[1];

              template = {
                'className': 'embed_grid c' + options.columns,
                'log': 'embed_grid',
                'href': $.v.config.pinterest,
                'hd': {
                  'href': profileUrl,
                  'img': {
                    'backgroundImage': p.user.image_small_url.replace(/30x30_/, '60x60_')
                  },
                  'pinner': {
                    'text': p.user.full_name
                  }
                },
                'bd': {
                  'height': (options.height - 110)+ 'px',
                  'ct': []
                },
                'ft': {
                  'log':  'embed_user_ft',
                  'href': profileUrl + 'pins/follow/?guid=' + $.v.guid,
                  'button': {}
                }
              }

              if (options.noscroll) {
                template.className = template.className + ' noscroll';
              }

              if (options.width) {
                template.width = options.width + 'px';
              }

              // masonry layout
              colHeight = [];
              for (i = 0; i < options.columns; i = i + 1) {
                template.bd.ct.push({'col': []});
                colHeight[i] = 0;
              }
              for (i = 0; i < p.pins.length; i = i + 1) {
                pin = p.pins[i];
                minValue = colHeight[0];
                minIndex = 0;
                for (j = 0; j < options.columns; j = j + 1) {
                  if (colHeight[j] < minValue) {
                    minIndex = j;
                    minValue = colHeight[j];
                  }
                }
                template.bd.ct[minIndex].col.push({
                  'img': {
                    'href': $.v.config.pinterest + '/pin/' + pin.id,
                    'backgroundImage': pin.images['237x'].url,
                    'backgroundColor': pin.dominant_color,
                    'paddingBottom': (pin.images['237x'].height / pin.images['237x'].width) * 100 + '%'
                  }
                });
                colHeight[minIndex] = colHeight[minIndex] + pin.images['237x'].height;
              }
              // follow button
              if (p.board) {
                // it's a board
                template.className = template.className + ' board';
                boardUrl = $.v.config.pinterest + p.board.url;
                template.hd.board = {
                  'text': p.board.name,
                  'href': boardUrl
                }
                buttonUrl = boardUrl + 'follow/?guid=' + $.v.guid;
                if (r.data.section) {
                  template.hd.board = {
                    text: r.data.section.title,
                    href: boardUrl + r.theCall.split('/pins/')[0].split('/').pop() + '/'
                  }
                  buttonLog = 'embed_section_ft';
                  $.v.countSection = $.v.countSection + 1;
                } else {
                  buttonLog = 'embed_board_ft';
                  template.ft.href = buttonUrl;
                  $.v.countBoard = $.v.countBoard + 1;
                }
              } else {
                // it's a profile
                buttonUrl = profileUrl + 'pins/follow?guid=' + $.v.guid;
                buttonLog = 'embed_user_ft';
                $.v.countProfile = $.v.countProfile + 1;
              }

              // follow button label
              str = $.a.strings[options.lang].followOn;
              tt = str.split('%s');

              // if class is "bottom" break text above button at narrow widths
              labelClass = 'bottom';
              labelContent = '<span class="' + $.a.k + '_string" data-pin-href="' + buttonUrl + '" data-pin-log="' + buttonLog + '">' + tt[0] + '</span><span class="' + $.a.k + '_logo" data-pin-href="' + buttonUrl + '" data-pin-log="' + buttonLog + '"></span>';
              if (tt[0] === '') {
                // if class is "top" break text below button at narrow widths
                labelClass = 'top';
                labelContent = '<span class="' + $.a.k + '_logo" data-pin-href="' + buttonUrl + '" data-pin-log="' + buttonLog + '"></span><span class="' + $.a.k + '_string" data-pin-href="' + buttonUrl + '" data-pin-log="' + buttonLog + '">' + tt[1] + '</span>';
              }
              // render HTML outside of buildOne -- dangerous but necessary
              template.ft.button.label = {
                'addClass': labelClass,
                'text': labelContent
              }
              return $.f.buildOne(template);
            }
          },
          embedPin: function (r, options) {
            var p, template, langMod, widthMain, widthMod, thumb, saves, done;
            if (r.data && r.data[0]) {
              p = r.data[0];
              if (p.error) {
                $.f.log('&event=api_error&code=embed_pin_not_found&pin_id=' + p.id);
                return false;
              }
              if (!p.rich_metadata) {
                p.rich_metadata = {};
              }
              langMod = '';
              widthMain = '';
              widthMod = '';
              thumb = {
                'url': p.images['237x'].url,
                'height': p.images['237x'].height,
                'width': p.images['237x'].width
              };

              if (options.width && (options.width === 'medium' || options.width === 'large')) {
                widthMain = ' ' + options.width;
                widthMod = '_' + options.width;
                // add to medium and large embedded pin counts
                if (options.width === 'medium') {
                  thumb.url = thumb.url.replace(/237x/, '345x');
                  thumb.width = 345;
                  thumb.height = ~~(thumb.height * 1.456);
                  $.v.countPinMedium = $.v.countPinMedium + 1;
                }
                if (options.width === 'large') {
                  thumb.url = thumb.url.replace(/237x/, '600x');
                  thumb.width = 600;
                  thumb.height = ~~(thumb.height * 2.532);
                  $.v.countPinLarge = $.v.countPinLarge + 1;
                }
              }
              if (options.lang) {
                langMod = ' ' + options.lang;
              }
              template = {
                'className': 'embed_pin' + widthMain + langMod,
                'log': 'embed_pin' + widthMod,
                'href': $.v.config.pinterest + '/pin/' + p.id + '/',
                'id': p.id,
                'bd': {
                  'hd': {
                    // main container; gets padding for proper height
                    'container': {
                      'paddingBottom': ~~(thumb.height / thumb.width * 10000) / 100 + '%',
                      // main image
                      'img': {
                        'backgroundImage': thumb.url,
                        // log a different value for image
                        'log': 'embed_pin_img'  + widthMod
                      }
                    },
                    // Pin It button
                    'repin': {
                      // log a different value for button
                      'log': 'embed_pin_repin' + widthMod,
                      'id': p.id
                    }
                  },
                  // rich pin data
                  'source': {
                    'log': 'embed_pin_domain',
                    'href': p.rich_metadata.url || $.v.config.pinterest + '/pin/' + p.id + '/',
                    // favicon
                    'img': {
                      'backgroundImage': p.rich_metadata.favicon_link || ''
                    },
                    'domain': {
                      'text': p.rich_metadata.site_name || $.a.strings[options.lang]['from'].replace(/%s/, p.domain)
                    },
                    // copyright report form
                    'menu': {
                      // empty value here means "render an empty span with className toggle"
                      'toggle': {
                        'href': '',
                        'log': 'embed_pin_toggle'
                      },
                      // dropdown is the containing bubble
                      'dropdown': {
                        // the actual text string. whever value = %, set it to strings[key]
                        'text': $.a.strings[options.lang].report,
                        'log': 'embed_pin_report',
                        'href': $.v.config.pinterest + $.a.path.report + '?id=' + p.id
                      }
                    }
                  }
                },
                'ft': {
                  'href': p.pinner.profile_url.replace(/https?:\/\/www\.pinterest\.com\//, $.v.config.pinterest + '/'),
                  'log': 'embed_pin_pinner' + widthMod,
                  'img': {
                    'backgroundImage': p.pinner.image_small_url.replace(/30x30_/, '60x60_')
                  },
                  'pinner': {
                    'text': p.pinner.full_name
                  },
                  'board': {
                    'href': $.v.config.pinterest +  p.board.url,
                    'log': 'embed_pin_board' + widthMod,
                    'text': p.board.name
                  }
                }
              };
              template.bd.hd.repin.addClass = 'save';
              template.bd.hd.repin.text = $.a.strings[options.lang].save;
              if (!options.terse) {
                // optional pin description; hidden when data-pin-terse is set
                template.bd.description = {
                  'text': p.description
                }
              }
              // if there's no rich data, give the domain some room
              if (!p.rich_metadata.favicon_link) {
                template.bd.source.addClass = 'nofav';
              }
              // old-school Flickr / YouTube media attribution
              if (p.attribution && p.attribution.author_name && p.attribution.author_url) {
                // super-paranoid here; we have seen some attribution objects with null members
                template.bd.attribution = {
                  'href': p.attribution.author_url,
                  'log': 'embed_pin_attrib',
                  // favicon
                  'img': {
                    'backgroundImage': p.attribution.provider_icon_url
                  },
                  // translated string
                  'by': {
                    'text': $.a.strings[options.lang]['by'].replace(/%s/, p.attribution.author_name)
                  }
                }
              }
              // swap in embedded media?
              if (p.embed && p.embed.src) {
                template.bd.hd.container.embed =  p.embed;
              }
              if (p.videos && p.videos.video_list && p.videos.video_list.V_HLSV4 && p.videos.video_list.V_720P) {
                template.bd.hd.container.video =  {
                  'width': thumb.width,
                  'height': thumb.height,
                  'm3u8': p.videos.video_list.V_HLSV4.url,
                  'mp4': p.videos.video_list.V_720P.url
                };
              }

              // stats

              // start with repin count
              if (p.repin_count) {
                saves = p.repin_count;
              }

              // if we have an aggregated save count, use that
              if (p.aggregated_pin_data && p.aggregated_pin_data.aggregated_stats) {
                if (p.aggregated_pin_data.aggregated_stats.saves) {
                  saves = p.aggregated_pin_data.aggregated_stats.saves;
                }
                if (p.aggregated_pin_data.aggregated_stats.done) {
                  done = p.aggregated_pin_data.aggregated_stats.done;
                }
              }

              // got something
              if (saves || done) {
                template.bd.stats = {};
                if (saves) {
                  template.bd.stats.repins = {
                    'text': $.f.formatCount(saves),
                    // log x=count_save on click
                    'x': 'count_save',
                    'href': $.v.config.pinterest + '/pin/' + p.id + '/repins/'
                  }
                }
                if (done) {
                  template.bd.stats.done = {
                    'text': $.f.formatCount(done),
                    // log x=count_done on click
                    'x': 'count_done',
                    'href': $.v.config.pinterest + '/pin/' + p.id + '/activity/tried/'
                  }
                }
              }

              $.v.countPin = $.v.countPin + 1;
              return $.f.buildOne(template);
            }
          }
        },

        getLegacy: {
          grid: function (a, o) {
            var scaleHeight = parseInt($.f.getData(a, 'scale-height'));
            var scaleWidth = parseInt($.f.getData(a, 'scale-width'));
            var boardWidth = parseInt($.f.getData(a, 'board-width'));
            // don't force the board to be wider than the containing parent
            if (boardWidth > a.parentNode.offsetWidth) {
              boardWidth = '';
            }
            // scaleHeight is the height of the grid container in legacy
            // to make it full height, add 110
            if (scaleHeight) {
              o.height = scaleHeight + 110;
            }
            if (scaleWidth && boardWidth) {
              // operator has specified column width and grid width, so we can get column count
              if (scaleWidth > 59 && scaleWidth < 238) {
                o.columns = Math.floor(boardWidth / scaleWidth);
                // o.width will be set as max-width on the main container
                o.width = boardWidth + 20;
              }
            }
          },
          buttonPin: function (a, o) {

            // seek legacy attributes
            var c = {
              'zero': $.f.getData(a, 'zero') || $.v.config.zero,
              'pad': $.f.getData(a, 'count-pad'),
              'height': $.f.getData(a, 'height'),
              'shape': $.f.getData(a, 'shape'),
              'config': $.f.getData(a, 'config'),
              // check for inline overrides
              'tall': $.f.getData(a, 'tall'),
              'round': $.f.getData(a, 'round'),
              // here we use $.f.get because it's count-layout, not data-pin-count-layout
              'countLayout': $.f.get(a, 'count-layout')
            };

            // operator has specifically told us to show zero counts
            if (c.zero) {
              o.zero = true;
            }

            if (o.count) {
              // operator is using new count position, so always pad and show zero counts
              o.padded = true;
              o.zero = true;
            } else {
              if (c.pad) {
               // operator has specifically told us to pad under count bubbles
                o.padded = true;
              }
              // find count position -- elderly buttons may have data-pin-config or count-layout
              if (c.config === 'beside' || c.countLayout === 'horizontal') {
                o.count = 'beside';
              } else {
                if (c.config === 'above' || c.countLayout === 'vertical') {
                  o.count = 'above';
                }
              }
            }

            // translate valid shapes into round = true
            if (c.shape === 'round') {
              o.round = true;
            }

            // translate valid tall heights into tall = true
            if (c.height === '28' || c.height === '32') {
              o.tall = true;
            }

            // inline overrides
            if (c.tall) {
              o.tall = true;
              if (c.tall === 'false') {
                o.tall = false;
              }
            }
            if (c.round) {
              o.round = true;
              if (c.round === 'false') {
                o.round = false;
              }
            }
          }
        },

        seek: {
          buttonPin: function (a) {

            var p, o, k, cf;

            // community-generated standard: data-pin-do="none" means "don't render a button here"
            if ($.a.noneParam[$.f.getData(a, 'do')] === true) {
              $.f.debug('Found a link to pin create form with data-pin-do="none"');
              return;
            }

            // can we parse the href and get url, media, and description?
            if (a.href) {
              p = $.f.parse(a.href, {'url': true, 'media': true, 'description': true});
            }

            cf = $.f.getData(a, 'custom');

            // get all the things
            o = {
              'do': $.f.getData(a, 'do'),
              'id': $.f.getData(a, 'id'),
              'url': $.f.getData(a, 'url') || p.url || $.d.URL,
              'media': $.f.getData(a, 'media') || p.media,
              'description': $.f.getData(a, 'description') || p.description || $.d.title,
              'custom': cf || $.v.config.custom,
              'count': $.f.getData(a, 'count') || $.v.config.count,
              'color': $.f.getData(a, 'color') || $.v.config.color,
              'round': $.f.getData(a, 'round') || $.v.config.round,
              'tall': $.f.getData(a, 'tall') || $.v.config.tall,
              'lang': $.f.getData(a, 'lang') || $.v.config.lang,
              'save': $.f.getData(a, 'save') || $.v.config.save
            };

            // add global custom flag to log
            if ($.v.config.custom) {
              $.v.log.customGlobal = 1;
            }

            // add local custom flag to log
            if (cf) {
              $.v.log.customLocal = 1;
            }

            // change save flag to pinit (breaking change, 20171003)
            if ($.v.config.save === 'false') {
              $.v.log.pinit = 1;
            }

            $.f.checkLang(o);

            // how to tell what kind of button we need to make
            if (o.media) {
              // it's a properly-configured Any Image button
              o.log = 'button_pinit';
            } else {
              if (o.id) {
                // it's a repin button
                o.log = 'button_pinit_repin';
              } else {
                // it's a bookmark button
                o.log = 'button_pinit_bookmarklet';
              }
            }
            // increment here so we count custom buttons
            $.v.countButton = $.v.countButton + 1;

            // custom button: remove href, listen for click
            if (o.custom) {
              // remove href, prevent default behavior
              a.removeAttribute('href');
              // tell us what to log
              $.f.set(a, 'data-pin-log', 'button_pinit');
              // o.url, o.media, and o.description have already been parsed and set
              $.f.set(a, 'data-pin-href', $.v.config.pinterest + '/pin/create/button' +
                         '?guid=' + $.v.guid + '-' + $.v.countButton +
                         '&url=' + encodeURIComponent(o.url) +
                         '&media=' + encodeURIComponent(o.media) +
                         '&description=' + encodeURIComponent(o.description));
              $.f.debug('Found a link with data-pin-custom="true"');
              $.f.debug(a);
              return;
            } else {
              $.f.getLegacy.buttonPin(a, o);
              k = false;
              if (o.count === 'above' || o.count === 'beside') {
                k = true;
                if (o.url) {
                  // get a count from the url argument
                  $.f.call($.a.endpoint.count.replace(/%s/, encodeURIComponent(o.url)), function (r) {
                    $.f.replace(a, $.f.structure.buttonPin(r, o));
                  });
                }
              }

              // we have not made a call to count.json; build now
              if (!k) {
                var s = $.f.structure.buttonPin(a, o);
                $.f.replace(a, s);
              }
            }
          },
          buttonBookmark: function (a) {
            if ($.f.getData(a, 'custom')) {
              $.f.set(a, 'data-pin-log', 'button_pinit_bookmarklet');
              $.f.set(a, 'data-pin-href', $.v.config.pinterest + '/pin/create/button/');
              a.removeAttribute('href');
              return;
            } else {
              // send it over to buttonPin, which will know it's a bookmark button
              $.f.seek.buttonPin(a);
            }
          },
          buttonFollow: function (a) {
            var p, o, r, href;
            r = {};
            o = {
              'custom': $.f.getData(a, 'custom'),
              'tall': $.f.getData(a, 'tall'),
              'lang': $.f.getData(a, 'lang') || $.v.config.lang
            };
            $.f.checkLang(o);
            p = $.f.getPath(a.href);
            if (p.length) {
              r.name = a.textContent;
              r.id = p[0];
              // shall we follow a board?
              if (p[0] && p[1]) {
                r.id = p[0] + '/' + p[1];
              }
              if (o.custom) {
                if (r.id.match(/\//)) {
                  // found a forward-slash? follow a board
                  href = $.v.config.pinterest + '/' + r.id + '/follow/?guid=' + $.v.guid;
                } else {
                  // no forward-slash? follow a pinner
                  href = $.v.config.pinterest + '/' + r.id + '/pins/follow/?guid=' + $.v.guid;
                }
                $.f.set(a, 'data-pin-href', href);
                $.f.set(a, 'data-pin-log', 'button_follow');
                $.w.setTimeout(function () {
                  a.removeAttribute('href');
                }, 1);
                $.f.debug('Found a link with data-pin-custom="true"');
                return;
              } else {
                $.f.replace(a, $.f.structure.buttonFollow(r, o));
              }
            }
          },
          embedBoard: function (a, href, sectionLevelError) {
            var boardOrSection, p, u, o, bs;
            p = $.f.getPath(href);
            // let's remove the empty string

            if (p[p.length - 1] === '') {
              p.pop();
            }
            // if we received an error from the Section level, so let's the Board
            if (sectionLevelError) {
              p.pop();
            }
            if (p.length > 1) {
              o = {
                columns: $.f.getData(a, 'columns') || $.v.config.grid.columns,
                height: $.f.getData(a, 'height') - 0 || $.v.config.grid.height,
                width: $.f.getData(a, 'width') || null,
                noscroll: $.f.getData(a, 'noscroll') || null,
                lang: $.f.getData(a, 'lang') || $.v.config.lang
              };

              // is it a Board?
              if (p.length === 2) {
                u = p[0] + '/' + p[1];
                boardOrSection = 'board';
              }

              // is it a Section? and does the Section have value?
              if (p.length === 3 && p[2]) {
                u = p[0] + '/' + p[1] + '/' + p[2];
                boardOrSection = 'section';
              }
              // there were no Pins in the Section or we received an error from the section so let's make a call to the Boards
              if (sectionLevelError) {
                boardOrSection = 'board';
              }
              $.f.checkLang(o);
              $.f.getLegacy.grid(a, o);
              bs = '';
              if ($.w.location.protocol === 'https:') {
                bs='&base_scheme=https';
              }
              $.f.call($.a.endpoint[boardOrSection].replace(/%s/, u) + '?sub=' + $.v.sub + bs, function (r) {
                if (r.status === 'success') {
                  if (boardOrSection === 'board') {
                    $.f.replace(a, $.f.structure.embedGrid(r, o));
                  }
                  if (boardOrSection === 'section') {
                    if (r.data.pins.length) {
                      // we found Pins in the Section
                      $.f.replace(a, $.f.structure.embedGrid(r, o));
                    } else {
                      // we have a Section, but the Section has no Pins, so let's show the Board level
                      $.f.seek.embedBoard(a, href, true);
                    }
                  }
                }

                if (r.status === 'failure') {
                  if (boardOrSection === 'board') {
                    // Board does not exist - do nothing
                  }
                  if (boardOrSection === 'section') {
                    // API returned an error when checking for the Section level i.e. Section does not exist, so let's show the Board level if it exists
                    $.f.seek.embedBoard(a, href, true);
                  }
                }
              });
            }
          },
          embedUser: function (a, href) {
            var p, o, bs;
            p = $.f.getPath(href);
            if (p.length) {
              o = {
                'columns': $.f.getData(a, 'columns') || $.v.config.grid.columns,
                'height': $.f.getData(a, 'height') - 0 || $.v.config.grid.height,
                'width': $.f.getData(a, 'width') || null,
                'noscroll': $.f.getData(a, 'noscroll') || null,
                'lang': $.f.getData(a, 'lang') || $.v.config.lang
              };
              $.f.checkLang(o);
              $.f.getLegacy.grid(a, o);
              bs = '';
              if ($.w.location.protocol === 'https:') {
                bs='&base_scheme=https';
              }
              $.f.call($.a.endpoint.user.replace(/%s/, p[0]) + '?sub=' + $.v.sub + bs, function (r) {
                $.f.replace(a, $.f.structure.embedGrid(r, o));
              });
            }
          },
          embedPin: function (a) {
            var p, o, bs;
            p = $.f.getPath(a.href);
            if (p.length) {
              o = {
                'width': $.f.getData(a, 'width') || null,
                'terse': $.f.getData(a, 'terse') || null,
                'lang': $.f.getData(a, 'lang') || $.v.config.lang
              };
              bs = '';
              if ($.w.location.protocol === 'https:') {
                bs='&base_scheme=https';
              }
              $.f.call($.a.endpoint.pin.replace(/%s/, p[1]) + '&sub=' + $.v.sub + bs, function (r) {
                $.f.replace(a, $.f.structure.embedPin(r, o));
              });
            }
          }
        },
        // return the path part of a Pinterest URL
        getPath: function (url) {
          // remove hash and query, then split into path components
          var path = url.split('#')[0].split('?')[0].split('/');
          if (path.length > 2) {
            // remove http
            path.shift();
            // remove empty space between forward-slashes
            path.shift();
            // remove server.pinterest.tld
            path.shift();
          } else {
            path = [];
          }
          return path;
        },

        // find elements that need to be turned into buttons or widgets
        build: function (el) {
          var t, a, i, n, href, doThis;
          // no element passed? use document
          if (!el) {
            el = $.d;
          }
          // collect all the links
          t = el.getElementsByTagName('A');
          // collection to array
          a = [];
          for (i = 0; i < t.length; i = i + 1) {
            if (t[i].href) {
              a.push(t[i]);
            }
          }
          // loop and check
          for (i = 0, n = a.length; i < n; i = i + 1) {
            href = a[i].href;
            // does it match to pinterest domain
            if (href && href.match($.a.myDomain)) {
              // do we have a data-pin-do directive?
              doThis = $.f.getData(a[i], 'do');
              // does data-pin-do correspond to a function we're ready to run?
              if (typeof $.f.seek[doThis] === 'function') {
                // be nice to double-encoded board and profile URLs
                try {
                  href = decodeURIComponent(decodeURIComponent(href));
                } catch (err) {}
                $.f.seek[doThis](a[i], href);
                continue;
              }
              // do we need to build a legacy button?
              if (href.match(/\/pin\/create\/button\//)) {
                $.f.seek.buttonPin(a[i]);
                continue;
              }
              // do we need to build a custom button?
              if ($.f.getData(a[i], 'custom')) {
                $.f.seek.buttonPin(a[i]);
                continue;
              }
            }
          }
        },

        exposeUtil: function() {
          // expose all util functions
          var util = $.w[$.v.config.util] = $.f.util;
          // expose build function
          if ($.v.config.build) {
            $.f.debug('exposing $.f.build as ' + $.v.config.build);
            util.build = $.w[$.v.config.build];
          } else {
            $.f.debug('exposing $.f.build at ' + $.v.config.util + '.build');
            util.build = $.f.build;
          }
        },

        // be sure we have requested strings for language
        checkLang: function (o) {
          // do we have these strings?
          if (!$.a.strings[o.lang]) {
            o.lang = $.v.config.lang;
          }
        },

        // find and apply configuration requests from surrounding page, plus those passed as data attributes on SCRIPT tag
        config: function () {
          var script = $.d.getElementsByTagName('SCRIPT'), i, j, n, p;

          // get all config params by finding data-pin- attributes on pinit.js
          for (i = script.length - 1; i > -1; i = i - 1) {
            // is it us?
            if ($.a.me && script[i] && script[i].src && script[i].src.match($.a.me)) {
              // loop through all possible config params
              for (j = 0; j < $.a.configParam.length; j = j + 1) {
                p = $.f.getData(script[i], $.a.configParam[j]);
                if (p) {
                  // set or overwrite config param with contents
                  $.v.config[$.a.configParam[j]] = p;
                }
              }
              // burn after reading to prevent future calls from re-reading config params
              $.f.kill(script[i]);
            }
          }

          // did the site operator attempt to set a lang with data-pin-lang on pinit.js?
          if ($.v.config.lang) {
            // check that it's valid (don't bother checking first syllable of lang; operators need to give us a valid string)
            if (!$.a.strings[$.v.config.lang]) {
              // lang has already been deduced from HTML or META tag, validated, and set to $.v.lang if invalid
              $.f.debug($.v.config.lang + ' not found in valid languages, changing back to ' + $.v.lang);
              $.v.config.lang = $.v.lang;
            }
          } else {
            $.v.config.lang = $.v.lang;
          }

          // build utility
          if (typeof $.v.config.build === 'string') {
            $.w[$.v.config.build] = function (el) {
              $.f.build(el);
            };
          }

          // filter user-specified logging tag
          if ($.v.config.tag) {
            $.v.config.tag = $.v.config.tag.replace(/[^a-zA-Z0-9_]/g, '').substr(0, 32);
          }

          // global Pinterest URL will be used in most places; we will have to update URLs we get from API endpoints in widgets
          $.v.config.pinterest = 'https://' + $.v.sub + '.pinterest.com';

          // wait one second and then send a logging ping
          $.w.setTimeout(function () {
            var str = '&event=init&sub=' + $.v.sub + '&button_count=' + $.v.countButton + '&follow_count=' + $.v.countFollow + '&pin_count=' + $.v.countPin;
            if ($.v.canHazHoverButtons) {
              str = str + '&button_hover=1';
            }
            if ($.v.canHazStickyButtons) {
              str = str + '&button_sticky=1';
            }
            if ($.v.countPinMedium) {
              str = str + '&pin_count_medium=' + $.v.countPinMedium;
            }
            if ($.v.countPinLarge) {
              str = str + '&pin_count_large=' + $.v.countPinLarge;
            }
            if ($.v.log.customGlobal) {
              str = str + '&custom_global=1';
            }
            if ($.v.log.customLocal) {
              str = str + '&custom_local=1';
            }
            // someone has expressly asked for Pin It buttons by setting save=false
            if ($.v.log.pinit) {
              str = str + '&pinit_flag=1';
            }
            str = str + '&profile_count=' + $.v.countProfile + '&board_count=' + $.v.countBoard + '&section_count=' + $.v.countSection;
            // were we called by pinit.js?
            if (typeof $.w['PIN_' + ~~(new Date().getTime() / 86400000)] !== 'number') {
              str = str + '&xload=1';
            }
            str = str + '&lang=' + $.v.config.lang;
            // log window.navigator.language
            if ($.n.language) {
              str = str + '&nvl=' + $.n.language;
            }
            $.f.log(str);
          }, 1000);

        },

        // given window.navigator.language, return appropriate strings and domain
        langLocLookup: function () {

          var t, i, lang, locale, hazAltDomain, q;

          // defaults: English, WWW
          $.v.lang = 'en';
          $.v.sub = 'www';

          // try window.navigator.language first
          t = $.n.language || $.v.lang;
          $.f.debug('Looking up language and domain for ' + t);

          // clean and split
          t = t.toLowerCase();
          t = t.replace(/[^a-z0-9]/g, ' ');
          t = t.replace(/^\s+|\s+$/g, '')
          t = t.replace(/\s+/g, ' ');
          t = t.split(' ');

          // fix three-parters like bs-latn-ba
          if (t.length > 2) {
            for (i = t.length-1; i > -1; i = i - 1) {
              if (t[i].length !== 2) {
                t.splice(i, 1);
              }
            }
          }

          // do we have strings that match t[0];
          if (t[0]) {
            lang = t[0];
            // is there an immediate match for language in strings?
            if ($.a.strings[lang]) {
              $.v.lang = lang;
            }
            // is there an immediate match for language in domains?
            if ($.a.save.domain[lang]) {
              // fix one-part navigator.language trouble (jp, kr)
              if (typeof $.a.save.domain[lang] === 'string') {
                $.v.sub = $.a.save.domain[lang];
              } else {
                $.v.sub = lang;
              }
            }

            // do we have a locale?
            if (t[1]) {
              locale = t[1];
              if (locale !== lang) {
                hazAltDomain = false;
                q = $.a.save.lookup[lang];
                // find it in list?
                if (q) {
                  // bare domain like fi needs to allow fi-us
                  if (q === true) {
                    if (!$.a.save.domain[locale]) {
                      $.v.sub = 'www';
                    }
                  } else {
                    // some domains don't match string abbreviation
                    if (q.d === locale) {
                      // domain matches main default, as for hi-in
                      $.v.sub = q.d;
                    } else {
                      // got alt?
                      if (q.alt) {
                        if (q.alt[locale]) {
                          if (typeof q.alt[locale] === 'string') {
                            // alt dom is a string, as for gb = uk, no lookup needed
                            $.v.sub = q.alt[locale];
                          } else {
                            if (q.alt[locale].d) {
                              // domain is different, as for pt-br
                              $.v.sub = q.alt[locale].d;
                              hazAltDom = true;
                            }
                            if (q.alt[locale].s) {
                              // strings are different as for fr-be or tr-cy
                              $.v.lang = q.alt[locale].s;
                            }
                          }
                        }
                      }
                    }
                  }
                }
                // if we don't have an alternate domain, use the default for this domain
                if (!hazAltDomain) {
                  if ($.a.save.domain[locale]) {
                    $.v.sub = locale;
                  }
                }
              }
            }
          }
          $.f.debug('Lang: ' + $.v.lang);
          $.f.debug('Subdomain: ' + $.v.sub);
          return { 's': $.v.lang, 'd': $.v.sub};
        },

        // should this element be allowed a hovering or sticky Save button?
        canHazButton: function (el) {
          var src, r = false;
          // is the candidate element an image?
          if (el && el.tagName && el.tagName === 'IMG') {
            // check for data-pin-media first, then src attribute
            src = $.f.getData(el, 'media') || el.src;
            // do we have source?
            if (src) {
              // can source be crawled by our back end?
              if (src.match(/^https?:\/\//)) {
                // do we have data-pin-no-hover (canonical) or data-pin-nohover (community-generated)
                if (!$.f.getData(el, 'no-hover') && !$.f.getData(el, 'nohover')) {
                  // do we have data-pin-nopin (canonical) or data-nopin (community-generated)?
                  if (!$.f.getData(el, 'nopin') && !$.f.get(el, 'data-nopin')) {
                    r = true;
                  }
                }
              }
            }
          }
          return r;
        },

         // BEGIN STICKY BUTTONS

        sticky: {
          // given point X and Y, tell us if there's an image
          find: function (o) {
            var el, r;
            r = {};
            el = $.d.elementFromPoint(o.x,  o.y);
            if ($.f.canHazButton(el)) {
              r = {
                rect: el.getBoundingClientRect(),
                img: el
              };
            }
            return r;
          },
          // hide sticky button
          hide: function () {
            $.f.kill($.s.hoverButton);
          },
          // show sticky button over an image
          show: function (o) {
            if (o && o.img) {
              // second parameter "true" directs us to check naturalHeight and naturalWidth
              $.f.showHoverButton(o.img, true);
            }
          },
          // look for a pinnable thing
          fire: function () {
            var i, x, el, delta, key = {}, found = [], showMe, imageMidX, best = $.w.innerWidth;
            if (!$.v.sticky.hazTouch) {
              for (x = 0; x < $.w.innerWidth; x = x + $.w.innerWidth / 10) {
                el = $.f.sticky.find({
                  x: x,
                  y: $.w.innerHeight / $.a.sticky.scanAt
                });
                if (el.rect && el.img && !key[el.img.src]) {
                  key[el.img.src] = true;
                  found.push({
                    img: el.img,
                    rect: el.rect
                  });
                }
              }
              // find the image on the centerline whose middle is closest to our last touch
              for (i = 0; i < found.length; i = i + 1) {
                imageMidX = (found[i].rect.x + found[i].rect.width / 2);
                delta = Math.abs($.v.sticky.touchX - imageMidX);
                if (delta < best) {
                  best = delta;
                  showMe = found[i];
                }
              }
              $.f.sticky.show(showMe);
            }
          },
          // watch our viewport for changes
          observe: function () {
            // has our screen position changed since the last time we checked?
            if ($.v.sticky.hazChange) {
              // are we done scrolling?
              if ($.w.pageYOffset === $.v.sticky.pageY) {
                // we are holding still, so look for a pinnable thing
                $.f.sticky.fire();
                $.v.sticky.hazChange = false;
              } else {
                // we are still moving, so do nothing
                $.v.sticky.pageY = $.w.pageYOffset;
              }
            } else {
              // did the scroll event just start?
              if ($.w.pageYOffset !== $.v.sticky.pageY) {
                $.f.sticky.hide();
                // set our pageY pointer
                $.v.sticky.pageY = $.w.pageYOffset;
                // start watching for scroll stop
                $.v.sticky.hazChange = true;
              }
            }
            // check again later
            $.w.setTimeout($.f.sticky.observe, $.a.sticky.obsDelay);
          },
          // let's get ready to stick it!
          init: function () {
            // transfer config params into variable space, which will change later
            $.v.sticky = $.a.sticky;
            // listen for events
            $.f.listen($.w, 'touchstart', function (e) {
              // knowing X will help us guess the right image later
              $.v.sticky.touchX = ~~(e.touches[0].clientX);
              $.v.sticky.hazTouch = true;
            });
            $.f.listen($.w, 'touchend', function (e) {
              $.v.sticky.hazTouch = false;
            });
            // this may be configurable later
            if ($.v.sticky.runOnLoad) {
              // pretend we've had a touch
              $.v.sticky.hazChange = true;
              $.v.sticky.pageY = $.w.pageYOffset;
              $.v.sticky.touchX = $.w.innerWidth / 2;
            }
            // start watching
            $.f.sticky.observe();
            // log that stickybuttons have been requested
            $.v.canHazStickyButtons = true;
            // add one to button count for logging purposes
            if (!$.v.canHazHoverButtons) {
              // if hoverbuttons are also on page, don't double-count
              $.v.countButton = $.v.countButton + 1;
            }
          }
        },

        // END STICKY BUTTONS

        init: function () {

          var i, t, tld = 'com', dq = false;

          $.d.b = $.d.getElementsByTagName('BODY')[0];
          $.d.h = $.d.getElementsByTagName('HEAD')[0];
          $.v = {
            'guid': '',
            'css': '',
            'config': {
              'debug': false,
              'util': 'PinUtils',
              'grid': {
                'height': 400,
                'columns': 3
              }
            },
            'userAgent': $.w.navigator.userAgent,
            'lang': 'en',
            'urls': $.a.urls,
            'here': $.d.URL.split('#')[0],
            'countButton': 0,
            'countFollow': 0,
            'countPin': 0,
            'countPinMedium': 0,
            'countPinLarge': 0,
            'countBoard': 0,
            'countSection': 0,
            'countProfile': 0,
            'log': {
              'customGlobal': 0,
              'customLocal': 0,
              'save': 0
            }
          };

          $.f.langLocLookup();

          // make a 12-digit base-60 number for conversion tracking
          for (i = 0; i < 12; i = i + 1) {
            $.v.guid = $.v.guid + '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz'.substr(Math.floor(Math.random() * 60), 1);
          }

          // got IE?
          if ($.v.userAgent.match(/MSIE/) !== null) {
            $.v.hazIE = true;
            // got very old IE?
            if ($.v.userAgent.match(/MSIE [5-8]/)) {
              dq = true;
              $.f.log('&event=oldie_error&ua=' + encodeURIComponent($.v.userAgent));
            }
          }

          // sorry, no love for Internet Explorer 8 and below
          if (!dq) {

            // find any configuration parameters that may have been added to the call on pinit.js
            $.f.config();

            // make stylesheets
            $.f.presentation($.a.styles);

            // find elements
            $.f.build();

            // add a single event listener to the body for minimal impact
            $.f.listen($.d.b, 'click', $.f.click);

            t = $.v.here.split('/');

            if (t[2]) {
              tld = t[2].split('.').pop();
            }

            // do we need to show hoverbuttons?
            if ($.v.config.hover || ($.a.override.hover.domain[tld] || $.a.override.hover.lang[$.v.lang])) {
              // if we're overriding default configuration we should check for explicit opt-out
              if ($.a.override.hover.domain[tld]) {
                $.f.debug('hover: overridden by TLD');
              }
              if ($.a.override.hover.lang[$.v.lang]) {
                $.f.debug('hover: overridden by browser language');
              }
              if ($.v.config.hover !== 'false') {
                $.f.debug('hover: allowed per config');
                $.v.canHazHoverButtons = true;
                // add one to button count for logging purposes
                $.v.countButton = $.v.countButton + 1;
                // we set this so our browser extensions know not to render hoverbuttons
                $.d.b.setAttribute('data-pin-hover', true);
                // on mouse over, check to see if this image should show a hoverbutton
                $.f.listen($.d.b, 'mouseover', $.f.over);
                // check for explicit opt-out via data-pin-sticky="false" on pinit.js
                if ($.v.config.sticky !== 'false') {
                  $.f.debug('sticky: allowed per config');
                  // only run sticky buttons if we're on a mobile device
                  if (typeof $.w.ontouchstart === 'object') {
                    $.f.debug('sticky: initing');
                    $.f.sticky.init();
                  } else {
                    $.f.debug('sticky: ontouchstart not found');
                  }
                } else {
                  $.f.debug('sticky: forbidden by config');
                }
              } else {
                $.f.debug('hover: forbidden by config');
              }
            }

            // expose utility functions
            $.f.exposeUtil();
          }
        }
      };
    }())
  };
  $.f.init();
}(window, document, navigator, {
  'k': 'PIN_' + new Date().getTime(),
  // test version
  'tv': '2019040401',
  // we'll look for scripts whose source matches this, and extract config parameters
  'me': /pinit\.js$/,
  // pinterest domain regex
  'myDomain': /^https?:\/\/(([a-z]{1,3})\.)?pinterest\.([a-z]{0,2}\.)?([a-z]{1,3})/,
  'noneParam': {
    'ignore': true,
    'none': true,
    'nothing': true
  },
  'override': {
    // entries here will have hoverbuttons on by default
    'hover': {
      // 'br': true would turn on hoverbuttons for all pages in the .br domain
      'domain': {},
      // 'ja': true would turn on hoverbuttons for all browsers requesting Japanese
      'lang': {}
    }
  },
  // valid config parameters that may be passed as data-pin-* with your call to pinit.js
  'configParam': [
    // set to "true" to show sticky Save buttons on mobile devices
    'sticky',
    // set to "false" to show static Save buttons (breaking change, 20171003)
    'save',
    // set to "true" to show hoverbuttons, "false" to force off
    'hover',
    // set to "red" or "white" to override gray Pin It button
    'color',
    // override language ("ja" only for Pin It button; any key in $.a.str for other widgets)
    'lang',
    // use custom HTML+CSS for your Pin It buttons
    'custom',
    // set to "true" to render tall Pin It buttons
    'tall',
    // set to "round" to render round red Pin It buttons -- caution: overrides all other shapes and colors
    'round',
    // set to "above" or "beside" to show pin counts in rectangular Pin It buttons
    'count',
    // set to "true" to remove descriptions from embedded pin widgets
    'zero',
    // set to "true" to render zero counts where data-pin-count="beside"
    'terse',
    // set to "true" to see debugging messages in console
    'debug',
    // the string you'd like us to add to our logging calls (32 characters max, alphanumeric + underscore only)
    'tag',
    // the global function to run when you want to re-scan the DOM or a portion of it for new widgets
    'build',
    // the global function to run when we find an error
    'error',
    // the global function to add our internal utilities, like $.f.pinOne
    'util',
    // legacy parameter for Pin It button height (please use data-pin-tall="true" instead)
    'height',
    // legacy parameter for Pin It button shape (please use data-pin-round="true" instead)
    'shape'
  ],
  'sticky': {
    // initialization values
    'pageY': 0,
    'hazChange': false,
    'hazTouch': false,
    // shall we automatically run on load?
    'runOnLoad': true,
    // wait this long between observation checks
    'obsDelay': 100,
    // vertical center line
    'scanAt': 3
  },
  // smallest image for which we will show a hoverbutton
  'hoverButtonMinImgSize': 119,
  // top and left offsets for hoverbuttons
  'hoverButtonOffsetTop': 10,
  'hoverButtonOffsetLeft': 10,
  // our data attribute namespace
  'dataAttributePrefix': 'data-pin-',
  // endpoints on Pinterest
  'endpoint': {
    'pinterest': 'https://www.pinterest.com',
    'bookmark': 'https://assets.pinterest.com/js/pinmarklet.js',
    'count': 'https://widgets.pinterest.com/v1/urls/count.json?url=%s',
    'pin': 'https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=%s',
    'board': 'https://widgets.pinterest.com/v3/pidgets/boards/%s/pins/',
    'section': 'https://widgets.pinterest.com/v3/pidgets/sections/%s/pins/',
    'user': 'https://widgets.pinterest.com/v3/pidgets/users/%s/pins/',
    'log': 'https://log.pinterest.com/'
  },
  // paths (append to $.v.config.pinterest)
  'path': {
    'repin': '/pin/%s/repin/x/',
    'report': '/about/copyright/dmca-pin/',
    'create': '/pin/create/button/?'
  },
  // pop-up window params
  'pop': {
    'base': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,%dim%,left=0,top=0',
    // swap %dim% for these
    'small': 'width=750,height=320',
    'large': 'width=1040,height=640'
  },
  // attributes we're allowed to change when building widgets from templates
  'build': {
    'setStyle': {
      'backgroundImage': true,
      'backgroundColor': true,
      'height': true,
      'width': true,
      'paddingBottom': true
    },
    'setData': {
      'href': true,
      'id': true,
      'log': true,
      'x': true
    }
  },
  util: {
    // on click, if data-pin-log is this, run $.f.util[that]
    'embed_pin_toggle': 'menu',
    'embed_pin_play': 'play',
    'embed_pin_native': 'native',
    'button_pinit': 'pinOne',
    'button_pinit_floating': 'pinOne',
    'button_pinit_sticky': 'pinOne',
    'button_pinit_bookmarklet': 'pinAny',
    'button_follow': 'follow',
    'embed_board_ft': 'follow',
    'embed_user_ft': 'follow',
    'embed_section_ft': 'follow',
    'repin': 'repin',
    'button_pinit_repin': 'repin',
    'button_pinit_floating_repin': 'repinHoverButton',
    'button_pinit_sticky_repin': 'repinHoverButton',
    'embed_pin_repin': 'repin',
    'embed_pin_repin_small': 'repin',
    'embed_pin_repin_medium': 'repin',
    'embed_pin_repin_large': 'repin'
  },
  'save': {
    'domain': {
      'www': true,
      'uk': true,
      'br': true,
      'ja': 'jp',
      'jp': true,
      'ko': 'kr',
      'kr': true,
      'fr': true,
      'es': true,
      'pl': true,
      'de': true,
      'ru': true,
      'it': true,
      'au': true,
      'nl': true,
      'tr': true,
      'id': true,
      'hu': true,
      'pt': true,
      'se': true,
      'cz': true,
      'gr': true,
      'ro': true,
      'dk': true,
      'sk': true,
      'fi': true,
      'in': true,
      'no': true,
      'za': true,
      'nz': true
    },
    'lookup': {
      // alt location: cs
      'cs': {
        'd': 'cz'
      },
      // alt location: dk
      'da': {
        'd': 'dk'
      },
      // default de / de-de; alt de-at
      'de': {
        'alt': {
          // Austria
          'at': 'de'
        }
      },
      // alt locale: gr; Greece also gets requests for el-cy
      'el': {
        'd': 'gr',
        'alt': {
          // Cyprus
          'cy': 'gr'
        }
      },
      // English has many alt domains
      'en': {
        'alt': {
          // Australia
          'au': 'au',
          // Great Britain
          'gb': 'uk',
          // Ireland
          'ie': 'uk',
          // India
          'in': 'in',
          // New Zealand
          'nz': 'nz',
          // United Kingdom
          'uk': 'uk',
          // South Africa
          'za': 'za'
        }
      },
      // Spanish also has many alt domains
      'es': {
        'alt': {
          // Latin America
          '419': 'www',
          // Argentina
          'ar': 'www',
          // Chile
          'cl': 'www',
          // Columbia
          'co': 'www',
          // Latin America
          'la': 'www',
          // Mexico
          'mx': 'www',
          // Peru
          'pe': 'www',
          // USA
          'us': 'www',
          // Uruguay
          'uy': 'www',
          // Venezuela
          've': 'www',
          // Latin America
          'xl': 'www'
        }
      },
      // Finnish: fi and fi-fi work; all others go to lang-domain
      'fi': true,
      // French: auto-default to France, but do the right things for Belgium and Canada
      'fr': {
        'alt': {
          'be': 'fr',
          'ca': 'www'
        }
      },
      // Hindu: redirect to India (so does en-in)
      'hi': {
        'd': 'in'
      },
      'hu': true,
      'id': true,
      'it': true,
      'ja': {
        'd': 'jp'
      },
      'ko': {
        'd': 'kr'
      },
      // Malaysian: send to WWW
      'ms': {
        'd': 'www'
      },
      'nl': {
        'alt': {
          'be': 'nl'
        }
      },
      'nb': {
        'd': 'no'
      },
      'pl': true,
      'pt': {
        'alt': {
          // Brazil
          'br': {
            'd': 'br',
            's': 'pt-br'
          }
        }
      },
      'ro': true,
      'ru': true,
      'sk': true,
      'sv': {
        'd': 'se'
      },
      'tl': {
        'd': 'www'
      },
      'th': {
        'd': 'www'
      },
      'tr': {
        'alt': {
          // Cyprus
          'cy': 'tr'
        }
      },
      'uk': true,
      'vi': true
    }
  },
  // translated strings - replace %s with the Pinterest logotype
  'strings': {
    // Czech
    'cs': {
      'followOn': 'Sledujte na %s',
      'from': 'od %s',
      'report': 'Probl&#233;m s autorsk&#253;mi pr&#225;vy',
      'by': 'od %s',
      'save': 'Ulo&#382;it'
    },
    // Danish
    'da': {
      'followOn': 'F&#248;lg p&#229; %s',
      'from': 'fra %s',
      'report': 'Problemer med ophavsret',
      'by': 'af %s',
      'save': 'Gem'
    },
    // German
    'de': {
      'followOn': ' %s',
      'from': 'von %s',
      'report': 'Urheberrechtsverletzung',
      'by': 'von %s',
      'save': 'Merken'
    },
    // Greek
    'el': {
      'followOn': '&#913;&#954;&#959;&#955;&#959;&#965;&#952;&#942;&#963;&#964;&#949; &#956;&#945;&#962; &#963;&#964;&#959; %s',
      'from': '&#945;&#960;&#972; &#964;&#959; %s',
      'report': '&#918;&#942;&#964;&#951;&#956;&#945; &#960;&#957;&#949;&#965;&#956;&#945;&#964;&#953;&#954;&#974;&#957; &#948;&#953;&#954;&#945;&#953;&#969;&#956;&#940;&#964;&#969;&#957;',
      'by': '&alpha;&pi;&omicron;&delta;&#943;&delta;&epsilon;&tau;&alpha;&iota; &sigma;&tau;&omicron; %s',
      'save': '&Kappa;&rho;&#940;&tau;&alpha; &tau;&omicron;'
    },
    // English
    'en': {
      'followOn': 'Follow On %s',
      'from': 'from %s',
      'report': 'Copyright issue',
      'by': 'by %s',
      'save': 'Save'
    },
    // Spanish
    'es': {
      'followOn': 'Seguir en %s',
      'from': 'de %s',
      'report': 'Problema de copyright',
      'by': 'por %s',
      'save': 'Guardar'
    },
    // Finnish
    'fi': {
      'followOn': 'Seuraa %s',
      'from': 'palvelusta %s',
      'report': 'Tekij&#228;noikeusloukkaus',
      'by': 'tekij&#228; %s',
      'save': 'Tallenna'
    },
    // French
    'fr': {
      'followOn': 'Suivre sur %s',
      'from': '&#224; partir de %s',
      'report': 'Probl&#232;me de droits d\'auteur',
      'by': 'par %s',
      'save': 'Enregistrer'
    },
    // Hindu
    'hi': {
      'followOn': '%s &#2346;&#2375; &#2347;&#2377;&#2354;&#2379; &#2325;&#2352;&#2375;&#2306;',
      'from': '%s &#2360;&#2375;',
      'report': '&#2325;&#2377;&#2346;&#2368;&#2352;&#2366;&#2311;&#2335; &#2325;&#2366; &#2350;&#2369;&#2342;&#2381;&#2342;&#2366;',
      'by': '&#2325;&#2379; &#2358;&#2381;&#2352;&#2375;&#2351; &#2342;&#2375;&#2344;&#2366; %s',
      'save': '&#2360;&#2375;&#2357; &#2325;&#2352;&#2375;&#2306;'
    },
    // Hungarian
    'hu': {
      'followOn': 'K&#246;vesd a %s',
      'from': 'innen: %s',
      'report': 'Szerz&#337;i jogi probl&#233;ma',
      'by': 'Hozz&aacute;rendelve a k&ouml;vetkez&#337;h&ouml;z: %s',
      'save': 'Ment&eacute;s'
    },
    // Indonesian
    'id': {
      'followOn': 'Ikuti di Pinterest %s',
      'from': 'dari %s',
      'report': 'Masalah hak cipta',
      'by': 'oleh %s',
      'save': 'Simpan'
    },
    // Italian
    'it': {
      'followOn': 'Segui su %s',
      'from': 'da %s',
      'report': 'Problema di copyright',
      'by': 'da %s',
      'save': 'Salva'
    },
    // Japanese
    'ja': {
      'followOn': '%s &#12391;&#12501;&#12457;&#12525;&#12540;',
      'from': '&#12500;&#12531;&#12418;&#12392;&#65306; %s',
      'report': '&#33879;&#20316;&#27177;&#12395;&#12388;&#12356;&#12390;&#22577;&#21578;&#12377;&#12427;',
      'by': '%s',
      'save': '&#20445;&#23384;'
    },
    // Korean
    'ko': {
      'followOn': '%s &#50640;&#49436; &#54036;&#47196;&#50864;',
      'from': '%s &#50640;&#49436;',
      'report': '&#51200;&#51089;&#44428; &#47928;&#51228;',
      'by': '&#51060; &#54592;&#54632; %s',
      'save': '&#51200;&#51109;'
    },
    // Malaysian
    'ms': {
      'followOn': 'Ikut di %s',
      'from': 'dari %s',
      'report': 'Isu hak cipta',
      'by': 'attribut ke %s',
      'save': 'Simpan'
    },
    // Norwegian
    'nb': {
      'followOn': 'F&#248;lg p&#229; %s',
      'from': 'fra %s',
      'report': 'Opphavsrettslig problem',
      'by': 'av %s',
      'save': 'Lagre'
    },
    // Dutch
    'nl': {
      'followOn': 'Volgen op %s',
      'from': 'van %s',
      'report': 'Probleem met copyright',
      'by': 'door %s',
      'save': 'Bewaren'
    },
    // Polish
    'pl': {
      'followOn': 'Obserwuj na %s',
      'from': 'od %s',
      'report': 'Problem z prawami autorskimi',
      'by': 'przez',
      'save': 'Zapisz'
    },
    // Portuguese
    'pt': {
      'followOn': 'Seguir no %s',
      'from': 'de %s',
      'report': 'Assunto relativo a direitos de autor',
      'by': 'por %s',
      'save': 'Guardar'
    },
    // Portuguese (Brazil)
    'pt-br': {
      'followOn': 'Siga no %s',
      'from': 'de %s',
      'report': 'Problema de direitos autorais',
      'by': 'por %s',
      'save': 'Salvar'
    },
    // Romanian
    'ro': {
      'followOn': 'Urm&#259;re&#537;te pe %s',
      'from': 'de la %s',
      'report': 'Problem&#259; legat&#259; de drepturile de autor',
      'by': 'de la %s',
      'save': 'Salveaz&#259;'
    },
    // Russian
    'ru': {
      'followOn': '&#1055;&#1086;&#1076;&#1087;&#1080;&#1089;&#1072;&#1090;&#1100;&#1089;&#1103; &#1074; %s',
      'from': '&#1080;&#1079; %s',
      'report': '&#1042;&#1086;&#1087;&#1088;&#1086;&#1089; &#1086;&#1073; &#1072;&#1074;&#1090;&#1086;&#1088;&#1089;&#1082;&#1080;&#1093; &#1087;&#1088;&#1072;&#1074;&#1072;&#1093;',
      'by': '&#1087;&#1086;&#1083;&#1100;&#1079;&#1086;&#1074;&#1072;&#1090;&#1077;&#1083;&#1077;&#1084; %s',
      'save': '&#1057;&#1086;&#1093;&#1088;&#1072;&#1085;&#1080;&#1090;&#1100;'
    },
    // Slovak
    'sk': {
      'followOn': 'Sledujte na %s',
      'from': 'od %s',
      'report': 'Probl&#233;m s autorsk&#253;mi pr&#225;vami',
      'by': 'od %s',
      'save': 'Ulo&#382;i&#357;'
    },
    // Swedish
    'sv': {
      'followOn': 'F&#246;lj p&#229; %s',
      'from': 'fr&#229;n %s',
      'report': 'Upphovsr&#228;ttsligt problem',
      'by': 'av %s',
      'save': 'Spara'
    },
    // Tagalog
    'tl': {
      'followOn': 'Sundan sa %s',
      'from': 'galing sa %s',
      'report': 'Isyu sa copyright',
      'by': '%s',
      'save': 'I-save'
    },
    // Thai
    'th': {
      'followOn': '&#3605;&#3636;&#3604;&#3605;&#3634;&#3617;&#3651;&#3609; %s',
      'from': '&#3592;&#3634;&#3585; %s',
      'report': '&#3611;&#3633;&#3597;&#3627;&#3634;&#3648;&#3619;&#3639;&#3656;&#3629;&#3591;&#3621;&#3636;&#3586;&#3626;&#3636;&#3607;&#3608;&#3636;&#3660;',
      'by': '&#3648;&#3586;&#3637;&#3618;&#3609;&#3650;&#3604;&#3618; %s',
      'save': '&#3610;&#3633;&#3609;&#3607;&#3638;&#3585;'
    },
    // Turkish
    'tr': {
      'followOn': '%s takip et',
      'from': '%s sitesinden',
      'report': 'Telif hakk&#305; sorunu',
      'by': 'taraf&#305;ndan %s',
      'save': 'Kaydet'
    },
    // Ukrainian
    'uk': {
      'followOn': '&#1055;&#1086;&#1076;&#1087;&#1080;&#1089;&#1072;&#1090;&#1100;&#1089;&#1103; &#1074; %s',
      'from': '&#1074;&#1110;&#1076; %s',
      'report': '&#1055;&#1088;&#1086;&#1073;&#1083;&#1077;&#1084;&#1072; &#1079;&#1072;&#1093;&#1080;&#1089;&#1090;&#1091; &#1072;&#1074;&#1090;&#1086;&#1088;&#1089;&#1100;&#1082;&#1080;&#1093; &#1087;&#1088;&#1072;&#1074;',
      'by': '&#1086;&#1087;&#1080;&#1089; %s',
      'save': '&#1047;&#1073;&#1077;&#1088;&#1077;&#1075;&#1090;&#1080;'
    },
    // Vietnamese
    'vi': {
      'followOn': 'Theo d&#245;i tr&#234;n %s',
      'from': 't&#7915; %s',
      'report': 'V&#7845;n &#273;&#7873; v&#7873; b&#7843;n quy&#7873;n',
      'by': '&#273;&#432;a v&agrave;o %s',
      'save': 'L&#432;u'
    }
  },
  // paths, sizes, and colors for SVGs
  'svg': {
    // native video player
    'native': {
      'w': '63',
      'h': '63',
      'x1': '0',
      'y1': '0',
      'x2': '64',
      'y2': '64',
      'p': [ {
        'f': '000',
        'd': 'M 32 32 m -32, 0 a 31, 31 0 1, 0 63, 0 a 31, 31 0 1,0 -63, 0 z'
      }, {
        'f': 'fff',
        'd': 'M 25 19 L 48 32  L 25 45 Z'
      }]
    },
    // pin count bubble; shows above
    'above': {
      'w': '114',
      'h': '76',
      'p': [ {
        's': 'b5b5b5',
        'f': 'fff',
        'd': 'M9 1C4.6 1 1 4.6 1 9v43c0 4.3 3.6 8 8 8h26l18 15h7.5l16-15H105c4.4 0 8-3.7 8-8V9c0-4.4-3.6-8-8-8H9z'
      } ]
    },
    // pin count bubble; shows to the right
    'beside': {
      'w': '126',
      'h': '56',
      // side bubble needs a bit of space inside to successfully show the outline all the way around
      'x1': '2',
      'y1': '0',
      'x2': '130',
      'y2': '60',
      'p': [ {
        's': 'b5b5b5',
        'f': 'fff',
        'd': 'M119.6 2c4.5 0 8 3.6 8 8v40c0 4.4-3.5 8-8 8H23.3L1.6 32.4v-4.6L23.3 2h96.3z'
      } ]
    },
    // round Pinterest logo for round Pin It buttons and Follow buttons
    'logo': {
      'w': '30',
      'h': '30',
      'x1': '-1',
      'y1': '-1',
      'x2': '31',
      'y2': '31',
      // logo has two shapes: white background and red foreground
      'p': [ {
        'f': 'fff',
        's': 'fff',
        'w': '1',
        'd': 'M29.449,14.662 C29.449,22.722 22.868,29.256 14.75,29.256 C6.632,29.256 0.051,22.722 0.051,14.662 C0.051,6.601 6.632,0.067 14.75,0.067 C22.868,0.067 29.449,6.601 29.449,14.662'
      }, {
        'f': 'e60023',
        'd': 'M14.733,1.686 C7.516,1.686 1.665,7.495 1.665,14.662 C1.665,20.159 5.109,24.854 9.97,26.744 C9.856,25.718 9.753,24.143 10.016,23.022 C10.253,22.01 11.548,16.572 11.548,16.572 C11.548,16.572 11.157,15.795 11.157,14.646 C11.157,12.842 12.211,11.495 13.522,11.495 C14.637,11.495 15.175,12.326 15.175,13.323 C15.175,14.436 14.462,16.1 14.093,17.643 C13.785,18.935 14.745,19.988 16.028,19.988 C18.351,19.988 20.136,17.556 20.136,14.046 C20.136,10.939 17.888,8.767 14.678,8.767 C10.959,8.767 8.777,11.536 8.777,14.398 C8.777,15.513 9.21,16.709 9.749,17.359 C9.856,17.488 9.872,17.6 9.84,17.731 C9.741,18.141 9.52,19.023 9.477,19.203 C9.42,19.44 9.288,19.491 9.04,19.376 C7.408,18.622 6.387,16.252 6.387,14.349 C6.387,10.256 9.383,6.497 15.022,6.497 C19.555,6.497 23.078,9.705 23.078,13.991 C23.078,18.463 20.239,22.062 16.297,22.062 C14.973,22.062 13.728,21.379 13.302,20.572 C13.302,20.572 12.647,23.05 12.488,23.657 C12.193,24.784 11.396,26.196 10.863,27.058 C12.086,27.434 13.386,27.637 14.733,27.637 C21.95,27.637 27.801,21.828 27.801,14.662 C27.801,7.495 21.95,1.686 14.733,1.686'
      } ]
    },
    // full Pinterest logotype for grid footer buttons
    'lockup': {
      'w': '50',
      'h': '12',
      'x1': '0',
      'y1': '0',
      'x2': '50',
      'y2': '12',
      'p': [ {
        'f': 'e60023',
        'd': 'M19.69,9.28 L19.69,4.28 L21.27,4.28 L21.27,9.28 L19.69,9.28 Z M5.97,0.00 C9.27,0.00 11.95,2.69 11.95,6.00 C11.95,9.31 9.27,12.00 5.97,12.00 C5.38,12.00 4.80,11.91 4.26,11.75 C4.26,11.75 4.26,11.75 4.26,11.75 C4.25,11.75 4.24,11.74 4.23,11.74 L4.21,11.73 C4.21,11.73 4.21,11.73 4.21,11.73 C4.45,11.33 4.81,10.68 4.95,10.16 C5.02,9.88 5.32,8.73 5.32,8.73 C5.52,9.11 6.08,9.42 6.69,9.42 C8.49,9.42 9.79,7.76 9.79,5.69 C9.79,3.71 8.18,2.23 6.11,2.23 C3.53,2.23 2.16,3.96 2.16,5.86 C2.16,6.74 2.63,7.83 3.37,8.18 C3.49,8.23 3.55,8.21 3.57,8.10 C3.59,8.02 3.69,7.61 3.74,7.42 C3.75,7.36 3.75,7.31 3.70,7.25 C3.45,6.95 3.25,6.39 3.25,5.88 C3.25,4.55 4.25,3.27 5.95,3.27 C7.42,3.27 8.45,4.28 8.45,5.71 C8.45,7.34 7.63,8.46 6.57,8.46 C5.98,8.46 5.54,7.98 5.68,7.38 C5.85,6.67 6.18,5.90 6.18,5.38 C6.18,4.92 5.93,4.54 5.42,4.54 C4.82,4.54 4.34,5.16 4.34,5.99 C4.34,6.52 4.52,6.88 4.52,6.88 C4.52,6.88 3.93,9.40 3.82,9.87 C3.70,10.38 3.75,11.11 3.80,11.59 L3.80,11.59 C3.79,11.59 3.78,11.58 3.78,11.58 C3.77,11.58 3.76,11.58 3.76,11.57 C3.76,11.57 3.76,11.57 3.76,11.57 C1.56,10.69 0.00,8.53 0.00,6.00 C0.00,2.69 2.67,0.00 5.97,0.00 Z M16.87,2.31 C17.71,2.31 18.34,2.54 18.76,2.95 C19.21,3.37 19.46,3.96 19.46,4.66 C19.46,6.00 18.54,6.95 17.11,6.95 L15.72,6.95 L15.72,9.28 L14.12,9.28 L14.12,2.31 L16.87,2.31 Z M16.94,5.58 C17.56,5.58 17.91,5.21 17.91,4.65 C17.91,4.10 17.55,3.76 16.94,3.76 L15.72,3.76 L15.72,5.58 L16.94,5.58 Z M50.00,5.28 L49.19,5.28 L49.19,7.62 C49.19,8.01 49.40,8.11 49.74,8.11 C49.83,8.11 49.93,8.10 50.00,8.10 L50.00,9.28 C49.84,9.31 49.58,9.33 49.22,9.33 C48.30,9.33 47.64,9.03 47.64,7.96 L47.64,5.28 L47.16,5.28 L47.16,4.28 L47.64,4.28 L47.64,2.70 L49.19,2.70 L49.19,4.28 L50.00,4.28 L50.00,5.28 Z M45.31,6.13 C46.18,6.27 47.21,6.50 47.21,7.77 C47.21,8.87 46.25,9.43 44.95,9.43 C43.55,9.43 42.65,8.81 42.54,7.78 L44.05,7.78 C44.15,8.20 44.46,8.40 44.94,8.40 C45.42,8.40 45.72,8.22 45.72,7.90 C45.72,7.45 45.12,7.40 44.46,7.29 C43.59,7.14 42.67,6.91 42.67,5.74 C42.67,4.68 43.64,4.14 44.82,4.14 C46.22,4.14 46.98,4.75 47.06,5.74 L45.60,5.74 C45.54,5.29 45.24,5.15 44.80,5.15 C44.42,5.15 44.12,5.30 44.12,5.61 C44.12,5.96 44.68,6.01 45.31,6.13 Z M20.48,2.00 C21.00,2.00 21.43,2.42 21.43,2.95 C21.43,3.48 21.00,3.90 20.48,3.90 C19.95,3.90 19.53,3.48 19.53,2.95 C19.53,2.42 19.95,2.00 20.48,2.00 Z M28.48,7.62 C28.48,8.01 28.70,8.11 29.04,8.11 C29.10,8.11 29.18,8.10 29.24,8.10 L29.24,9.29 C29.08,9.31 28.83,9.33 28.52,9.33 C27.60,9.33 26.94,9.03 26.94,7.96 L26.94,5.28 L26.42,5.28 L26.42,4.28 L26.94,4.28 L26.94,2.70 L28.48,2.70 L28.48,4.28 L29.24,4.28 L29.24,5.28 L28.48,5.28 L28.48,7.62 Z M24.69,4.14 C25.77,4.14 26.41,4.92 26.41,6.03 L26.41,9.28 L24.83,9.28 L24.83,6.35 C24.83,5.82 24.57,5.46 24.05,5.46 C23.53,5.46 23.18,5.90 23.18,6.52 L23.18,9.28 L21.60,9.28 L21.60,4.28 L23.12,4.28 L23.12,4.97 L23.15,4.97 C23.52,4.43 24.00,4.14 24.69,4.14 Z M33.42,4.76 C32.99,4.37 32.43,4.14 31.72,4.14 C30.20,4.14 29.16,5.28 29.16,6.77 C29.16,8.28 30.17,9.42 31.81,9.42 C32.44,9.42 32.95,9.26 33.37,8.96 C33.80,8.66 34.10,8.23 34.20,7.78 L32.66,7.78 C32.52,8.10 32.25,8.28 31.83,8.28 C31.18,8.28 30.81,7.86 30.72,7.19 L34.29,7.19 C34.30,6.18 34.01,5.31 33.42,4.76 L33.42,4.76 Z M41.66,4.76 C42.26,5.31 42.55,6.18 42.54,7.19 L38.97,7.19 C39.06,7.86 39.43,8.28 40.08,8.28 C40.50,8.28 40.77,8.10 40.91,7.78 L42.45,7.78 C42.34,8.23 42.05,8.66 41.62,8.96 C41.20,9.26 40.69,9.42 40.06,9.42 C38.42,9.42 37.41,8.28 37.41,6.77 C37.41,5.28 38.45,4.14 39.97,4.14 C40.67,4.14 41.24,4.37 41.66,4.76 Z M30.73,6.24 C30.83,5.65 31.14,5.27 31.75,5.27 C32.26,5.27 32.63,5.65 32.69,6.24 L30.73,6.24 Z M38.98,6.24 L40.94,6.24 C40.88,5.65 40.51,5.27 40.00,5.27 C39.39,5.27 39.08,5.65 38.98,6.24 Z M37.54,4.21 L37.54,5.60 C36.64,5.51 36.07,5.99 36.07,7.03 L36.07,9.28 L34.48,9.28 L34.48,4.28 L36.00,4.28 L36.00,5.06 L36.03,5.06 C36.38,4.47 36.78,4.21 37.39,4.21 C37.45,4.21 37.50,4.21 37.54,4.21 Z'
      } ]
    },
    // three-dot menu opener for embedded pin widgets
    'menu': {
      'w': '20',
      'h': '5',
      'p': [ {
        'f': 'b5b5b5',
        'd': 'M17.5,5 C18.881,5 20,3.881 20,2.5 C20,1.119 18.881,0 17.5,0 C16.119,0 15,1.119 15,2.5 C15,3.881 16.119,5 17.5,5 Z M10,5 C11.38,5 12.5,3.881 12.5,2.5 C12.5,1.119 11.38,0 10,0 C8.62,0 7.5,1.119 7.5,2.5 C7.5,3.881 8.62,5 10,5 M2.5,5 C3.881,5 5,3.881 5,2.5 C5,1.119 3.881,0 2.5,0 C1.12,0 0,1.119 0,2.5 C0,3.881 1.12 5,2.5,5 Z'
      } ]
    },
    // dual-pin repin count icon for embedded pin widgets
    'repins': {
      'h': '14',
      'w': '14',
      'p': [ {
        'f': 'b5b5b5',
        'd': 'M11.979,6.859 L13.99,5.011 L11.241,5.011 L10.486,0 L9.739,5.011 L7,5.011 L8.986,6.858 L8.986,11.017 C8.505,10.985 8.143,11.012 8.143,11.213 C8.143,11.687 8.503,12.001 8.986,12.001 L11.982,12 C12.465,12 12.888,11.686 12.888,11.213 C12.888,11.011 12.465,10.985 11.982,11.017 L11.979,6.859 Z M4.979,7.142 L6.99,8.99 L4.241,8.99 L3.486,14.001 L2.739,8.99 L0,8.99 L1.986,7.143 L1.986,2.984 C1.505,3.016 1.143,2.989 1.143,2.788 C1.143,2.315 1.503,2 1.986,2 L4.982,2.001 C5.465,2.001 5.888,2.315 5.888,2.789 C5.888,2.99 5.465,3.017 4.982,2.984 L4.979,7.142 Z'
      } ]
    },
    // done count icon for embedded pin widgets
    'done': {
      'h': '12',
      'w': '12',
      'p': [ {
        'f': 'b5b5b5',
        'd': 'M0,6 L2,4 L5,7 L10,1 L12,3 L5,11 Z'
      } ]
    },
    // Pin It logotype, English
    'pinit_en': {
      'w': '42',
      'h': '18',
      'p': [ {
        'f': 'e60023',
        'd': 'M16.853,6.345 C17.632,6.345 18.38,5.702 18.51,4.909 C18.664,4.138 18.135,3.494 17.357,3.494 C16.578,3.494 15.83,4.138 15.698,4.909 C15.546,5.702 16.053,6.345 16.853,6.345 Z M7.458,0 C2.5,0 0,3.522 0,6.459 C0,8.237 0.68,9.819 2.137,10.409 C2.376,10.505 2.59,10.412 2.66,10.15 C2.708,9.969 2.822,9.511 2.873,9.32 C2.943,9.061 2.916,8.97 2.723,8.744 C2.302,8.253 2.034,7.617 2.034,6.716 C2.034,4.104 4.007,1.765 7.172,1.765 C9.975,1.765 11.514,3.461 11.514,5.726 C11.514,8.708 10.183,11.18 8.206,11.18 C7.114,11.18 6.297,10.329 6.559,9.233 C6.872,7.922 7.48,6.509 7.48,5.564 C7.48,4.717 7.022,4.011 6.072,4.011 C4.956,4.011 4.06,5.155 4.06,6.687 C4.06,7.663 4.393,8.323 4.393,8.323 C4.393,8.323 3.251,13.117 3.051,13.957 C2.652,15.629 2.991,17.679 3.019,17.886 C3.036,18.009 3.195,18.038 3.267,17.946 C3.37,17.812 4.7,16.187 5.151,14.562 C5.279,14.102 5.885,11.72 5.885,11.72 C6.248,12.406 7.308,13.009 8.435,13.009 C11.79,13.009 14.066,9.979 14.066,5.923 C14.066,2.857 11.444,0 7.458,0 Z M26.896,14.189 C26.348,14.189 26.117,13.915 26.117,13.328 C26.117,12.404 27.035,10.091 27.035,9.041 C27.035,7.638 26.276,6.826 24.72,6.826 C23.739,6.826 22.722,7.453 22.291,8.003 C22.291,8.003 22.422,7.553 22.467,7.38 C22.515,7.196 22.415,6.884 22.173,6.884 L20.651,6.884 C20.328,6.884 20.238,7.055 20.191,7.244 C20.172,7.32 19.624,9.584 19.098,11.632 C18.738,13.034 17.863,14.205 16.928,14.205 C16.447,14.205 16.233,13.906 16.233,13.399 C16.233,12.959 16.519,11.877 16.86,10.534 C17.276,8.898 17.642,7.551 17.681,7.394 C17.732,7.192 17.642,7.017 17.379,7.017 L15.849,7.017 C15.572,7.017 15.473,7.161 15.414,7.361 C15.414,7.361 14.983,8.977 14.527,10.775 C14.196,12.079 13.83,13.409 13.83,14.034 C13.83,15.148 14.336,15.944 15.724,15.944 C16.796,15.944 17.644,15.45 18.292,14.764 C18.197,15.135 18.136,15.414 18.13,15.439 C18.074,15.65 18.142,15.838 18.394,15.838 L19.961,15.838 C20.233,15.838 20.337,15.73 20.394,15.494 C20.449,15.269 21.619,10.667 21.619,10.667 C21.928,9.443 22.692,8.632 23.768,8.632 C24.279,8.632 24.72,8.967 24.669,9.618 C24.612,10.333 23.741,12.903 23.741,14.031 C23.741,14.884 24.06,15.945 25.683,15.945 C26.789,15.945 27.603,15.464 28.195,14.786 L27.489,13.941 C27.311,14.094 27.114,14.189 26.896,14.189 Z M41.701,6.873 L40.134,6.873 C40.134,6.873 40.856,4.109 40.873,4.035 C40.942,3.745 40.698,3.578 40.441,3.631 C40.441,3.631 39.23,3.866 39.005,3.913 C38.779,3.958 38.604,4.081 38.522,4.403 C38.512,4.445 37.88,6.873 37.88,6.873 L36.622,6.873 C36.385,6.873 36.245,6.968 36.192,7.188 C36.115,7.504 35.975,8.145 35.936,8.297 C35.885,8.494 36,8.644 36.222,8.644 L37.457,8.644 C37.448,8.677 37.064,10.125 36.725,11.521 L36.724,11.516 C36.72,11.532 36.716,11.546 36.712,11.562 L36.712,11.556 C36.712,11.556 36.708,11.571 36.702,11.598 C36.324,12.968 35.118,14.209 34.201,14.209 C33.721,14.209 33.506,13.909 33.506,13.402 C33.506,12.963 33.792,11.88 34.134,10.537 C34.549,8.901 34.915,7.555 34.955,7.397 C35.006,7.196 34.915,7.02 34.652,7.02 L33.122,7.02 C32.845,7.02 32.746,7.164 32.687,7.364 C32.687,7.364 32.257,8.98 31.8,10.778 C31.469,12.083 31.103,13.412 31.103,14.037 C31.103,15.151 31.609,15.948 32.997,15.948 C34.07,15.948 35.136,15.453 35.783,14.767 C35.783,14.767 36.011,14.521 36.23,14.229 C36.241,14.581 36.324,14.837 36.411,15.018 C36.458,15.119 36.515,15.215 36.581,15.303 C36.582,15.304 36.583,15.306 36.585,15.308 L36.585,15.308 C36.891,15.713 37.398,15.962 38.151,15.962 C39.894,15.962 40.944,14.938 41.562,13.909 L40.704,13.239 C40.333,13.774 39.839,14.175 39.324,14.175 C38.846,14.175 38.579,13.878 38.579,13.372 C38.579,12.935 38.889,11.868 39.229,10.53 C39.344,10.083 39.516,9.401 39.708,8.644 L41.302,8.644 C41.539,8.644 41.678,8.549 41.732,8.329 C41.808,8.012 41.948,7.372 41.988,7.221 C42.039,7.023 41.923,6.873 41.701,6.873 Z M34.126,6.348 C34.905,6.348 35.653,5.706 35.783,4.912 C35.937,4.141 35.409,3.498 34.63,3.498 C33.851,3.498 33.103,4.141 32.971,4.912 C32.819,5.706 33.326,6.348 34.126,6.348 Z'
      } ]
    },
    // Pin It logotype, Japanese
    'pinit_ja': {
      'w': '41',
      'h': '18',
      'p': [ {
        'f': 'e60023',
        'd': 'M19.822,7.173 C19.822,6.51 19.835,6.276 19.887,5.964 L18.145,5.964 C18.197,6.289 18.197,6.497 18.197,7.16 L18.21,13.192 C18.21,13.946 18.223,14.167 18.249,14.388 C18.327,15.025 18.522,15.441 18.886,15.714 C19.393,16.104 20.29,16.273 21.928,16.273 C22.721,16.273 24.359,16.195 25.126,16.117 C26.504,15.987 26.569,15.974 26.842,15.974 L26.764,14.245 C26.192,14.414 25.906,14.479 25.282,14.557 C24.333,14.687 23.137,14.765 22.266,14.765 C21.005,14.765 20.264,14.648 20.043,14.427 C19.861,14.245 19.809,13.959 19.809,13.231 C19.809,13.179 19.809,13.101 19.822,13.023 L19.822,11.307 C21.993,10.904 24.008,10.228 25.932,9.24 L26.27,9.071 C26.374,9.019 26.4,9.006 26.543,8.954 L25.503,7.485 C24.658,8.278 21.785,9.435 19.822,9.799 L19.822,7.173 Z M27.31,4.872 C26.491,4.872 25.815,5.548 25.815,6.367 C25.815,7.199 26.491,7.875 27.31,7.875 C28.142,7.875 28.818,7.199 28.818,6.367 C28.818,5.548 28.142,4.872 27.31,4.872 L27.31,4.872 Z M27.31,5.522 C27.791,5.522 28.168,5.899 28.168,6.367 C28.168,6.835 27.791,7.225 27.31,7.225 C26.842,7.225 26.465,6.835 26.465,6.367 C26.465,5.899 26.842,5.522 27.31,5.522 L27.31,5.522 Z M30.586,7.654 C31.795,8.33 32.861,9.188 33.901,10.293 L35.019,8.876 C34.018,7.927 33.212,7.329 31.665,6.367 L30.586,7.654 Z M31.041,16.234 C31.34,16.13 31.379,16.117 31.899,16.013 C33.914,15.584 35.526,14.947 36.852,14.063 C38.633,12.88 39.868,11.346 40.973,8.967 C40.31,8.499 40.102,8.304 39.595,7.693 C39.205,8.746 38.841,9.461 38.269,10.293 C37.242,11.775 36.033,12.776 34.408,13.478 C33.225,13.998 31.678,14.375 30.56,14.44 L31.041,16.234 Z M7.458,0 C2.5,0 0,3.522 0,6.459 C0,8.237 0.68,9.819 2.137,10.409 C2.376,10.505 2.59,10.412 2.66,10.15 C2.708,9.969 2.822,9.511 2.873,9.32 C2.943,9.061 2.916,8.97 2.723,8.744 C2.302,8.253 2.034,7.617 2.034,6.716 C2.034,4.104 4.007,1.765 7.172,1.765 C9.975,1.765 11.514,3.461 11.514,5.726 C11.514,8.708 10.183,11.18 8.206,11.18 C7.114,11.18 6.297,10.329 6.559,9.233 C6.872,7.922 7.48,6.509 7.48,5.564 C7.48,4.717 7.022,4.011 6.072,4.011 C4.956,4.011 4.06,5.155 4.06,6.687 C4.06,7.663 4.393,8.323 4.393,8.323 C4.393,8.323 3.251,13.117 3.051,13.957 C2.652,15.629 2.991,17.679 3.019,17.886 C3.036,18.009 3.195,18.038 3.267,17.946 C3.37,17.812 4.7,16.187 5.151,14.562 C5.279,14.102 5.885,11.72 5.885,11.72 C6.248,12.406 7.308,13.009 8.435,13.009 C11.79,13.009 14.066,9.979 14.066,5.923 C14.066,2.857 11.444,0 7.458,0 Z'
      } ]
    }
  },
  // a Sass-like object that compiles into an inline stylesheet
  'styles': {
    'span._embed_grid': {
      'width': '100%',
      'max-width': 237 + 20 + 'px',
      'min-width': 60 * 2 + 20 + 'px',
      'display': 'inline-block',
      'box-shadow': 'inset 0 0 1px #000',
      'border-radius': '%widgetBorderRadius%',
      'overflow': 'hidden',
      'font': '12px "Helvetica Neue", Helvetica, arial, sans-serif',
      'color': 'rgb(54, 54, 54)',
      'box-sizing': 'border-box',
      'background': '#fff',
      'cursor': 'pointer',
      '%prefix%font-smoothing': 'antialiased',
      '*': {
        'display': 'block',
        'position': 'relative',
        'font': 'inherit',
        'cursor': 'inherit',
        'color': 'inherit',
        'box-sizing': 'inherit',
        'margin': '0',
        'padding': '0',
        'text-align': 'left'
      },
      '._hd': {
        'height': '55px',
        '._img': {
          'position': 'absolute',
          'top': '10px',
          'left': '10px',
          'height': '36px',
          'width': '36px',
          'border-radius': '18px',
          'background': 'transparent url () 0 0 no-repeat',
          'background-size': 'cover'
        },
        '._pinner': {
          'white-space': 'nowrap',
          'overflow': 'hidden',
          'text-overflow': 'ellipsis',
          'width': '75%',
          'position': 'absolute',
          'top': '20px',
          'left': '56px',
          'font-size': '14px',
          'font-weight': 'bold'
        }
      },
      '._bd': {
        'padding': '0 10px',
        '-moz-scrollbars': 'none',
        '-ms-overflow-style': 'none',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
        '._ct': {
          'width': '100%',
          'height': 'auto',
          '._col': {
            'display': 'inline-block',
            'width': '100%',
            'padding': '1px',
            'vertical-align': 'top',
            'min-width': '60px',
            '._img': {
              'margin': '0',
              'display': 'inline-block',
              'width': '100%',
              'background': 'transparent url() 0 0 no-repeat',
              'background-size': 'cover',
              'box-shadow': 'inset 0 0 1px #000',
              'border-radius': '2px'
            }
          }
        }
      },
      '._ft': {
        'padding': '11px',
        '._button': {
          'border-radius': '%buttonBorderRadiusTall%',
          'text-align': 'center',
          'box-shadow': 'inset 0 0 1px #888',
          'background-color': '#efefef',
          'position': 'relative',
          'display': 'block',
          'overflow' : 'hidden',
          'height': '33px',
          'width': '100%',
          'min-width': '70px',
          'padding': '0 3px',
          '._label': {
            'position': 'absolute',
            'left': '0',
            'width': '100%',
            'text-align': 'center',
            '&._top': {
              'top': '0'
            },
            '&._bottom': {
              'bottom': '0'
            },
            '._string': {
              'white-space': 'pre',
              'color': '#746d6a',
              'font-size': '13px',
              'font-weight': 'bold',
              'vertical-align': 'top',
              'display': 'inline-block',
              'height': '33px',
              'line-height': '33px'
            },
            '._logo': {
              'display': 'inline-block',
              'vertical-align': 'bottom',
              'height': '32px',
              'width': '80px',
              'background': 'transparent url(%lockup%) 50% 50% no-repeat',
              'background-size': 'contain'
            }
          },
          '&:hover': {
            'box-shadow': 'inset 0 0 1px #000'
          }
        }
      },
      '&._noscroll ._bd': {
        'overflow': 'hidden'
      },
      '&._board': {
        '._hd': {
          '._pinner': {
            'top': '10px'
          },
          '._board': {
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'width': '75%',
            'position': 'absolute',
            'bottom': '10px',
            'left': '56px',
            'color': '#363636',
            'font-size': '12px'
          }
        }
      },
      // other layouts
      '&._c2': {
        'max-width': 237 * 2 + 20 + 'px',
        'min-width': 60 * 2 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '50%' }
      },
      '&._c3': {
        'max-width': 237 * 3 + 20 + 'px',
        'min-width': 60 * 3 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '33.33%' }
      },
      '&._c4': {
        'max-width': 237 * 4 + 20 + 'px',
        'min-width': 60 * 4 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '25%' }
      },
      '&._c5': {
        'max-width': 237 * 5 + 20 + 'px',
        'min-width': 60 * 5 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '20%' }
      },
      '&._c6': {
        'max-width': 237 * 6 + 20 + 'px',
        'min-width': 60 * 6 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '16.66%' }
      },
      '&._c7': {
        'max-width': 237 * 7 + 20 + 'px',
        'min-width': 60 * 7 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '14.28%' }
      },
      '&._c8': {
        'max-width': 237 * 8 + 20 + 'px',
        'min-width': 60 * 8 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '12.5%' }
      },
      '&._c9': {
        'max-width': 237 * 9 + 20 + 'px',
        'min-width': 60 * 9 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '11.11%' }
      },
      '&._c10': {
        'max-width': 237 * 10 + 20 + 'px',
        'min-width': 60 * 10 + 20 + 'px',
        '._bd ._ct ._col': { 'width': '10%' }
      }
    },
    'span._embed_pin': {
      'width': '100%',
      'min-width': '160px',
      'max-width': '236px',
      'display': 'inline-block',
      'box-sizing': 'border-box',
      'box-shadow': 'inset 0 0 1px #000',
      'border-radius': '%widgetBorderRadius%',
      'overflow': 'hidden',
      'font': '12px "Helvetica Neue", Helvetica, arial, sans-serif',
      'color': '#363636',
      'background': '#fff',
      'cursor': 'pointer',
      '%prefix%font-smoothing': 'antialiased',
      '*': {
        'display': 'block',
        'position': 'relative',
        'font': 'inherit',
        'cursor': 'inherit',
        'color': 'inherit',
        'box-sizing': 'inherit',
        'margin': '0',
        'padding': '0',
        'text-align': 'left'
      },
      '._bd': {
        'border-bottom': '1px solid rgba(0, 0, 0, 0.09)',
        '._hd': {
          'border-bottom': '1px solid rgba(0, 0, 0, 0.09)',
          '._container': {
            'width': '100%',
            '._img, ._iframe, ._video': {
              'width': '100%',
              'height': '100%',
              'position': 'absolute',
              'left': '0',
              'background': 'transparent url() 0 0 no-repeat',
              'background-size': 'cover',
              'border': 'none'
            },
            '._native': {
              'height': '64px',
              'width': '64px',
              'background': 'transparent url(%native%) 0 0 no-repeat',
              'position': 'absolute',
              'top': '50%',
              'left': '50%',
              'margin-top': '-32px',
              'margin-left': '-32px',
              'opacity': '.75'
            },
            '._control': {
              'width': '50px',
              'height': '24px',
              'position': 'absolute',
              'bottom': '12px',
              'left': '12px',
              'background': 'rgba(0, 0, 0, .4)',
              'color': '#fff',
              'box-shadow': '0 0 2px rgba(0, 0, 0, .2)',
              'border': '2px solid rgba(255, 255, 255, .68)',
              'border-radius': '13px',
              '&._paused::after, &._playing::after' : {
                'position': 'absolute',
                'top': '0',
                'left': '0',
                'width': '100%',
                'height': '100%',
                'font-size': '10px',
                'line-height': '19px',
                'white-space': 'pre',
                'font-weight': 'bold',
                'font-style': 'normal',
                'text-align': 'center'
              },
              '&._paused::after': {
                'content': '"\u25B6 GIF"'
              },
              '&._playing::after': {
                'content': '"\u2759 \u2759 GIF"'
              }
            }
          },
          '._repin': {
            'position': 'absolute',
            'top': '10px',
            'left': '10px',
            'height': '28px',
            'width': '56px',
            'color': '#fff',
            'background': '#e60023 url(%logo%) 5px 50% no-repeat',
            'background-size': '18px 18px',
            'text-indent': '28px',
            'font': '14px/28px "Helvetica Neue", Helvetica, Arial, "sans-serif"',
            'font-weight': 'bold',
            'border-radius': '4px',
            'padding': '0 6px 0 0',
            'width': 'auto',
            '&:hover': {
              'background-color': '#e60023',
              'box-shadow': 'none'
            }
          }
        },
        '._source': {
          'height': '38px',
          'border-bottom': '1px solid rgba(0, 0, 0, 0.09)',
          '._img': {
            'position': 'absolute',
            'top': '50%',
            'margin-top': '-8px',
            'left': '10px',
            'height': '16px',
            'width': '16px',
            'background': 'transparent url() 0 0 no-repeat',
            'background-size': '16px 16px'
          },
          '._domain': {
            'line-height': '38px',
            'max-width': '75%',
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'font-weight': 'bold',
            'color': '#b9b9b9',
            'position': 'absolute',
            'top': '0px',
            'left': '35px'
          },
          '&._nofav': {
            '._img': {
              'display': 'none'
            },
            '._domain': {
              'max-width': '85%',
              'left': '10px'
            }
          },
          '._menu': {
            'height': 'inherit',
            '._toggle': {
              'position': 'absolute',
              'top': '0',
              'right': '5px',
              'height': 'inherit',
              'width': '30px',
              'border-bottom': '1px solid rgba(0, 0, 0, 0.09)',
              'background': '#fff url(%menu%) 50% 50% no-repeat',
              'background-size': 'fill'
            },
            '._dropdown': {
              'display': 'none',
              'border-radius': '5px',
              'box-shadow': '0 1px 3px rgba(0, 0, 0, .33)',
              'font-weight': 'bold',
              'font-size': '12px',
              'background': '#fff',
              'text-align': 'left',
              'padding': '10px',
              'position': 'absolute',
              'max-width': '195px',
              'right': '10px',
              'top': '39px',
              'z-index': '1',
              '&::after': {
                'content': '""',
                'position': 'absolute',
                'top': '-6px',
                'right': '1px',
                'border-bottom': '8px solid #fff',
                'border-right': '8px solid transparent',
                'border-left': '8px solid transparent'
              },
              '&::before' : {
                'content': '""',
                'position': 'absolute',
                'top': '-7px',
                'right': '2px',
                'border-bottom': '7px solid #e2e2e2',
                'border-right': '7px solid transparent',
                'border-left': '7px solid transparent'
              }
            }
          }
        },
        '._description': {
          'font-size': '14px',
          'line-height': '17px',
          'margin': '8px 12px'
        },
        '._attribution': {
          'height': '22px',
          'margin-top': '5px',
          '._img': {
            'position': 'absolute',
            'top': '50%',
            'margin-top': '-8px',
            'left': '10px',
            'height': '16px',
            'width': '16px',
            'background': 'transparent url() 0 0 no-repeat',
            'background-size': '16px 16px'
          },
          '._by': {
            'line-height': '22px',
            'max-width': '75%',
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'font-size': '11px',
            'font-weight': 'bold',
            'color': '#b9b9b9',
            'position': 'absolute',
            'top': '0px',
            'left': '35px'
          }
        },
        '._stats': {
          'height': '24px',
          'line-height': '24px',
          'margin': '0 0 0 10px',
          '._repins': {
            'padding-left': '17px',
            'padding-right': '10px',
            'color': '#a8a8a8',
            'font-size': '11px',
            'font-weight': 'bold',
            'display': 'inline-block',
            'background': 'transparent url(%repins%) 0 50% no-repeat'
          },
          '._done': {
            'padding-left': '15px',
            'padding-right': '10px',
            'color': '#a8a8a8',
            'font-size': '11px',
            'font-weight': 'bold',
            'display': 'inline-block',
            'background': 'transparent url(%done%) 0 50% no-repeat'
          }
        }
      },
      '._ft': {
        'height': '50px',
        'margin-right': '10px',
        'overflow': 'hidden',
        '&:after': {
          'content': "'-------------------------------------------------------------------------------------'",
          'display': 'block',
          'height': '1px',
          'line-height': '1px',
          'color': '#fff'
        },
        '._img': {
          'position': 'absolute',
          'left': '10px',
          'top': '10px',
          'height': '30px',
          'width': '30px',
          'border-radius': '30px',
          'background': 'transparent url() 0 0 no-repeat',
          'background-size': '30px 30px'
        },
        '._pinner,  ._board': {
          'position': 'absolute',
          'left': '50px',
          'white-space': 'nowrap',
          'overflow': 'hidden',
          'text-overflow': 'ellipsis',
          'width': '75%'
        },
        '._pinner': {
          'font-weight': 'bold',
          'top': '10px'
        },
        '._board': {
          'bottom': '10px'
        }
      },
      // Japanese asset for Pin It button
      '&._ja ._bd ._hd ._repin': {
        'background-image': 'url(%pinit_ja_white%)',
        '&._save': {
          'background': '#e60023 url(%logo%) 5px 50% no-repeat',
          'background-size': '16px 16px'
        }
      },
      '&._medium': {
        'min-width': '237px',
        'max-width': '345px'
      },
      '&._large': {
        'min-width': '345px',
        'max-width': '600px',
        'padding': '30px 34px 10px',
        'font-size': '14px',
        '._bd': {
          'border-bottom': 'none',
          '._hd': {
            'padding-top': '50px',
            'border-bottom': 'none',
            '._container ._img, ._container ._video': {
              'border-radius': '8px'
            },
            '._repin': {
              'top': '0px',
              'left': '0px'
            }
          },
          '._source': {
            'height': '50px',
            '._domain': {
              'line-height': '50px'
            }
          },
          '._stats': {
            'position': 'absolute',
            'top': '0',
            'right': '0',
            'text-align': 'right'
          },
          '._description': {
            'font-size': '16px',
            'line-height': '20px'
          },
          '._menu': {
            'height': 'inherit',
            '._dropdown': {
              'top': '50px',
              'font-size': '14px',
              'padding': '10px'
            }
          }
        },
        '._ft': {
          'height': '60px',
          'font-size': '16px',
          '._board, ._pinner': {
            'left': '60px'
          },
          '._img': {
            'height': '40px',
            'width': '40px',
            'height': '40px',
            'background-size': '40px 40px',
            'border-radius': '20px'
          }
        }
      }
    },
    '._button_follow': {
      'display': 'inline-block',
      'color': '#363636',
      'box-sizing': 'border-box',
      'box-shadow': 'inset 0 0 1px #888',
      'border-radius': '%buttonBorderRadius%',
      'font': 'bold 11px/20px "Helvetica Neue", Helvetica, arial, sans-serif !important',
      'box-sizing': 'border-box',
      'cursor': 'pointer',
      '%prefix%font-smoothing': 'antialiased',
      'height': '20px',
      'padding': '0 4px 0 20px',
      'background-color': '#efefef',
      'position': 'relative',
      'white-space': 'nowrap',
      'vertical-align': 'baseline',
      '&:hover': {
        'box-shadow': 'inset 0 0 1px #000'
      },
      '&::after': {
        'content': '""',
        'position': 'absolute',
        'height': '14px',
        'width': '14px',
        'top': '3px',
        'left': '3px',
        'background': 'transparent url(%logo%) 0 0 no-repeat',
        'background-size': '14px 14px'
      },
      '&._tall': {
        'height': '26px',
        'line-height': '26px',
        'font-size': '13px',
        'padding': '0 6px 0 25px',
        'border-radius': '%buttonBorderRadiusTall%',
        '&::after': {
          'height': '18px',
          'width': '18px',
          'top': '4px',
          'left': '4px',
          'background-size': '18px 18px'
        }
      }
    },
    '._button_pin': {
      'cursor': 'pointer',
      'display': 'inline-block',
      'box-sizing': 'border-box',
      'box-shadow': 'inset 0 0 1px #888',
      'border-radius': '%buttonBorderRadius%',
      'height': '20px',
      'width': '40px',
      '%prefix%font-smoothing': 'antialiased',
      'background': '#efefef url(%pinit_en_red%) 50% 50% no-repeat',
      'background-size': '75%',
      'position': 'relative',
      'font': '12px "Helvetica Neue", Helvetica, arial, sans-serif',
      'color': '#555',
      'box-sizing': 'border-box',
      'text-align': 'center',
      'vertical-align': 'baseline',
      '&:hover': {
        'box-shadow': 'inset 0 0 1px #000'
      },
      '&._above': {
        '._count': {
          'position': 'absolute',
          'top': '-28px',
          'left': '0',
          'height': '28px',
          'width': 'inherit',
          'line-height': '24px',
          'background': 'transparent url(%above%) 0 0 no-repeat',
          'background-size': '40px 28px'
        },
        '&._padded': {
          'margin-top': '28px'
        }
      },
      '&._beside': {
        '._count': {
          'position': 'absolute',
          'right': '-45px',
          'text-align': 'center',
          'text-indent': '5px',
          'height': 'inherit',
          'width': '45px',
          'font-size': '11px',
          'line-height': '20px',
          'background': 'transparent url(%beside%)',
          'background-size': 'cover'
        },
        '&._padded': {
          'margin-right': '45px'
        }
      },
      '&._ja': {
       'background-image': 'url(%pinit_ja_red%)',
       'background-size': '72%'
      },
      '&._red': {
        'background-color': '#e60023',
        'background-image': 'url(%pinit_en_white%)',
        '&._ja': {
          'background-image': 'url(%pinit_ja_white%)'
        }
      },
      '&._white': {
        'background-color': '#fff'
      },
      '&._save': {
        '&:hover': {
          'background-color': '#e60023',
          'box-shadow': 'none',
          'color': '#fff!important'
        },
        'border-radius': '2px',
        'text-indent': '20px',
        'width': 'auto',
        'padding': '0 4px 0 0',
        'text-align': 'center',
        'text-decoration': 'none',
        'font': '11px/20px "Helvetica Neue", Helvetica, sans-serif',
        'font-weight': 'bold',
        'color': '#fff!important',
        'background': '#e60023 url(%logo%) 3px 50% no-repeat',
        'background-size': '14px 14px',
        'font-weight': 'bold',
        '-webkit-font-smoothing': 'antialiased',
        '._count': {
          'text-indent': '0',
          'position': 'absolute',
          'color': '#555',
          'background': '#efefef',
          'border-radius': '2px',
          // fang
          '&::before' : {
            'content': '""',
            'position': 'absolute'
          }
        },
        '&._beside': {
          '._count': {
            'right': '-46px',
            'height': '20px',
            'width': '40px',
            'font-size': '10px',
            'line-height': '20px',
            '&::before' : {
              'top': '3px',
              'left': '-4px',
              'border-right': '7px solid #efefef',
              'border-top': '7px solid transparent',
              'border-bottom': '7px solid transparent'
            }
          }
        },
        '&._above': {
          '._count': {
            'top': '-36px',
            'width': '100%',
            'height': '30px',
            'font-size': '10px',
            'line-height': '30px',
            '&::before' : {
              'bottom': '-4px',
              'left': '4px',
              'border-top': '7px solid #efefef',
              'border-right': '7px solid transparent',
              'border-left': '7px solid transparent'
            }
          },
          '&._padded': {
            'margin-top': '28px'
          }
        }
      },
      '&._tall': {
        'height': '28px',
        'width': '56px',
        'border-radius': '%buttonBorderRadiusTall%',
        '&._above': {
          '._count': {
            'position': 'absolute',
            'height': '37px',
            'width': 'inherit',
            'top': '-37px',
            'left': '0',
            'line-height': '30px',
            'font-size': '14px',
            'background': 'transparent url(%above%)',
            'background-size': 'cover'
          },
          '&._padded': {
            'margin-top': '37px'
          }
        },
        '&._beside': {
          '._count': {
            'text-indent': '5px',
            'position': 'absolute',
            'right': '-63px',
            'height': 'inherit',
            'width': '63px',
            'font-size': '14px',
            'line-height': '28px',
            'background': 'transparent url(%beside%)',
            'background-size': 'cover'
          },
          '&._padded': {
            'margin-right': '63px'
          }
        },
        '&._save': {
          'border-radius': '4px',
          'width': 'auto',
          'background-position-x': '6px',
          'background-size': '18px 18px',
          'text-indent': '29px',
          'font': '14px/28px "Helvetica Neue", Helvetica, Arial, "sans-serif"',
          'font-weight': 'bold',
          'padding': '0 6px 0 0',
          '._count': {
            'position': 'absolute',
            'color': '#555',
            'font-size': '12px',
            'text-indent': '0',
            'background': '#efefef',
            'border-radius': '4px',
            '&::before' : {
              'content': '""',
              'position': 'absolute'
            }
          },
          '&._above': {
            '._count': {
              'font-size': '14px',
              'top': '-50px',
              'width': '100%',
              'height': '44px',
              'line-height': '44px',
              '&::before' : {
                'bottom': '-4px',
                'left': '7px',
                'border-top': '7px solid #efefef',
                'border-right': '7px solid transparent',
                'border-left': '7px solid transparent'
              }
            }
          },
          '&._beside': {
            '._count': {
              'font-size': '14px',
              'right': '-63px',
              'width': '56px',
              'height': '28px',
              'line-height': '28px',
              '&::before' : {
                'top': '7px',
                'left': '-4px',
                'border-right': '7px solid #efefef',
                'border-top': '7px solid transparent',
                'border-bottom': '7px solid transparent'
              }
            }
          }
        }
      },
      '&._round': {
        'height': '16px',
        'width': '16px',
        'background': 'transparent url(%logo%) 0 0 no-repeat',
        'background-size': '16px 16px',
        'box-shadow': 'none',
        '&._tall': {
          'height': '32px',
          'width': '32px',
          'background-size': '32px 32px'
        }
      }
    }
  }
}));

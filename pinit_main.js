/* jshint indent: false, maxlen: false */
// return buttons to Pinterest Red
(function (w, d, n, a) {
  var $ = (w[a.k] = {
    w: w,
    d: d,
    n: n,
    a: a,
    s: {},
    f: (function () {
      return {
        // an empty array for callbacks to be added later
        callback: [],

        // console.log only if debug is on
        debug: function (obj) {
          if ($.v.config.debug) {
            if ($.w.console && $.w.console.log) {
              $.w.console.log(obj);
            }
          }
        },

        // add and remove event listeners in a cross-browser fashion
        listen: function (el, ev, fn, detach) {
          if (!detach) {
            // add listener
            if (typeof $.w.addEventListener !== "undefined") {
              el.addEventListener(ev, fn, false);
            } else if (typeof $.w.attachEvent !== "undefined") {
              el.attachEvent("on" + ev, fn);
            }
          } else {
            // remove listener
            if (typeof el.removeEventListener !== "undefined") {
              el.removeEventListener(ev, fn, false);
            } else if (typeof el.detachEvent !== "undefined") {
              el.detachEvent("on" + ev, fn);
            }
          }
        },

        // find an event's target element
        // via PPK (http://www.quirksmode.org/js/events_properties.html)
        getEl: function (e) {
          var el = null;
          if (e.target) {
            el = e.target.nodeType === 3 ? e.target.parentNode : e.target;
          } else {
            el = e.srcElement;
          }
          return el;
        },

        // add or remove a class
        changeClass: function (el, delta) {
          // delta of {foo: true, bar: false } will add foo and remove bar

          var remove = function (str) {
            var target = new RegExp(str, "ig");
            el.className = el.className
              .replace(target, "")
              .replace(/  +/g, " ");
          };

          for (var k in delta) {
            var selector = $.a.k + "_" + k;
            // always remove any possible existing incidences
            remove(selector);
            // are we adding?
            if (delta[k] === true) {
              el.className = el.className + " " + selector;
            }
          }
        },

        // get a DOM property or text attribute
        get: function (el, att) {
          var v = "";
          if (typeof el[att] === "string") {
            v = el[att];
          } else {
            v = el.getAttribute(att);
          }
          return v;
        },

        loadFont: function (font) {
          // this assumes $.v.ourStyles exists; the timeout is suspenders-and-belt
          $.w.setTimeout(function () {
            $.v.ourStyles.sheet.insertRule(
              '@font-face { font-family: "' +
                font.name +
                '"; src: url("' +
                font.url +
                '"); font-weight: normal; font-style: normal; }'
            );
          }, 1);
        },

        // get a data: attribute
        getData: function (el, att) {
          att = $.a.dataAttributePrefix + att;
          return $.f.get(el, att);
        },

        // set a DOM property or text attribute
        set: function (el, att, string) {
          if (typeof el[att] === "string") {
            el[att] = string;
          } else {
            el.setAttribute(att, string);
          }
        },

        // create a DOM element
        make: function (obj) {
          var el = false,
            tag,
            att;
          for (tag in obj) {
            if (obj[tag] && obj[tag].hasOwnProperty) {
              el = $.d.createElement(tag);
              for (att in obj[tag]) {
                if (obj[tag][att] && obj[tag][att].hasOwnProperty) {
                  if (typeof obj[tag][att] === "string") {
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
          if (typeof obj === "string") {
            obj = $.d.getElementById(obj);
          }
          if (obj && obj.parentNode) {
            obj.parentNode.removeChild(obj);
          }
        },

        // replace one DOM element with another
        replace: function (before, after) {
          if (typeof before === "object" && typeof after === "object") {
            $.w.setTimeout(function () {
              before.parentNode.insertBefore(after, before);
              $.w.setTimeout(function () {
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
          query = str.split("#")[0].split("?");
          // found query?
          if (query[1]) {
            // split to pairs
            pair = query[1].split("&");
            // loop through pairs
            for (i = 0, n = pair.length; i < n; i = i + 1) {
              // split on equals
              part = pair[i].split("=");
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
        preventDefault: function (v) {
          if (v.preventDefault) {
            v.preventDefault();
          } else {
            v.returnValue = false;
          }
        },

        // return moz, webkit, ms, etc
        getVendorPrefix: function () {
          var x = /^(moz|webkit|ms)(?=[A-Z])/i;
          var r = "";
          for (var p in $.d.b.style) {
            if (x.test(p)) {
              r = "-" + p.match(x)[0].toLowerCase() + "-";
              break;
            }
          }
          return r;
        },

        // call an API endpoint; fire callback if specified
        call: function (url, callback) {
          var n,
            id,
            tag,
            msg,
            sep = "?";
          // $.f.callback starts as an empty array
          n = $.f.callback.length;

          // new SCRIPT tags get IDs so we can find them, query them, and delete them later
          id = $.a.k + ".f.callback[" + n + "]";

          // the callback will fire only when the API returns
          $.f.callback[n] = function (r) {
            // do we have output?
            if (r) {
              // send the original call back with the callback so we can munge href URLs if needed
              r.theCall = url;
              // do we need to log an error?
              if (r.status && r.status === "failure") {
                // some errors don't have messages; fall back to status
                msg = r.message || r.status;
                // has the site operator specified a callback?
                if (typeof $.v.config.error === "string") {
                  // does the callback function actually exist?
                  if (typeof $.w[$.v.config.error] === "function") {
                    $.w[$.v.config.error](msg);
                  }
                }
                // scope gotcha: recreate id string from n instead of relying on it already being in id
                tag = $.d.getElementById($.a.k + ".f.callback[" + n + "]");
                // found it?
                if (tag) {
                  // does it have a src attribute?
                  if (tag.src) {
                    // log only the URL part
                    $.f.log(
                      "&event=api_error&code=" +
                        r.code +
                        "&msg=" +
                        msg +
                        "&url=" +
                        encodeURIComponent(tag.src.split("?")[0])
                    );
                  }
                }
              }
            }
            // if a callback exists, pass the API output
            if (typeof callback === "function") {
              callback(r, n);
            }
            // clean up the SCRIPT tag after it's run
            $.f.kill(id);
          };

          // some calls may come with a query string already set
          if (url.match(/\?/)) {
            sep = "&";
          }

          // make and call the new SCRIPT tag
          $.d.b.appendChild(
            $.f.make({
              SCRIPT: {
                id: id,
                type: "text/javascript",
                charset: "utf-8",
                src: url + sep + "callback=" + id
              }
            })
          );
        },

        // super-light base-64 encoder; guaranteed to choke on Unicode
        // via Dave Chambers (https://github.com/davidchambers/Base64.js)
        btoa: function (s) {
          var d = "data:image/svg+xml;base64,";
          if ($.w.btoa) {
            d = d + $.w.btoa(s);
          } else {
            for (
              var a =
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                b,
                c,
                i = 0;
              s.charAt(i | 0) || ((a = "="), i % 1);
              d = d + a.charAt(63 & (b >> (8 - (i % 1) * 8)))
            ) {
              c = s.charCodeAt((i += 0.75));
              b = (b << 8) | c;
            }
          }
          return d;
        },

        // turn a path and some values into an SVG
        makeSVG: function (obj, fill) {
          var i, n, svg;

          // start svg
          svg =
            '<svg xmlns="http://www.w3.org/2000/svg" height="%h%px" width="%w%px" viewBox="%x1% %y1% %x2% %y2%"><g>';

          // height and width
          svg = svg.replace(/%h%/, obj.h);
          svg = svg.replace(/%w%/, obj.w);

          // view box defaults to 0, 0, w, h but can be overriden (side count bubble)
          svg = svg.replace(/%x1%/, obj.x1 || "0");
          svg = svg.replace(/%y1%/, obj.y1 || "0");
          svg = svg.replace(/%x2%/, obj.x2 || obj.w);
          svg = svg.replace(/%y2%/, obj.y2 || obj.h);

          // compute svg data for each path (round Pinterest logo has two)
          for (i = 0, n = obj.p.length; i < n; i = i + 1) {
            // start the path
            svg = svg + '<path d="' + obj.p[i].d + '"';

            // use alternate fill color if specified (white Pin It logotype)
            svg = svg + ' fill="#' + (fill || obj.p[i].f || "#000") + '"';

            // stroke
            if (obj.p[i].s) {
              svg = svg + ' stroke="#' + obj.p[i].s + '"';
              // stroke-width
              if (!obj.p[i].w) {
                obj.p[i].w = "2";
              }
              svg = svg + ' stroke-width="' + obj.p[i].w + '"';
            }

            // done
            svg = svg + "></path>";
          }

          // end svg
          svg = svg + "</g></svg>";
          return $.f.btoa(svg);
        },

        // build stylesheet
        buildStyleSheet: function () {
          var css, rules, k, re, repl;
          css = $.f.make({ STYLE: { type: "text/css" } });
          rules = $.v.css;
          // each rule has our randomly-created key at its root to minimize style collisions
          rules = rules.replace(/\._/g, "." + a.k + "_");

          // strings to replace in CSS rules
          var repl = {
            "%prefix%": $.f.getVendorPrefix(),
            // css directives
            "%thinShadow%": "0 0 1px rgba(0,0,0,.5)",
            "%widgetBorderRadius%": "16px",
            "%buttonBorderRadius%": "3px",
            "%buttonBorderRadiusTall%": "3px",
            "%saveButtonBackgroundColor%": "#e60023",
            // SVG replacements
            "%play%": $.f.makeSVG($.a.svg.play),
            "%pause%": $.f.makeSVG($.a.svg.pause),
            "%forward%": $.f.makeSVG($.a.svg.forward),
            "%backward%": $.f.makeSVG($.a.svg.backward),
            "%above%": $.f.makeSVG($.a.svg.above),
            "%beside%": $.f.makeSVG($.a.svg.beside),
            "%logo%": $.f.makeSVG($.a.svg.logo),
            "%lockup%": $.f.makeSVG($.a.svg.lockup),
            "%pinit_en_red%": $.f.makeSVG($.a.svg.pinit_en),
            "%pinit_en_white%": $.f.makeSVG($.a.svg.pinit_en, "fff"),
            "%pinit_ja_red%": $.f.makeSVG($.a.svg.pinit_ja),
            "%pinit_ja_white%": $.f.makeSVG($.a.svg.pinit_ja, "fff")
          };

          $.f.makeSVG($.a.svg.pinit_en, "fff");

          // replace everything in repl throughout rules
          for (k in repl) {
            if (repl[k].hasOwnProperty) {
              // re = new RegExp(k, 'g');
              rules = rules.replace(new RegExp(k, "g"), repl[k]);
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
          $.v.ourStyles = css;
        },
        // recursive function to make rules out of a Sass-like object
        presentation: function (obj, str) {
          // make CSS rules
          var name,
            i,
            k,
            pad,
            key,
            rules = "",
            selector = str || "";
          for (k in obj) {
            if (obj[k].hasOwnProperty) {
              // found a rule
              if (typeof obj[k] === "string") {
                rules = rules + "\n  " + k + ": " + obj[k] + ";";
              }
            }
          }
          // add selector and rules to stylesheet
          if (selector && rules) {
            $.v.css = $.v.css + selector + " { " + rules + "\n}\n";
          }
          // any children we need to handle?
          for (k in obj) {
            if (obj[k].hasOwnProperty) {
              if (typeof obj[k] === "object") {
                // replace & with parent selector
                // var key = k.replace(/&/g, selector);
                key = selector + " " + k;
                key = key.replace(/ &/g, "");
                key = key.replace(/,/g, ", " + selector);
                $.f.presentation(obj[k], key);
              }
            }
          }
          // if this is our root, remove from current context and make stylesheet
          if (obj === $.a.styles) {
            $.w.setTimeout(function () {
              $.f.buildStyleSheet();
            }, 1);
          }
        },

        // send logging information
        log: function (str) {
          // don't log from our networks
          if (
            !$.v.here.url.match(/^https?:\/\/(.*?\.|)(pinterest|pinadmin)\.com\//)
          ) {
            // query always starts with type=pidget&guid=something
            var query = "?type=pidget&guid=" + $.v.guid,
              ping = new Image();
            // add test version if found
            if ($.a.tv) {
              query = query + "&tv=" + $.a.tv;
            }
            // add optional string &foo=bar
            if (str) {
              query = query + str;
            }
            // add user-specified logging tag, if present
            if ($.v.config.tag) {
              query = query + "&tag=" + $.v.config.tag;
            }
            // add the page we're looking at right now
            query = query + "&via=" + encodeURIComponent($.v.here.url);
            // did we derive via from an alternate to document.URL
            if ($.v.here.src !== 'doc') {
              // pin, canonical, or og
              query = query + "&viaSrc=" + $.v.here.src;
            }
            // did we modify this URL due to a forbidden parameter?
            if ($.v.here.mod) {
              query = query + "&viaMod=1";
            }
            // debug what we're about to send
            $.f.debug("Logging: " + query);
            ping.src = $.a.endpoint.log + query;
          }
        },

        // build a query
        buildQuery: function (params) {
          var query = "";
          for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
              if (query) {
                query = query + "&";
              }
              query = query + key + "=" + encodeURIComponent(params[key]);
            }
          }
          return query;
        },

        // things that happen on click, exposed for site operators to call if needed
        util: {
          // story pin video controls
          control: function (me) {
            // default play
            var directive = "play";
            // if we're pausing, set it to pause
            if (me.el.className.match("_pause")) {
              directive = "pause";
            }
            // get our pin
            var top = me.el.parentNode.parentNode.parentNode;
            // get the first video in the pin and pause or play it
            top.getElementsByTagName("video")[0][directive]();
            // find our play and pause controls
            var controls = {
              play: me.el.parentNode.getElementsByClassName($.a.k + "_play")[0],
              pause: me.el.parentNode.getElementsByClassName($.a.k + "_pause")[0]
            }
            // show them both
            controls.play.style.display = controls.pause.style.display = "block";
            // hide the one we just clicked
            controls[directive].style.display = "none";
          },
          // story pin no-op (so we don't open the pin when someone clicks where nav has just disappeared)
          noop: function () {},
          // story pin navigation
          navigate: function (me) {
            var dir = $.f.getData(me.el, "log").split("_").pop();
            // get our pin
            var top = me.el.parentNode.parentNode.parentNode;
            // get the current index
            var current = $.f.get(top, "data-pin-current") - 0;
            // get the pages
            var pages = top.getElementsByClassName($.a.k + "_page");
            // stop playing video
            if (pages[current].className.match("hazVideo")) {
              var video = pages[current].getElementsByTagName("video");
              if (video[0]) {
                video[0].pause();
              }
              // if we are moving off page zero, hide pause/play controls
              if (!current) {
                var controls = me.el.parentNode.getElementsByClassName($.a.k + "_controls")[0];
                controls.style.display = "none";
                // reset controls so Pause isn't showing when we go back
                controls.getElementsByClassName($.a.k + "_play")[0].style.display = "block";
                controls.getElementsByClassName($.a.k + "_pause")[0].style.display = "none";
              }
            }
            // move the current page into the past or future
            if (dir === "forward") {
              // move the present page into the past
              $.f.changeClass(pages[current], { past: true });
              // increment current
              current = current + 1;
            } else {
              // move the present page into the future
              $.f.changeClass(pages[current], { future: true });
              // increment current
              current = current - 1;
              // are we on the first page?
              if (!current) {
                // do we have a video?
                if (pages[current].className.match("hazVideo")) {
                  $.w.setTimeout(function () {
                    me.el.parentNode.getElementsByClassName($.a.k + "_controls")[0].style.display = "block";
                    // wait .25s so the animation can finish before throwing up the controller
                  }, 250);
                }
              }
            }
            // set the new index
            $.f.set(top, "data-pin-current", current);
            // update progress dots
            var dots = top.getElementsByClassName($.a.k + "_indicator");
            for (i = 0; i < dots.length; i = i + 1) {
              $.f.changeClass(dots[i], { current: i === current });
            }
            // move the new page into the present
            if (dir === "forward") {
              // we've gone forward so we are no longer at the beginning
              $.f.changeClass(top, { atStart: false });
              // move the future page into the present
              $.f.changeClass(pages[current], { future: false });
              // hide the forward arrow
              if (current === pages.length - 1) {
                // we're at the end
                $.f.changeClass(top, { atEnd: true });
              }
            } else {
              // we've gone backward so we are no longer at the end
              $.f.changeClass(top, { atEnd: false });
              // move the past page into the present
              $.f.changeClass(pages[current], { past: false });
              // hide the forward arrow
              if (current === 0) {
                // we're at the beginning
                $.f.changeClass(top, { atStart: true });
              }
            }
            // start playing if we are not on page 0, which has a player control
            if (pages[current].className.match("hazVideo") && current) {
              var video = pages[current].getElementsByTagName("video");
              if (video[0]) {
                video[0].play();
              }
            }
          },
          // open an URL
          open: function (me) {
            $.w.open(me.href, "_blank");
          },
          // open pinmarklet
          pinAny: function () {
            $.f.debug("opening the grid");
            $.d.b.appendChild(
              $.f.make({
                SCRIPT: {
                  type: "text/javascript",
                  charset: "utf-8",
                  pinMethod: "button",
                  guid: $.v.guid,
                  src: $.a.endpoint.bookmark + "?guid=" + $.v.guid
                }
              })
            );
          },
          // pin an image
          pinOne: function (o) {
            if (o.href) {
              // parsing an URL, pinning
              var q = $.f.parse(o.href, {
                url: true,
                media: true,
                description: true
              });
              // found valid URLs?
              if (
                q.url &&
                q.url.match(/^http/i) &&
                q.media &&
                q.media.match(/^http/i)
              ) {
                // log an error for Pin It buttons that don't have default descriptions
                if (!q.description) {
                  q.description = $.d.title;
                }
                // don't pass more than 500 characters to the board picker
                if (q.description.length > 500) {
                  q.description = q.description.substring(0, 500);
                }
                // pop the pin form
                $.w.open(
                  o.href,
                  "pin" + new Date().getTime(),
                  $.a.pop.base.replace("%dim%", $.a.pop.size)
                );
              } else {
                // fire up the bookmarklet and hope for the best
                $.f.util.pinAny();
              }
            } else {
              // we're pinning an image
              if (o.media) {
                if (!o.url) {
                  o.url = $.v.here.url;
                }
                if (!o.description) {
                  o.description = $.d.title;
                }
                // don't pass more than 500 characters to the board picker
                if (o.description.length > 500) {
                  o.description = o.description.substring(0, 500);
                }
                // pop the pin form
                $.f.log("&event=button_pinit_custom");
                o.href =
                  $.v.config.pinterest +
                  "/pin/create/button/?guid=" +
                  $.v.guid +
                  "&url=" +
                  encodeURIComponent(o.url) +
                  "&media=" +
                  encodeURIComponent(o.media) +
                  "&description=" +
                  encodeURIComponent(o.description);
                $.w.open(
                  o.href,
                  "pin" + new Date().getTime(),
                  $.a.pop.base.replace("%dim%", $.a.pop.size)
                );
              } else {
                // no media
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
            if (typeof data === "object") {
              if (data.href) {
                pinId = data.href.split("/")[4];
              }
            } else {
              pinId = data;
            }
            if (parseInt(pinId)) {
              var href =
                $.v.config.pinterest +
                $.a.path.repin.replace("%s", pinId) +
                "?guid=" +
                $.v.guid;
              $.w.open(
                href,
                "pin" + new Date().getTime(),
                $.a.pop.base.replace("%dim%", $.a.pop.size)
              );
            } else {
              $.f.debug($.v.config.util + ".repin requires an integer pinId");
            }
          },
          // open follow dialog
          follow: function (o) {
            $.w.open(
              o.href,
              "pin" + new Date().getTime(),
              $.a.pop.base.replace("%dim%", $.a.pop.size)
            );
          },
          // send a log request
          log: function (params) {
            if (params) {
              $.f.log("&" + $.f.buildQuery(params));
            } else {
              $.f.debug($.v.config.util + ".log requires valid query params");
            }
          }
        },

        // build a complex element from a JSON template
        buildOne: function (obj, el) {
          if (!el) {
            var opts = {};
            // Add links to buttons for SEO.

            if (obj.tagName === "A" && obj.href) {
              opts.A = {
                className:
                  $.a.k + "_" + obj.className.replace(/ /g, " " + $.a.k + "_"),
                href: obj.href
              };
            } else {
              opts.SPAN = {
                className:
                  $.a.k + "_" + obj.className.replace(/ /g, " " + $.a.k + "_")
              };
            }
            var root = $.f.make(opts);
            $.f.buildOne(obj, root);
            // return a pointer to the object that will eventually contain the entire built structure
            return root;
          } else {
            if (obj && obj.length) {
              // do we have an array of children to build?
              for (var i = 0; i < obj.length; i = i + 1) {
                $.f.buildOne(obj[i], el);
              }
            } else {
              // check keys; set attributes if they're strings
              for (var key in obj) {
                if (typeof obj[key] === "string") {
                  // set an attribute
                  var value = obj[key];
                  // set text
                  if (key === "text") {
                    el.innerHTML = el.innerHTML + value;
                  }
                  // add calss names
                  if (key === "addClass") {
                    var classesToAdd = value.split(" ");
                    for (var i = 0; i < classesToAdd.length; i = i + 1) {
                      el.className =
                        el.className + " " + $.a.k + "_" + classesToAdd[i];
                    }
                  }
                  // only some style attributes are allowed
                  if ($.a.build.setStyle[key]) {
                    if (key === "backgroundImage") {
                      el.style[key] = "url(" + value + ")";
                    } else {
                      el.style[key] = value;
                    }
                  }
                  // only some data attributes are allowed
                  if ($.a.build.setData[key]) {
                    $.f.set(el, "data-pin-" + key, value);
                  }
                } else {
                  // we have an object
                  if (key !== "video") {
                    // create a new container for the child element
                    var child = $.f.make({
                      SPAN: {
                        className: $.a.k + "_" + key.replace(/ /g, " " + $.a.k),
                        // where we go on click
                        "data-pin-href": $.f.getData(el, "href"),
                        // what we log (and potentially what we do) on click
                        "data-pin-log": $.f.getData(el, "log")
                      }
                    });
                    // append the child to our current element
                    el.appendChild(child);
                    // check for grandchildren
                    $.f.buildOne(obj[key], child);
                  } else {
                    // we have a video (currently only available in story pins)
                    var addVideoClass = "";
                    if (obj.video.addClass) {
                      addVideoClass = " " + $.a.k + "_" + obj.video.addClass;
                    }
                    var myVideo = $.f.make({
                      VIDEO: {
                        poster: obj.video.poster,
                        preload: "auto",
                        loop: "loop",
                        playsinline: "playsinline",
                        class: $.a.k + "_video" + addVideoClass 
                      }
                    });
                    // append the mp4 first or Firefox will complain in console about m3u8 not being supported
                    if (obj.video.mp4) {
                      myVideo.appendChild(
                        $.f.make({
                          SOURCE: {
                            src: obj.video.mp4,
                            type: "video/mp4"
                          }
                        })
                      );
                    }
                    // do the right thing for Webkit browsers
                    if (obj.video.m3u8) {
                      myVideo.appendChild(
                        $.f.make({
                          SOURCE: {
                            src: obj.video.m3u8,
                            type: "video/m3u8"
                          }
                        })
                      );
                    }
                    // append the video
                    el.appendChild(myVideo);
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
            log = $.f.getData(el, "log");
            // custom buttons with child nodes may not pass clicks; check one level up
            if (!log && el.parentNode) {
              el = el.parentNode;
              log = $.f.getData(el, "log");
            }
            // is it one of ours?
            if (log) {
              x = $.f.getData(el, "x") || "";
              href = $.f.getData(el, "href");
              if (x) {
                // sticky and hoverbuttons will pass in &tall=1&round=1
                // embedded pin widget will show a naked value so report &x=value
                if (x.substr(0, 1) !== "&") {
                  x = "&x=" + encodeURIComponent(x);
                }
              }
              $.f.log(
                "&event=click&target=" +
                  log +
                  "&lang=" +
                  $.v.lang +
                  "&sub=" +
                  $.v.sub +
                  x +
                  "&href=" +
                  encodeURIComponent(href)
              );
              if (typeof $.f.util[$.a.util[log]] === "function") {
                // got a special utility handler? run it
                $.f.util[$.a.util[log]]({ el: el, href: href, v: v });
              } else {
                if (href) {
                  // some elements are controls, like pause/play and menu toggle; they won't open new pages
                  $.w.open(href, "_blank");
                }
              }
            }
          }
        },

        // BEGIN HOVERBUTTON-RELATED STUFF

        // return the selected text, if any
        getSelection: function () {
          return (
            "" +
            ($.w.getSelection
              ? $.w.getSelection()
              : $.d.getSelection
              ? $.d.getSelection()
              : $.d.selection.createRange().text)
          ).replace(/(^\s+|\s+$)/g, "");
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

        // get position of an element
        getPos: function (el) {
          var rect = el.getBoundingClientRect();
          return {
            top: rect.top + $.w.scrollY,
            left: rect.left + $.w.scrollX,
            bottom: rect.bottom + $.w.scrollY,
            right: rect.right + $.w.scrollX
          };
        },

        // show hoverbuttons and stickybuttons
        showHoverButton: function (el, sticky) {
          // always try to kill it
          $.f.kill($.s.hoverButton);

          // get config options
          var c = {
            id: $.f.getData(el, "id"),
            url: $.f.getData(el, "url"),
            media: $.f.getData(el, "media"),
            description: $.f.getData(el, "description"),
            height: $.f.getData(el, "height") || $.v.config.height || "20",
            color: $.f.getData(el, "color") || $.v.config.color || "gray",
            shape: $.f.getData(el, "shape") || $.v.config.shape || "rect",
            lang: $.f.getLang($.f.getData(el, "lang") || $.v.config.lang || $.v.lang),
            // new params
            tall: $.f.getData(el, "tall") || $.v.config.tall,
            round: $.f.getData(el, "round") || $.v.config.round
          };

          // legacy translations
          if (c.height === "28") {
            c.tall = true;
          }
          if (c.shape === "round") {
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
            var x = "",
              impressionLogExtras = "&lang=" + c.lang + "&sub=" + $.v.sub;

            // make it fresh each time; this pays attention to individual image config options
            var buttonClass = $.a.k + "_button_pin";
            if (c.round) {
              buttonClass = buttonClass + " " + $.a.k + "_round";
              x = "&round=1";
            } else {
              buttonClass = buttonClass + " " + $.a.k + "_save";
            }

            if (c.tall) {
              buttonClass = buttonClass + " " + $.a.k + "_tall";
              x = x + "&tall=1";
            }

            impressionLogExtras = impressionLogExtras + x;

            // get position, start href
            var p = $.f.getPos(el),
              href,
              log;

            var log, href;
            if (c.id) {
              impressionLogExtras = impressionLogExtras + "&id=" + c.id;
              href = $.v.config.pinterest + $.a.path.repin.replace(/%s/, c.id);
              if (sticky) {
                log = "button_pinit_sticky_repin";
              } else {
                log = "button_pinit_floating_repin";
              }
            } else {
              // set the button href
              href =
                $.v.config.pinterest + $.a.path.create + "guid=" + $.v.guid;
              href = href + "&url=" + encodeURIComponent(c.url || $.v.here.url);
              href = href + "&media=" + encodeURIComponent(c.media || el.src);
              href =
                href +
                "&description=" +
                encodeURIComponent(
                  $.f.getSelection() || c.description || el.title || $.d.title
                );
              if (sticky) {
                log = "button_pinit_sticky";
              } else {
                log = "button_pinit_floating";
              }
            }

            $.s.hoverButton = $.f.make({
              SPAN: {
                className: buttonClass,
                "data-pin-log": log,
                "data-pin-href": href
              }
            });

            // add round=1 or tall=1 so we know on click
            if (x) {
              $.f.set($.s.hoverButton, "data-pin-x", x);
            }

            // save button? use translated string
            if (!c.round) {
              $.s.hoverButton.innerHTML = $.a.strings[c.lang].save;
            }

            // add ID if we're repinning
            if (c.id) {
              $.f.set($.s.hoverButton, "data-pin-id", c.id);
            }

            // log impressions after a button has actually rendered
            if (!$.v.hazLoggedHoverButton) {
              if (sticky) {
                $.f.log("&event=impression_sticky" + impressionLogExtras);
              } else {
                $.f.log("&event=impression_floating" + impressionLogExtras);
              }
              $.v.hazLoggedHoverButton = true;
            }

            // set height and position
            $.s.hoverButton.style.position = "absolute";
            $.s.hoverButton.style.top = p.top + $.a.hoverButtonOffsetTop + "px";
            $.s.hoverButton.style.left =
              p.left + $.a.hoverButtonOffsetLeft + "px";
            $.s.hoverButton.style.zIndex = "8675309";

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
            n = "0";
          } else {
            if (n > 999) {
              if (n < 1000000) {
                n = parseInt(n / 1000, 10) + "K+";
              } else {
                if (n < 1000000000) {
                  n = parseInt(n / 1000000, 10) + "M+";
                } else {
                  n = "++";
                }
              }
            }
          }
          n = n + "";
          return n;
        },

        // each kind of widget has its own structure
        structure: {
          buttonPin: function (r, options) {
            $.v.countButton = $.v.countButton + 1;
            var template, formatCount, formattedCount, sep;
            template = {
              className: "button_pin",
              log: options.log
            };

            if (options.id) {
              template.id = options.id;
            }
            if (options.log === "button_pinit") {
              template.tagName = "A";
              template.href =
                $.v.config.pinterest +
                "/pin/create/button/?guid=" +
                $.v.guid +
                "-" +
                $.v.countButton +
                "&url=" +
                encodeURIComponent(options.url) +
                "&media=" +
                encodeURIComponent(options.media) +
                "&description=" +
                encodeURIComponent(options.description);
            }
            if (options.log === "button_pinit_bookmarklet") {
              template.href = $.v.config.pinterest + "/pin/create/button/";
            }
            if (options.log === "button_pinit_repin") {
              template.href =
                $.v.config.pinterest +
                "/pin/" +
                options.id +
                "/repin/x/?guid=" +
                $.v.guid;
            } else {
              if (options.count) {
                // show count if positive, or configured to show above, or configured to show beside with data-pin-zero set
                if (
                  r.count ||
                  options.count === "above" ||
                  (options.count === "beside" && options.zero)
                ) {
                  formattedCount = $.f.formatCount(r.count);
                  template.className = template.className + " " + options.count;
                  // data-pin-x will log as an extra parameter when the button is clicked
                  template.x = formattedCount;
                  template.count = {
                    text: formattedCount,
                    // data-pin-x needed here too because counts are clickable
                    x: formattedCount
                  };
                }
              }
            }

            // round buttons require no innerHTML
            if (options.round) {
              template.className = template.className + " round";
            } else {
              // data-pin-save="false" gets a Pin It button
              // instead of data-pin-save="true" getting a Save button (breaking change, 20171003)
              if (options.save !== "false") {
                template.className = template.className + " save";
                template.text =
                  $.a.strings[options.lang].save ||
                  $.a.strings[$.v.config.lang].save;
              } else {
                // we're going to make an old-school Pin It button
                if (options.lang === "ja") {
                  template.className = template.className + " ja";
                }
                if (options.color === "red") {
                  template.className = template.className + " red";
                }
                if (options.color === "white") {
                  template.className = template.className + " white";
                }
              }
            }

            if (options.padded) {
              template.className = template.className + " padded";
            }
            if (options.tall) {
              template.className = template.className + " tall";
            }

            return $.f.buildOne(template);
          },
          buttonFollow: function (r, options) {
            var template = {
              className: "button_follow",
              log: "button_follow",
              text: r.name
            };
            if (options.tall) {
              template.className = template.className + " tall";
            }
            if (r.id.match(/\//)) {
              // found a forward-slash? follow a board
              template.href =
                $.v.config.pinterest + "/" + r.id + "/follow/?guid=" + $.v.guid;
            } else {
              // no forward-slash? follow a pinner
              template.href =
                $.v.config.pinterest +
                "/" +
                r.id +
                "/pins/follow/?guid=" +
                $.v.guid;
            }
            $.v.countFollow = $.v.countFollow + 1;
            return $.f.buildOne(template);
          },
          embedGrid: function (r, options) {
            var p,
              template,
              colHeight,
              i,
              pin,
              minValue,
              minIndex,
              j,
              buttonUrl,
              buttonLog,
              boardUrl,
              str,
              tt,
              labelClass,
              labelContent,
              profileUrl;
            if (r.data) {
              p = r.data;
              if (
                !options.columns ||
                options.columns < 1 ||
                options.columns > 10
              ) {
                options.columns = 5;
              }
              if (options.height < 200) {
                options.height = 340;
              }

              // profileUrl is not internationalized by API; fix inline
              profileUrl =
                $.v.config.pinterest +
                "/" +
                p.user.profile_url.split("pinterest.com/")[1];

              template = {
                className: "embed_grid c" + options.columns,
                log: "embed_grid",
                href: $.v.config.pinterest,
                hd: {
                  href: profileUrl,
                  img: {
                    backgroundImage: p.user.image_small_url.replace(
                      /30x30_/,
                      "60x60_"
                    )
                  },
                  pinner: {
                    text: p.user.full_name
                  }
                },
                bd: {
                  height: options.height - 110 + "px",
                  ct: []
                },
                ft: {
                  log: "embed_user_ft",
                  href: profileUrl + "pins/follow/?guid=" + $.v.guid,
                  button: {}
                }
              };

              if (options.noscroll) {
                template.className = template.className + " noscroll";
              }

              if (options.width) {
                template.width = options.width + "px";
              }

              // masonry layout
              colHeight = [];
              for (i = 0; i < options.columns; i = i + 1) {
                template.bd.ct.push({ col: [] });
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
                  img: {
                    href: $.v.config.pinterest + "/pin/" + pin.id,
                    backgroundImage: pin.images["237x"].url,
                    backgroundColor: pin.dominant_color,
                    paddingBottom:
                      (pin.images["237x"].height / pin.images["237x"].width) *
                        100 +
                      "%"
                  }
                });
                colHeight[minIndex] =
                  colHeight[minIndex] + pin.images["237x"].height;
              }
              // follow button
              if (p.board) {
                // it's a board
                template.className = template.className + " board";
                boardUrl = $.v.config.pinterest + p.board.url;
                template.hd.board = {
                  text: p.board.name,
                  href: boardUrl
                };
                buttonUrl = boardUrl + "follow/?guid=" + $.v.guid;
                if (r.data.section) {
                  template.hd.board = {
                    text: r.data.section.title,
                    href:
                      boardUrl +
                      r.theCall.split("/pins/")[0].split("/").pop() +
                      "/"
                  };
                  buttonLog = "embed_section_ft";
                  $.v.countSection = $.v.countSection + 1;
                } else {
                  buttonLog = "embed_board_ft";
                  template.ft.href = buttonUrl;
                  $.v.countBoard = $.v.countBoard + 1;
                }
              } else {
                // it's a profile
                buttonUrl = profileUrl + "pins/follow?guid=" + $.v.guid;
                buttonLog = "embed_user_ft";
                $.v.countProfile = $.v.countProfile + 1;
              }

              // follow button label
              str = $.a.strings[options.lang].followOn;
              tt = str.split("%s");

              // if class is "bottom" break text above button at narrow widths
              labelClass = "bottom";
              labelContent =
                '<span class="' +
                $.a.k +
                '_string" data-pin-href="' +
                buttonUrl +
                '" data-pin-log="' +
                buttonLog +
                '">' +
                tt[0] +
                '</span><span class="' +
                $.a.k +
                '_logo" data-pin-href="' +
                buttonUrl +
                '" data-pin-log="' +
                buttonLog +
                '"></span>';
              if (tt[0] === "") {
                // if class is "top" break text below button at narrow widths
                labelClass = "top";
                labelContent =
                  '<span class="' +
                  $.a.k +
                  '_logo" data-pin-href="' +
                  buttonUrl +
                  '" data-pin-log="' +
                  buttonLog +
                  '"></span><span class="' +
                  $.a.k +
                  '_string" data-pin-href="' +
                  buttonUrl +
                  '" data-pin-log="' +
                  buttonLog +
                  '">' +
                  tt[1] +
                  "</span>";
              }
              // render HTML outside of buildOne -- dangerous but necessary
              template.ft.button.label = {
                addClass: labelClass,
                text: labelContent
              };
              return $.f.buildOne(template);
            }
          },
          embedPin: function (r, options) {
            var i,
              j,
              p,
              t,
              pin,
              page,
              template,
              width = "",
              widthMod = "",
              fontMod,
              adjusted,
              myImages,
              sizeFix = {
                small: 1,
                medium: 345 / 237,
                large: 600 / 237
              };
            if (!options.width) {
              options.width = "small";
            }

            if (r.data && r.data[0]) {
              if (r.data[0].error) {
                // we can't build this Pin
                $.f.log(
                  "&event=api_error&code=embed_pin_not_found&pin_id=" +
                    r.data[0].id
                );
                return false;
              } else {
                // we're ready to build a Pin

                switch (options.width) {
                  case "large":
                    $.v.countPinLarge = $.v.countPinLarge + 1;
                    imgWidth = "600x";
                    width = " large";
                    widthMod = "_large";
                    fontMod = 1;
                    lineHeight = "1.11em";
                    break;
                  case "medium":
                    $.v.countPinMedium = $.v.countPinMedium + 1;
                    imgWidth = "345x";
                    width = " medium";
                    widthMod = "_medium";
                    fontMod = .8;
                    lineHeight = "1.23em";
                    break;
                  default:
                    $.v.countPin = $.v.countPin + 1;
                    imgWidth = "237x";
                    fontMod = .6;
                    lineHeight = "1.24em";
                }

                pin = r.data[0];
                var myDescription = (pin.description || {}).trim();
                template = {
                  href: "https://www.pinterest.com/pin/" + pin.id + "/",
                  addClass: "",
                  className: "embed_pin" + width,
                  id: pin.id,
                  log: "embed_pin",
                  pages: {
                    // default height for story pins
                    paddingBottom: "178%",
                    overlay: {
                      addClass: "",
                      // Pin It button
                      repin: {
                        // log a different value for button
                        log: "embed_pin_repin" + widthMod,
                        id: pin.id,
                        text: $.a.strings[options.lang].save
                      }
                    }
                  }
                };

                var seekTitle = function (pages) {
                  var p = pages || [];
                  for (var i = 0; i < p.length; i = i + 1) {
                    for (var j = 0; j < p[i].blocks.length; j = j + 1) {
                      if (p[i].blocks[j].type && p[i].blocks[j].text) {
                        if (p[i].blocks[j].type === "story_pin_heading_block") {
                          return p[i].blocks[j].text;
                        }
                      }
                    }
                  }
                  return null;
                };

                var makeStaticPin = function () {
                  // make an empty block
                  var block = {
                    height: "100%",
                    width: "100%",
                    image: {
                      height: "100%",
                      width: "100%",
                      addClass: "coverMe",
                      backgroundImage: pin.images["237x"].url.replace(
                        /\/236x\//,
                        "/" + imgWidth + "/"
                      )
                    }
                  }
                  // do we have a native video? Swap it in for the image
                  var videoList = ((pin.videos ||{}).video_list);
                  if (videoList) {
                    delete block.image;
                    block.video = {
                      addClass: "isNative",
                      m3u8: videoList.V_HLSV4.url,
                      mp4: videoList.V_720P.url,
                      poster: videoList.V_HLSV4.thumbnail || videoList.V_720P.thumbnail
                    }
                  }
                  // this is a static pin, so it will have one page with one block
                  template.pages = {
                    paddingBottom:
                      ~~(
                        (pin.images["237x"].height / pin.images["237x"].width) *
                        10000
                      ) /
                        100 +
                      "%",
                    page: {
                      blocks: {
                        block: block
                      }
                    },
                    // we've already rendered the overlay
                    overlay: template.pages.overlay
                  };
                  // add the controller and the className that will allow it to show
                  if (videoList) {
                    template.addClass = template.addClass + " hazVideo";
                    // we have a video on page 0, so add controls
                    template.pages.overlay.controls = {
                      pause: {
                        log: "embed_story_pause"
                      },
                      play: {
                        log: "embed_story_play"
                      }
                    };
                  }
                };

                // story pin versions we know about
                var knownStoryPinVersions = {
                  "0.1.0": true,
                  "0.3.0": true,
                  "0.4.0": true,
                  "0.7.0": true,
                  "0.8.0": true,
                  "0.9.0": true,
                  "0.10.0": true
                };

                // do we have a known story pin version and story pin data?
                if (
                  pin.story_pin_data &&
                  pin.story_pin_data.metadata &&
                  knownStoryPinVersions[pin.story_pin_data.metadata.version]
                ) {
                  var metadata = pin.story_pin_data.metadata;
                  $.f.debug(
                    "Story pin version: " + metadata.version + " ID: " + pin.id
                  );
                  // if we can tell it's a recipe, get rid of page 2
                  if (metadata.template_type === 1 && pin.story_pin_data.pages.length > 1) {
                    var vv = metadata.version.split('.');
                    if (vv[0] === '0') {
                      // if we're below 0.10, remove the second page
                      if (vv[1] && (vv[1] - 0) < 10) {
                        pin.story_pin_data.pages.splice(1, 1);
                      }
                    }
                  }
                  if (pin.story_pin_data.page_count) {
                    var progressIndicator = {};
                    if (pin.story_pin_data.page_count > 1) {
                      template.pages.overlay.forward_noop = {
                        addClass: "nav",
                        log: "embed_story_noop"
                      };
                      template.pages.overlay.forward = {
                        addClass: "nav",
                        log: "embed_story_forward"
                      };
                      template.pages.overlay.backward_noop = {
                        addClass: "nav",
                        log: "embed_story_noop"
                      };
                      template.pages.overlay.backward = {
                        addClass: "nav",
                        log: "embed_story_back"
                      };
                    }
                    // show the forward arrow
                    template.className = template.className + " atStart";
                    var pagesFound = 0;
                    for (
                      i = 0;
                      i < pin.story_pin_data.pages.length;
                      i = i + 1
                    ) {
                      page = pin.story_pin_data.pages[i];

                      t = {
                        addClass: "page "
                      };
                      // change this to block
                      if ((page.style || {}).background_color) {
                        t.backgroundColor = page.style.background_color;
                      }

                      canHazPage = false;

                      // 0.1.0
                      if (metadata.version === "0.1.0") {
                        canHazPage = true;
                        t.blocks = {
                          "0": {
                            addClass: "block",
                            height: "100%",
                            width: "100%"
                          }
                        };
                        if (page.image) {
                          t.blocks["0"].image = {
                            addClass: "containMe",
                            height: "100%",
                            width: "100%",
                            backgroundImage: page.image.images.originals.url.replace(
                              /\/originals\//,
                              "/" + imgWidth + "/"
                            ),
                            backgroundColor: page.image.dominant_color || "#888"
                          };
                        }
                        if (!i) {
                          // always stretch the cover image
                          t.blocks["0"].image.addClass = "coverMe";
                        }
                      }

                      // v0.3.0
                      if (metadata.version === "0.3.0") {
                        canHazPage = true;
                        t.blocks = {
                          "0": {
                            addClass: "block",
                            height: "100%",
                            width: "100%"
                          }
                        };
                        if (page.image) {
                          t.blocks["0"].image = {
                            addClass: "containMe",
                            height: "100%",
                            width: "100%",
                            backgroundImage: page.image.images[
                              "originals"
                            ].url.replace(
                              /\/originals\//,
                              "/" + imgWidth + "/"
                            ),
                            backgroundColor: page.image.dominant_color || "#888"
                          };
                          if (!i) {
                            // always stretch the cover image
                            t.blocks["0"].image.addClass = "coverMe";
                          }
                        } else {
                          if (page.video) {
                            var myVideo = page.video.video_list.V_HLSV3_MOBILE;
                            var hackMP4 = myVideo.url
                              .replace(/\/hls\//, "/720p/")
                              .replace(/\.m3u8/, ".mp4");
                            if (myVideo.url) {
                              t.blocks["0"].container = {
                                addClass: "video",
                                video: {
                                  height: "100%",
                                  width: "100%",
                                  mp4: hackMP4
                                }
                              };
                              t.addClass = t.addClass + "hazVideo ";
                            } else {
                              if (myVideo.thumbnail) {
                                t.blocks["0"].image = {
                                  height: "100%",
                                  width: "100%",
                                  backgroundImage: myVideo.thumbnail[
                                    "originals"
                                  ].url.replace(
                                    /\/originals\//,
                                    "/" + imgWidth + "/"
                                  )
                                };
                              }
                            }
                          }
                        }
                      }

                      // v0.4.0
                      if (metadata.version === "0.4.0") {
                        canHazPage = true;
                        t.blocks = {
                          "0": {
                            addClass: "block",
                            height: "100%",
                            width: "100%"
                          }
                        };
                        if (page.image) {
                          t.blocks["0"].image = {
                            addClass: "containMe",
                            height: "100%",
                            width: "100%",
                            backgroundImage: page.image.images[
                              "originals"
                            ].url.replace(
                              /\/originals\//,
                              "/" + imgWidth + "/"
                            ),
                            backgroundColor: page.image.dominant_color || "#888"
                          };
                          if (!i) {
                            // always stretch the cover image
                            t.blocks["0"].image.addClass = "coverMe";
                          }
                        } else {
                          if (page.video) {
                            var myVideo = page.video.video_list.V_HLSV3_MOBILE;
                            var hackMP4 = myVideo.url
                              .replace(/\/v2\/hls\//, "/720p/")
                              .replace(/_mobile\.m3u8/, ".mp4");
                            if (myVideo.url) {
                              t.blocks["0"].video = {
                                height: "100%",
                                width: "100%",
                                mp4: hackMP4
                              };
                              t.addClass = t.addClass + "hazVideo ";
                            } else {
                              if (myVideo.thumbnail) {
                                t.blocks["0"].image = {
                                  height: "100%",
                                  width: "100%",
                                  backgroundImage: myVideo.thumbnail[
                                    "originals"
                                  ].url.replace(
                                    /\/originals\//,
                                    "/" + imgWidth + "/"
                                  )
                                };
                              }
                            }
                          }
                        }
                      }

                      // v0.7.0
                      if (metadata.version === "0.7.0") {
                        // filter story pin supply block page
                        if (page.image_adjusted && page.image_adjusted.images) {
                          canHazPage = true;
                          t.blocks = {
                            "0": {
                              addClass: "block",
                              height: "100%",
                              width: "100%",
                              image: {
                                addClass: "containMe",
                                height: "100%",
                                width: "100%",
                                backgroundImage: page.image_adjusted.images[
                                  "originals"
                                ].url.replace(
                                  /\/originals\//,
                                  "/" + imgWidth + "/"
                                ),
                                backgroundColor:
                                  page.image_adjusted.dominant_color || "#888"
                              }
                            }
                          };
                          if (!i) {
                            // always stretch the cover image
                            t.blocks["0"].image.addClass = "coverMe";
                          }
                        }
                      }

                      // v0.8.0 and up
                      if (
                        metadata.version === "0.8.0" ||
                        metadata.version === "0.9.0" || 
                        metadata.version === "0.10.0"
                      ) {
                        canHazPage = true;
                        // it's a page we can build
                        if (page.blocks) {
                          t.blocks = {};
                          var blocksFound = 0;
                          for (j = 0; j < page.blocks.length; j = j + 1) {
                            var block = page.blocks[j];
                            var blockStyle = block.block_style;
                            var style = block.style || {};

                            if (blockStyle) {
                              var myBlock = {
                                addClass: "block",
                                top: blockStyle.y_coord + "%",
                                left: blockStyle.x_coord + "%",
                                height: blockStyle.height + "%",
                                width: blockStyle.width + "%"
                              };

                              if (style.font) {
                                // see if we need to add
                                var key = style.font.key;
                                if (!$.v.fonts[key]) {
                                  $.v.fonts[key] = {
                                    name: style.font.name,
                                    url: style.font.url
                                  };
                                  $.f.loadFont($.v.fonts[key]);
                                }
                                myBlock.fontFamily = style.font.name;
                              }

                              if (block.type === "story_pin_heading_block") {
                                block.backgroundColor = blockStyle.highlight_color;

                                // default values for text alignment
                                var vAlign = "top";
                                var hAlign = "left";

                                // horizontal alignment
                                if (style.alignment) {
                                  if (style.alignment === 1) {
                                    hAlign = "center";
                                  }
                                }

                                // vertical alignment
                                if (style.vertical_alignment) {
                                  if (style.vertical_alignment === 1) {
                                    vAlign = "middle";
                                  }
                                  if (style.vertical_alignment === 2) {
                                    vAlign = "bottom";
                                  }
                                }

                                // block is styled inline; container is 100% x 100% and aligns text vertically and horizontally
                                myBlock.container = {
                                  addClass: hAlign + " " + vAlign,
                                  paragraph: {
                                    // font size is set in CSS
                                    backgroundColor:
                                      style.highlight_color || "",
                                    color: style.hex_color || "",
                                    // some strings have multiple newlines; only supply one <br> for these
                                    text: block.text.replace(/(\n+)/g, "<br>")
                                  }
                                };
                              }

                              if (block.type === "story_pin_image_block") {
                                myBlock.height = blockStyle.height + "%";
                                myBlock.width = blockStyle.width + "%";
                                myBlock.image = {
                                  addClass: "containMe",
                                  height: "100%",
                                  width: "100%",
                                  backgroundImage: block.image.images[
                                    "originals"
                                  ].url.replace(
                                    /\/originals\//,
                                    "/" + imgWidth + "/"
                                  ),
                                  backgroundColor:
                                    block.image.dominant_color || "#888"
                                };
                                // partial-height blocks should cover their images instead of containing
                                if (blockStyle.height !== "100") {
                                  myBlock.image.addClass = "coverMe";
                                }
                              }

                              if (block.type === "story_pin_video_block") {
                                var mp4 = block.video.video_list.V_720P;
                                var hlsv4 = block.video.video_list.V_HLSV4;
                                // poster should show until video plays
                                var poster = block.video.video_list.V_720P.thumbnail || block.video.video_list.V_HLSV4.thumbnail;
                                if (mp4.url && hlsv4.url) {
                                  myBlock.container = {
                                    addClass: "video",
                                    video: {
                                      mp4: mp4.url,
                                      m3u8: hlsv4.url,
                                      poster: poster
                                    }
                                  };
                                  if (!i) {
                                    // we have a video on page 0, so add controls
                                    template.pages.overlay.controls = {
                                      pause: {
                                        log: "embed_story_pause"
                                      },
                                      play: {
                                        log: "embed_story_play"
                                      }
                                    }
                                  }
                                  t.addClass = t.addClass + "hazVideo ";
                                }
                              }

                              if (block.type === "story_pin_paragraph_block") {
                                block.backgroundColor =
                                  blockStyle.highlight_color;

                                // default values for text alignment
                                var vAlign = "top";
                                var hAlign = "left";

                                // horizontal alignment
                                if (style.alignment) {
                                  if (style.alignment === 1) {
                                    hAlign = "center";
                                  }
                                }

                                // vertical alignment
                                if (style.vertical_alignment) {
                                  if (style.vertical_alignment === 1) {
                                    vAlign = "middle";
                                  }
                                  if (style.vertical_alignment === 2) {
                                    vAlign = "bottom";
                                  }
                                }

                                // block is styled inline; container is 100% x 100% and aligns text vertically and horizontally
                                myBlock.container = {
                                  addClass: hAlign + " " + vAlign,
                                  paragraph: {
                                    backgroundColor:
                                      style.highlight_color || "",
                                    color: style.hex_color || "",
                                    // block.style.font_size is set for 450px width; fontMods are for 345 and 236
                                    fontSize:
                                      style.font_size * fontMod + "px",
                                    // lineHeight has been set in ems already
                                    lineHeight: lineHeight,
                                    // some strings have multiple newlines; only supply one <br> for these
                                    text: block.text.replace(/(\n+)/g, "<br>")
                                  }
                                };

                                // see if we have a hint that this may be a crowded block
                                if (style.font && style.font.min_size) {
                                  if (
                                    style.font.min_size <
                                    style.font_size - 1
                                  ) {
                                    // let's give ourselves some more horizontal space
                                    myBlock.left = "2%";
                                    myBlock.width = "96%";
                                  }
                                }
                              }
                              t.blocks["" + blocksFound] = myBlock;
                              blocksFound = blocksFound + 1;
                            }
                          }
                        }
                      }

                      if (canHazPage) {
                        template.pages["" + pagesFound] = t;
                        myProgress = {
                          addClass: "indicator"
                        };
                        if (!pagesFound) {
                          myProgress.addClass =
                            myProgress.addClass + " current";
                        }
                        progressIndicator["" + pagesFound] = myProgress;
                        if (pagesFound) {
                          t.addClass = t.addClass + "future ";
                        }
                        pagesFound = pagesFound + 1;
                      }
                    }
                    if (pagesFound) {
                      template.pages.overlay.progress = progressIndicator;
                    }
                  }
                } else {
                  makeStaticPin();
                }

                var myFooter, myTitle;
                // native pin
                if (pin.native_creator) {
                  // story pins 0.10.0 and up have a pin_title field
                  myTitle =
                    (((pin.story_pin_data || {}).metadata || {}).pin_title) ||
                    // dig through pages
                    seekTitle((pin.story_pin_data || {}).pages) ||
                    // when all else fails, fall back to about-this-creator line
                    pin.native_creator.about;
                    // replace all space-ish characters (including hard returns, soft returns, and tabs) with true spaces
                  myTitle = myTitle.replace(/\s/g, ' ')
                    // ... and then replace all multiple spaces with a single space
                    .replace(/  +/g, ' ');
                  myFooter = {
                    native: true,
                    url: pin.native_creator.profile_url,
                    // might be a story pin; might also be another kind of native pin
                    title: myTitle,
                    avatar: pin.native_creator.image_small_url,
                    credit: $.a.strings[options.lang].publishedBy,
                    name: pin.native_creator.full_name
                  };
                } else {
                  // rich pin
                  if (pin.rich_metadata) {
                    if (pin.rich_metadata.products) {
                      if (typeof pin.rich_metadata.products[0] === "object") {
                        if (
                          pin.rich_metadata.products[0].offer_summary &&
                          pin.rich_metadata.products[0].offer_summary.price
                        ) {
                          template.pages.overlay.price = {
                            text:
                              pin.rich_metadata.products[0].offer_summary.price,
                            log: "embed_pin_price"
                          };
                        }
                      }
                    }

                    myFooter = {
                      title: pin.rich_metadata.title,
                      avatar: pin.rich_metadata.favicon_images.orig,
                      credit: pin.rich_metadata.site_name,
                      name: myDescription
                    };
                    // authors are missing for rich pins
                    // if we can find the author from attribution, use it
                    if ((pin.attribution || {}).author_name) {
                      myFooter.credit = $.a.strings[options.lang]["by"].replace(
                        /%s/,
                        pin.attribution.author_name
                      );
                    }
                  } else {
                    // legacy pin
                    myFooter = {
                      href:
                        "https://www.pinterest.com/" + pin.pinner.profile_url,
                      title: myDescription,
                      avatar: pin.pinner.image_small_url,
                      credit: pin.pinner.full_name,
                      name: pin.board.name
                    };
                  }
                }

                template.footer = {
                  log: "embed_pin_follow",
                  href: myFooter.url,
                  container: {
                    title: {
                      text: myFooter.title
                    },
                    avatar: {
                      backgroundImage: myFooter.avatar
                    },
                    deets: {
                      topline: {
                        text: myFooter.credit
                      },
                      bottomline: {
                        text: myFooter.name
                      }
                    }
                  }
                };

                if (!template.footer.container.deets.bottomline.text) {
                  // hide the second line
                  template.footer.addClass = "uno";
                } else {
                  if (myFooter.native) {
                    // swap the boldface in the footer
                    template.footer.addClass = "native";
                  }
                }

                var built = $.f.buildOne(template);

                // add the "fresh" className, showing overlay until first mouse over
                $.f.changeClass(built, { fresh: true });

                // remove "fresh" className, hiding overlay after first mouse over
                $.f.listen(built, "mouseover", function () {
                  $.f.changeClass(built, { fresh: false });
                });

                $.f.set(built, "data-pin-current", "0");
                return built;
              }
            }
          }
        },

        getLegacy: {
          grid: function (a, o) {
            var scaleHeight = parseInt($.f.getData(a, "scale-height"));
            var scaleWidth = parseInt($.f.getData(a, "scale-width"));
            var boardWidth = parseInt($.f.getData(a, "board-width"));
            // don't force the board to be wider than the containing parent
            if (boardWidth > a.parentNode.offsetWidth) {
              boardWidth = "";
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
              zero: $.f.getData(a, "zero") || $.v.config.zero,
              pad: $.f.getData(a, "count-pad"),
              height: $.f.getData(a, "height"),
              shape: $.f.getData(a, "shape"),
              config: $.f.getData(a, "config"),
              // check for inline overrides
              tall: $.f.getData(a, "tall"),
              round: $.f.getData(a, "round"),
              // here we use $.f.get because it's count-layout, not data-pin-count-layout
              countLayout: $.f.get(a, "count-layout")
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
              if (c.config === "beside" || c.countLayout === "horizontal") {
                o.count = "beside";
              } else {
                if (c.config === "above" || c.countLayout === "vertical") {
                  o.count = "above";
                }
              }
            }

            // translate valid shapes into round = true
            if (c.shape === "round") {
              o.round = true;
            }

            // translate valid tall heights into tall = true
            if (c.height === "28" || c.height === "32") {
              o.tall = true;
            }

            // inline overrides
            if (c.tall) {
              o.tall = true;
              if (c.tall === "false") {
                o.tall = false;
              }
            }
            if (c.round) {
              o.round = true;
              if (c.round === "false") {
                o.round = false;
              }
            }
          }
        },

        seek: {
          buttonPin: function (a) {
            var p, o, k, cf;

            // community-generated standard: data-pin-do="none" means "don't render a button here"
            if ($.a.noneParam[$.f.getData(a, "do")] === true) {
              $.f.debug(
                'Found a link to pin create form with data-pin-do="none"'
              );
              return;
            }

            // can we parse the href and get url, media, and description?
            if (a.href) {
              p = $.f.parse(a.href, {
                url: true,
                media: true,
                description: true
              });
            }

            cf = $.f.getData(a, "custom");

            // get all the things
            o = {
              do: $.f.getData(a, "do"),
              id: $.f.getData(a, "id"),
              url: $.f.getData(a, "url") || p.url || $.v.here.url,
              media: $.f.getData(a, "media") || p.media,
              description: $.f.getData(a, "description") || p.description || $.d.title,
              custom: cf || $.v.config.custom,
              count: $.f.getData(a, "count") || $.v.config.count,
              color: $.f.getData(a, "color") || $.v.config.color,
              round: $.f.getData(a, "round") || $.v.config.round,
              tall: $.f.getData(a, "tall") || $.v.config.tall,
              lang: $.f.getLang($.f.getData(a, "lang") || $.v.config.lang || $.v.lang),
              save: $.f.getData(a, "save") || $.v.config.save
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
            if ($.v.config.save === "false") {
              $.v.log.pinit = 1;
            }

            // how to tell what kind of button we need to make
            if (o.media) {
              // it's a properly-configured Any Image button
              o.log = "button_pinit";
            } else {
              if (o.id) {
                // it's a repin button
                o.log = "button_pinit_repin";
              } else {
                // it's a bookmark button
                o.log = "button_pinit_bookmarklet";
              }
            }

            // custom button: remove href, listen for click
            if (o.custom) {
              // increment here so we count custom buttons
              $.v.countButton = $.v.countButton + 1;
              // remove href, prevent default behavior
              a.removeAttribute("href");
              // tell us what to log
              $.f.set(a, "data-pin-log", "button_pinit");
              // o.url, o.media, and o.description have already been parsed and set
              $.f.set(
                a,
                "data-pin-href",
                $.v.config.pinterest +
                  "/pin/create/button" +
                  "?guid=" +
                  $.v.guid +
                  "-" +
                  $.v.countButton +
                  "&url=" +
                  encodeURIComponent(o.url) +
                  "&media=" +
                  encodeURIComponent(o.media) +
                  "&description=" +
                  encodeURIComponent(o.description)
              );
              $.f.debug('Found a link with data-pin-custom="true"');
              $.f.debug(a);
              return;
            } else {
              $.f.getLegacy.buttonPin(a, o);
              k = false;
              if (o.count === "above" || o.count === "beside") {
                k = true;
                if (o.url) {
                  // get a count from the url argument
                  $.f.call(
                    $.a.endpoint.count.replace(/%s/, encodeURIComponent(o.url)),
                    function (r) {
                      $.f.replace(a, $.f.structure.buttonPin(r, o));
                    }
                  );
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
            if ($.f.getData(a, "custom")) {
              $.f.set(a, "data-pin-log", "button_pinit_bookmarklet");
              $.f.set(
                a,
                "data-pin-href",
                $.v.config.pinterest + "/pin/create/button/"
              );
              a.removeAttribute("href");
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
              custom: $.f.getData(a, "custom"),
              tall: $.f.getData(a, "tall"),
              lang: $.f.getLang($.f.getData(a, "lang") || $.v.config.lang || $.v.lang)
            };
            p = $.f.getPath(a.href);
            if (p.length) {
              r.name = a.textContent;
              r.id = p[0];
              // shall we follow a board?
              if (p[0] && p[1]) {
                r.id = p[0] + "/" + p[1];
              }
              if (o.custom) {
                if (r.id.match(/\//)) {
                  // found a forward-slash? follow a board
                  href =
                    $.v.config.pinterest +
                    "/" +
                    r.id +
                    "/follow/?guid=" +
                    $.v.guid;
                } else {
                  // no forward-slash? follow a pinner
                  href =
                    $.v.config.pinterest +
                    "/" +
                    r.id +
                    "/pins/follow/?guid=" +
                    $.v.guid;
                }
                $.f.set(a, "data-pin-href", href);
                $.f.set(a, "data-pin-log", "button_follow");
                $.w.setTimeout(function () {
                  a.removeAttribute("href");
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

            if (p[p.length - 1] === "") {
              p.pop();
            }
            // if we received an error from the Section level, so let's the Board
            if (sectionLevelError) {
              p.pop();
            }
            if (p.length > 1) {
              o = {
                columns: $.f.getData(a, "columns") || $.v.config.grid.columns,
                height: $.f.getData(a, "height") - 0 || $.v.config.grid.height,
                width: $.f.getData(a, "width") || null,
                noscroll: $.f.getData(a, "noscroll") || null,
                lang: $.f.getLang($.f.getData(a, "lang") || $.v.config.lang || $.v.lang)
              };

              // is it a Board?
              if (p.length === 2) {
                u = p[0] + "/" + p[1];
                boardOrSection = "board";
              }

              // is it a Section? and does the Section have value?
              if (p.length === 3 && p[2]) {
                u = p[0] + "/" + p[1] + "/" + p[2];
                boardOrSection = "section";
              }
              // there were no Pins in the Section or we received an error from the section so let's make a call to the Boards
              if (sectionLevelError) {
                boardOrSection = "board";
              }
              $.f.getLegacy.grid(a, o);
              bs = "";
              if ($.w.location.protocol === "https:") {
                bs = "&base_scheme=https";
              }
              $.f.call(
                $.a.endpoint[boardOrSection].replace(/%s/, u) +
                  "?sub=" +
                  $.v.sub +
                  bs,
                function (r) {
                  if (r.status === "success") {
                    if (boardOrSection === "board") {
                      $.f.replace(a, $.f.structure.embedGrid(r, o));
                    }
                    if (boardOrSection === "section") {
                      if (r.data.pins.length) {
                        // we found Pins in the Section
                        $.f.replace(a, $.f.structure.embedGrid(r, o));
                      } else {
                        // we have a Section, but the Section has no Pins, so let's show the Board level
                        $.f.seek.embedBoard(a, href, true);
                      }
                    }
                  }

                  if (r.status === "failure") {
                    if (boardOrSection === "board") {
                      // Board does not exist - do nothing
                    }
                    if (boardOrSection === "section") {
                      // API returned an error when checking for the Section level i.e. Section does not exist, so let's show the Board level if it exists
                      $.f.seek.embedBoard(a, href, true);
                    }
                  }
                }
              );
            }
          },
          embedUser: function (a, href) {
            var p, o, bs;
            p = $.f.getPath(href);
            if (p.length) {
              o = {
                columns: $.f.getData(a, "columns") || $.v.config.grid.columns,
                height: $.f.getData(a, "height") - 0 || $.v.config.grid.height,
                width: $.f.getData(a, "width") || null,
                noscroll: $.f.getData(a, "noscroll") || null,
                lang: $.f.getLang($.f.getData(a, "lang") || $.v.config.lang || $.v.lang)
              };
              $.f.getLegacy.grid(a, o);
              bs = "";
              if ($.w.location.protocol === "https:") {
                bs = "&base_scheme=https";
              }
              $.f.call(
                $.a.endpoint.user.replace(/%s/, p[0]) + "?sub=" + $.v.sub + bs,
                function (r) {
                  $.f.replace(a, $.f.structure.embedGrid(r, o));
                }
              );
            }
          },
          embedPin: function (a) {
            var p, o, bs;
            p = $.f.getPath(a.href);
            if (p.length) {
              // carry on embedding a regular Pin
              o = {
                width: $.f.getData(a, "width") || null,
                terse: $.f.getData(a, "terse") || null,
                lang: $.f.getLang($.f.getData(a, "lang") || $.v.config.lang || $.v.lang),
                endpoint: $.a.endpoint.pin,
                // any value passed to internal will set it
                internal: $.f.getData(a, "internal") || null,
              };
              // are we trying to connect to an internal endpoint?
              if (o.internal === 'true') {
                o.endpoint = 'https://api.pinadmin.com/internal/pins/info/';
              }
              bs = "";
              if ($.w.location.protocol === "https:") {
                bs = "&base_scheme=https";
              }
              $.f.call(
                o.endpoint + "?pin_ids=" + p[1] + "&sub=" + $.v.sub + bs,
                function (r) {
                  $.f.replace(a, $.f.structure.embedPin(r, o));
                }
              );
            }
          }
        },
        // return the path part of a Pinterest URL
        getPath: function (url) {
          // remove hash and query, then split into path components
          var path = url.split("#")[0].split("?")[0].split("/");
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
          t = el.getElementsByTagName("A");
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
              doThis = $.f.getData(a[i], "do");
              // does data-pin-do correspond to a function we're ready to run?
              if (typeof $.f.seek[doThis] === "function") {
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
              if ($.f.getData(a[i], "custom")) {
                $.f.seek.buttonPin(a[i]);
                continue;
              }
            }
          }
        },

        exposeUtil: function () {
          // expose all util functions
          var util = ($.w[$.v.config.util] = $.f.util);
          // expose build function
          if ($.v.config.build) {
            $.f.debug("exposing $.f.build as " + $.v.config.build);
            util.build = $.w[$.v.config.build];
          } else {
            $.f.debug("exposing $.f.build at " + $.v.config.util + ".build");
            util.build = $.f.build;
          }
        },

        // find and apply configuration requests from surrounding page, plus those passed as data attributes on SCRIPT tag
        config: function () {
          var script = $.d.getElementsByTagName("SCRIPT"),
            i,
            j,
            n,
            p;

          // get all config params by finding data-pin- attributes on pinit.js
          for (i = script.length - 1; i > -1; i = i - 1) {
            // is it us?
            if (
              $.a.me &&
              script[i] &&
              script[i].src &&
              script[i].src.match($.a.me)
            ) {
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
              $.f.debug(
                $.v.config.lang +
                  " not found in valid languages, changing back to " +
                  $.v.lang
              );
              $.v.config.lang = $.v.lang;
            }
          } else {
            $.v.config.lang = $.v.lang;
          }

          // build utility
          if (typeof $.v.config.build === "string") {
            $.w[$.v.config.build] = function (el) {
              $.f.build(el);
            };
          }

          // filter user-specified logging tag
          if ($.v.config.tag) {
            $.v.config.tag = $.v.config.tag
              .replace(/[^a-zA-Z0-9_]/g, "")
              .substr(0, 32);
          }

          // global Pinterest URL will be used in most places; we will have to update URLs we get from API endpoints in widgets
          $.v.config.pinterest = "https://" + $.v.sub + ".pinterest.com";

          // wait one second and then send a logging ping
          $.w.setTimeout(function () {
            var str =
              "&event=init&sub=" +
              $.v.sub +
              "&button_count=" +
              $.v.countButton +
              "&follow_count=" +
              $.v.countFollow +
              "&pin_count=" +
              $.v.countPin;
            if ($.v.canHazHoverButtons) {
              str = str + "&button_hover=1";
            }
            if ($.v.canHazStickyButtons) {
              str = str + "&button_sticky=1";
            }
            if ($.v.countPinMedium) {
              str = str + "&pin_count_medium=" + $.v.countPinMedium;
            }
            if ($.v.countPinLarge) {
              str = str + "&pin_count_large=" + $.v.countPinLarge;
            }
            if ($.v.log.customGlobal) {
              str = str + "&custom_global=1";
            }
            if ($.v.log.customLocal) {
              str = str + "&custom_local=1";
            }
            // someone has expressly asked for Pin It buttons by setting save=false
            if ($.v.log.pinit) {
              str = str + "&pinit_flag=1";
            }
            str =
              str +
              "&profile_count=" +
              $.v.countProfile +
              "&board_count=" +
              $.v.countBoard +
              "&section_count=" +
              $.v.countSection;
            // were we called by pinit.js?
            if (
              typeof $.w["PIN_" + ~~(new Date().getTime() / 86400000)] !==
              "number"
            ) {
              str = str + "&xload=1";
            }
            str = str + "&lang=" + $.v.config.lang;
            // log window.navigator.language
            if ($.n.language) {
              str = str + "&nvl=" + $.n.language;
            }
            $.f.log(str);
          }, 1000);
        },

        // given a possible source of strings, set $.v.lang to the best match
        getLang: function (input) {
          var t, i, lang = $.a.lang, langloc;
          // did somebody hand us a non-string?
          if (typeof input !== "string") {
            input = lang;
          }
          // clean and split
          t = input.toLowerCase();
          // any non-alphanumeric character becomes a space
          t = t.replace(/[^a-z0-9]/g, " ");
          // strip leading and trailing spaces
          t = t.replace(/^\s+|\s+$/g, "");
          // collapse multiple spaces
          t = t.replace(/\s+/g, " ");
          // split on space; now we have ["en"] or ["en", "uk"] or ["bs", "latn", "ba"]
          t = t.split(" ");
          // init to English
          if (t.length) {
            // do we support the base language?
            if ($.a.strings[t[0]]) {
              lang = t[0];
              // if there's anything left we may have a lang-loc like pt-br
              if (t.length) {
                // pop the locale off the end to catch three-parters
                langloc = lang + "-" + t[t.length - 1];
                // do we support lang+loc
                if ($.a.strings[langloc]) {
                  lang = langloc;
                }
              }
            }
          }
          return lang;
        },

        // should this element be allowed a hovering or sticky Save button?
        canHazButton: function (el) {
          var src,
            r = false;
          // is the candidate element an image?
          if (el && el.tagName && el.tagName === "IMG") {
            // check for data-pin-media first, then src attribute
            src = $.f.getData(el, "media") || el.src;
            // do we have source?
            if (src) {
              // can source be crawled by our back end?
              if (src.match(/^https?:\/\//)) {
                // do we have data-pin-no-hover (canonical) or data-pin-nohover (community-generated)
                if (
                  !$.f.getData(el, "no-hover") &&
                  !$.f.getData(el, "nohover")
                ) {
                  // do we have data-pin-nopin (canonical) or data-nopin (community-generated)?
                  if (!$.f.getData(el, "nopin") && !$.f.get(el, "data-nopin")) {
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
            el = $.d.elementFromPoint(o.x, o.y);
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
            var i,
              x,
              el,
              delta,
              key = {},
              found = [],
              showMe,
              imageMidX,
              best = $.w.innerWidth;
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
                imageMidX = found[i].rect.x + found[i].rect.width / 2;
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
            $.f.listen($.w, "touchstart", function (e) {
              // knowing X will help us guess the right image later
              $.v.sticky.touchX = ~~e.touches[0].clientX;
              $.v.sticky.hazTouch = true;
            });
            $.f.listen($.w, "touchend", function (e) {
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

        // set global $.v.here to the scrubbed version of pin:url, canonical URL, og:url, or document.URL
        getHere: function () {
          var i,
            link = $.d.getElementsByTagName("LINK"), canonicalUrl = '',
            meta = $.d.getElementsByTagName("META"), pinUrl = '', ogUrl = '',
            scrub = function(input) {
              var i, j, param, keyval, foundForbiddenKey = false, query = '', separator = '?',
                // remove anything after the hash and then split into path and query at the ?
                part = input.url.split('#')[0].split('?');
              // do we have a query?
              if (part[1]) {
                // split query into key/value pairs
                param = part[1].split('&');
                // check each param
                for (i = 0; i < param.length; i = i + 1) {
                  // split pair into key and value
                  keyval = param[i].split('=');
                  // check if we have exactly two
                  if (keyval.length === 2) {
                    // check each bad key pattern
                    for (j = 0; j < $.a.forbiddenQueryKey.length; j = j + 1) {
                      // does the name matches a forbiddenQueryKey pattern?
                      if (keyval[0].match($.a.forbiddenQueryKey[j])) {
                        // set the bad flag
                        foundForbiddenKey = true;
                        // quit checking
                        break;
                      }
                    }
                    // if the parameter name does not match one of our bad parameters, add it to the query
                    if (!foundForbiddenKey) {
                      // append separator, key, equals, and value
                      query = query + separator + keyval[0] + '=' + keyval[1];
                      // change separator to '&' for second and subsequent parameters
                      separator = '&';
                    }
                  }
                }
              }
              // part[0] contains scheme, domain, and path
              return ({
                // reassemble path and scrubbed query
                url: part[0] + query,
                // echo back the source we gave
                src: input.src,
                // mod will be true if we found at least one forbidden key
                mod: foundForbiddenKey
              });
            },
            // default what we're going to return to the scrubbed version of document.URL
            here = scrub({
              url: $.d.URL,
              src: 'doc'
            });
          // find first pin:url or og:url
          for (i = 0; i < meta.length; i = i + 1) {
            value = meta[i].getAttribute("content");
            if (value) {
              // get the property or name
              key = meta[i].getAttribute("name");
              if (key) {
                if (!pinUrl && key.toLowerCase() === "pin:url") {
                  pinUrl = value;
                }
                if (!ogUrl && key.toLowerCase() === "og:url") {
                  ogUrl = value;
                }
              }
            }
          }
          // find first link with canonical URL
          for (i = 0; i < link.length; i = i + 1) {
            if (link[i].rel && link[i].rel.toLowerCase() === "canonical" && link[i].href) {
              canonicalUrl = link[i].href;
              break;
            }
          }
          // if found, return the scrubbed version of pin:url, canonical URL, or og:url
          if (pinUrl) {
            here = scrub({
              url: pinUrl,
              src: 'pin'
            });
          } else {
            if (canonicalUrl) {
               here = scrub({
                url: canonicalUrl,
                src: 'canonical'
              });
            } else {
              if (ogUrl) {
                here = scrub({
                  url: ogUrl,
                  src: 'og'
                });
              }
            }
          }
          return here;
        },

        init: function () {
          var i,
            t,
            dq = false;

          $.d.b = $.d.getElementsByTagName("BODY")[0];
          $.d.h = $.d.getElementsByTagName("HEAD")[0];
          $.v = {
            // 11-19-2020: collapsing all subdomains to www; may revisit later
            sub: "www",
            fonts: {},
            guid: "",
            css: "",
            config: {
              debug: false,
              util: "PinUtils",
              grid: {
                height: 400,
                columns: 3
              }
            },
            userAgent: $.w.navigator.userAgent,
            countButton: 0,
            countFollow: 0,
            countPin: 0,
            countPinMedium: 0,
            countPinLarge: 0,
            countBoard: 0,
            countSection: 0,
            countProfile: 0,
            log: {
              customGlobal: 0,
              customLocal: 0,
              save: 0
            },
            here: $.f.getHere(),
            // getLang will default to $.a.lang (en) if it can't find window.navigator.language
            lang: $.f.getLang($.w.navigator.language)
          };

          // make a 12-digit base-60 number for conversion tracking
          for (i = 0; i < 12; i = i + 1) {
            $.v.guid =
              $.v.guid +
              "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz".substr(
                Math.floor(Math.random() * 60),
                1
              );
          }

          // got IE?
          if ($.v.userAgent.match(/MSIE/) !== null) {
            $.v.hazIE = true;
            // got very old IE?
            if ($.v.userAgent.match(/MSIE [5-8]/)) {
              dq = true;
              $.f.log(
                "&event=oldie_error&ua=" + encodeURIComponent($.v.userAgent)
              );
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
            $.f.listen($.d.b, "click", $.f.click);

            if (typeof $.w.ontouchstart === "object") {
              // story pins should always show nav affordances and Save button
              $.v.hazMobile = true;
            }

            // do we need to show hoverbuttons?
            if (
              $.v.config.hover
            ) {
              if ($.v.config.hover !== "false") {
                $.f.debug("hover: allowed per config");
                $.v.canHazHoverButtons = true;
                // add one to button count for logging purposes
                $.v.countButton = $.v.countButton + 1;
                // we set this so our browser extensions know not to render hoverbuttons
                $.d.b.setAttribute("data-pin-hover", true);
                // on mouse over, check to see if this image should show a hoverbutton
                $.f.listen($.d.b, "mouseover", $.f.over);
                // check for explicit opt-out via data-pin-sticky="false" on pinit.js
                if ($.v.config.sticky !== "false") {
                  $.f.debug("sticky: allowed per config");
                  // only run sticky buttons if we're on a mobile device
                  if ($.v.hazMobile) {
                    // sticky buttons init
                    $.f.debug("sticky: initing");
                    $.f.sticky.init();
                  } else {
                    $.f.debug("sticky: ontouchstart not found");
                  }
                } else {
                  $.f.debug("sticky: forbidden by config");
                }
              } else {
                $.f.debug("hover: forbidden by config");
              }
            }

            // expose utility functions
            $.f.exposeUtil();

            // pause all of our videos if this window is blurred
            $.f.listen($.w, "blur", function (e) {
              var videos = $.d.getElementsByTagName('VIDEO');
              for (var i = 0; i < videos.length; i = i + 1) {
                if (videos[i].className === $.a.k + "_video") {
                  videos[i].pause();
                  // hide all pause controls
                  var pause = $.d.getElementsByClassName($.a.k + "_pause");
                  for (var j = 0; j < pause.length; j = j + 1) {
                    pause[j].style.display = "none";
                  }
                  // show all play controls
                  var play = $.d.getElementsByClassName($.a.k + "_play");
                  for (var j = 0; j < play.length; j = j + 1) {
                    play[j].style.display = "block";
                  }
                }
              }
            });
          }
        }
      };
    })()
  });
  $.f.init();
})(window, document, navigator, {
  k: "PIN_" + new Date().getTime(),
  // version for logging
  tv: "2021031501",
  // we'll look for scripts whose source matches this, and extract config parameters
  me: /pinit\.js$/,
  // pinterest domain regex
  myDomain: /^https?:\/\/(([a-z]{1,3})\.)?pinterest\.([a-z]{0,2}\.)?([a-z]{1,3})/,
  noneParam: {
    ignore: true,
    none: true,
    nothing: true
  },
  forbiddenQueryKey: [
    /password/gi
  ],
  // valid config parameters that may be passed as data-pin-* with your call to pinit.js
  configParam: [
    // set to "true" to show sticky Save buttons on mobile devices
    "sticky",
    // set to "false" to show static Save buttons (breaking change, 20171003)
    "save",
    // set to "true" to show hoverbuttons, "false" to force off
    "hover",
    // set to "red" or "white" to override gray Pin It button
    "color",
    // override language ("ja" only for Pin It button; any key in $.a.str for other widgets)
    "lang",
    // use custom HTML+CSS for your Pin It buttons
    "custom",
    // set to "true" to render tall Pin It buttons
    "tall",
    // set to "round" to render round red Pin It buttons -- caution: overrides all other shapes and colors
    "round",
    // set to "above" or "beside" to show pin counts in rectangular Pin It buttons
    "count",
    // set to "true" to remove descriptions from embedded pin widgets
    "zero",
    // set to "true" to render zero counts where data-pin-count="beside"
    "terse",
    // set to "true" to see debugging messages in console
    "debug",
    // the string you'd like us to add to our logging calls (32 characters max, alphanumeric + underscore only)
    "tag",
    // the global function to run when you want to re-scan the DOM or a portion of it for new widgets
    "build",
    // the global function to run when we find an error
    "error",
    // the global function to add our internal utilities, like $.f.pinOne
    "util",
    // legacy parameter for Pin It button height (please use data-pin-tall="true" instead)
    "height",
    // legacy parameter for Pin It button shape (please use data-pin-round="true" instead)
    "shape",
    // containing page's suggestion for referrer
    "here"
  ],
  sticky: {
    // initialization values
    pageY: 0,
    hazChange: false,
    hazTouch: false,
    // shall we automatically run on load?
    runOnLoad: true,
    // wait this long between observation checks
    obsDelay: 100,
    // vertical center line
    scanAt: 3
  },
  // smallest image for which we will show a hoverbutton
  hoverButtonMinImgSize: 119,
  // top and left offsets for hoverbuttons
  hoverButtonOffsetTop: 10,
  hoverButtonOffsetLeft: 10,
  // our data attribute namespace
  dataAttributePrefix: "data-pin-",
  // endpoints on Pinterest
  endpoint: {
    pinterest: "https://www.pinterest.com",
    bookmark: "https://assets.pinterest.com/js/pinmarklet.js",
    count: "https://widgets.pinterest.com/v1/urls/count.json?url=%s",
    pin: "https://widgets.pinterest.com/v3/pidgets/pins/info/",
    board: "https://widgets.pinterest.com/v3/pidgets/boards/%s/pins/",
    section: "https://widgets.pinterest.com/v3/pidgets/sections/%s/pins/",
    user: "https://widgets.pinterest.com/v3/pidgets/users/%s/pins/",
    log: "https://log.pinterest.com/"
  },
  // paths (append to $.v.config.pinterest)
  path: {
    repin: "/pin/%s/repin/x/",
    create: "/pin/create/button/?"
  },
  // pop-up window params
  pop: {
    base:
      "status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,%dim%,left=0,top=0",
    // swap %dim% for these
    size: "width=800,height=900"
  },
  // attributes we're allowed to change when building widgets from templates
  build: {
    setStyle: {
      display: true,
      top: true,
      left: true,
      backgroundImage: true,
      backgroundColor: true,
      height: true,
      width: true,
      paddingBottom: true,
      fontFamily: true,
      textAlign: true,
      color: true,
      fontSize: true,
      display: true
    },
    setData: {
      href: true,
      id: true,
      log: true,
      x: true
    }
  },
  // on click, if data-pin-log is this, run function $.f.util[that]
  util: {
    embed_story_play: "control",
    embed_story_pause: "control",
    embed_story_noop: "noop",
    embed_story_forward: "navigate",
    embed_story_back: "navigate",
    embed_pin_repin: "repin",
    embed_pin_repin_small: "repin",
    embed_pin_repin_medium: "repin",
    embed_pin_repin_large: "repin",
    button_pinit: "pinOne",
    button_pinit_floating: "pinOne",
    button_pinit_sticky: "pinOne",
    button_pinit_bookmarklet: "pinAny",
    button_follow: "follow",
    embed_board_ft: "follow",
    embed_user_ft: "follow",
    embed_section_ft: "follow",
    repin: "repin",
    button_pinit_repin: "repin",
    button_pinit_floating_repin: "repinHoverButton",
    button_pinit_sticky_repin: "repinHoverButton",
    embed_pin: "open"
  },
  // default language (English)
  lang: "en",
  // translated strings - replace %s with the Pinterest logotype
  strings: {
    // English
    en: {
      // call to action for grid widgets - %s is replaced by the Pinterest logotype
      followOn: "Follow On %s",
      // credit line for attribute media from places like Flickr or YouTube - %s is replace by the author's name
      by: "by %s",
      // Save button text
      save: "Save",
      // credit line for native content - new string, need for all other languages!
      publishedBy: "Published by"
    },
    // Czech
    cs: {
      followOn: "Sledovat na %s",
      by: "od %s",
      save: "Uložit",
      publishedBy: "Publikoval/a"
    },
    // Danish
    da: {
      followOn: "Følg på %s",
      by: "fra %s",
      save: "Gem",
      publishedBy: "Offentliggjort af"
    },
    // German
    de: {
      followOn: "Auf %s folgen",
      by: "von %s",
      save: "Merken",
      publishedBy: "Veröffentlicht von"
    },
    // Greek
    el: {
      followOn: "Ακολουθήστε στο %s",
      by: "από %s",
      save: "Αποθήκευση",
      publishedBy: "Δημοσιεύτηκε από"
    },
    // Latin American Spanish
    es: {
      followOn: "Seguir en %s",
      by: "por %s",
      save: "Guardar",
      publishedBy: "Publicado por"
    },
    // Spanish
    "es-es": {
      followOn: "Seguir en %s",
      by: "de %s",
      save: "Guardar",
      publishedBy: "Publicado por"
    },
    // Finnish
    fi: {
      followOn: "Seuraa täällä: %s",
      by: "%s",
      save: "Tallenna",
      publishedBy: "Julkaisija:"
    },
    // French
    fr: {
      followOn: "Suivre sur %s",
      by: "par %s",
      save: "Enregistrer",
      publishedBy: "Publiée par"
    },
    // Hindi
    hi: {
      followOn: "%s पर फ़ॉलो करें",
      by: "%s की ओर से",
      save: "सेव करें",
      publishedBy: "प्रकाशक:"
    },
    // Hungarian
    hu: {
      followOn: "Kövesd itt: %s",
      by: "tőle: %s",
      save: "Mentés",
      publishedBy: "Közzétette:"
    },
    // Indonesian
    id: {
      followOn: "Ikuti di %s",
      by: "oleh %s",
      save: "Simpan",
      publishedBy: "Diterbitkan oleh"
    },
    // Italian
    it: {
      followOn: "Segui su %s",
      by: "di %s",
      save: "Salva",
      publishedBy: "Pubblicato da"
    },
    // Japanese
    ja: {
      followOn: "%s でフォロー",
      by: "撮影者：%s",
      save: "保存",
      publishedBy: "投稿者："
    },
    // Korean
    ko: {
      followOn: "%s 에서 팔로우",
      by: "%s 이(가) 핀함",
      save: "저장",
      publishedBy: "게시자:"
    },
    // Malay
    ms: {
      followOn: "Ikuti Di %s",
      by: "oleh %s",
      save: "Simpan",
      publishedBy: "Diterbitkan oleh"
    },
    // Norwegian
    nb: {
      followOn: "Følg dette på %s",
      by: "av %s",
      save: "Lagre",
      publishedBy: "Publisert av"
    },
    // Dutch
    nl: {
      followOn: "Volgen op %s",
      by: "van %s",
      save: "Bewaren",
      publishedBy: "Gepubliceerd door"
    },
    // Polish
    pl: {
      followOn: "Obserwuj na %s",
      by: "autor: %s",
      save: "Zapisz",
      publishedBy: "Opublikowane przez:"
    },
    // Portuguese
    pt: {
      followOn: "Segue no %s",
      by: "por %s",
      save: "Guardar",
      publishedBy: "Publicado por"
    },
    // Portuguese (Brazil)
    "pt-br": {
      followOn: "Siga no %s",
      by: "de %s",
      save: "Salvar",
      publishedBy: "Publicado por"
    },
    // Romanian
    ro: {
      followOn: "Urmărește pe %s",
      by: "de %s",
      save: "Salvează",
      publishedBy: "Publicat de"
    },
    // Russian
    ru: {
      followOn: "Подписаться в %s",
      by: "пользователем %s",
      save: "Сохранить",
      publishedBy: "Автор:"
    },
    // Slovak
    sk: {
      followOn: "Sledujte na %s",
      by: "Autor: %s",
      save: "Uložiť",
      publishedBy: "Zverejnil:"
    },
    // Swedish
    sv: {
      followOn: "Följ på %s",
      by: "av %s",
      save: "Spara",
      publishedBy: "Publicerad av"
    },
    // Tagalog
    tl: {
      followOn: "I-follow Sa %s",
      by: "ni %s",
      save: "I-save",
      publishedBy: "Na-published ni"
    },
    // Thai
    th: {
      followOn: "ติดตามใน %s",
      by: "โดย %s",
      save: "บันทึก",
      publishedBy: "เผยแพร่โดย"
    },
    // Turkish
    tr: {
      followOn: "%s üzerinde takip et",
      by: "%s tarafından",
      save: "Kaydet",
      publishedBy: "Yayınlayan"
    },
    // Ukrainian
    uk: {
      followOn: "Підписатися в %s",
      by: "користувачем %s",
      save: "Зберегти",
      publishedBy: "Автор:"
    },
    // Vietnamese
    vi: {
      followOn: "Theo dõi trên %s",
      by: "Tác giả: %s",
      save: "Lưu",
      publishedBy: "Phát hành bởi:"
    }
  },
  // paths, sizes, and colors for SVGs
  svg: {
    // play button for videos on the front pages of story pins
    pause: {
      w: "24",
      h: "24",
      p: [
        {
          f: "fff",
          d:
            "M7 0c1.65 0 3 1.35 3 3v18c0 1.65-1.35 3-3 3s-3-1.35-3-3V3c0-1.65 1.35-3 3-3zm10 0c1.65 0 3 1.35 3 3v18c0 1.65-1.35 3-3 3s-3-1.35-3-3V3c0-1.65 1.35-3 3-3z"
        }
      ]
    },
    // play button for videos on the front pages of story pins
    play: {
      w: "24",
      h: "24",
      p: [
        {
          f: "fff",
          d:
            "M22.62 9.48L8.63.48A3 3 0 0 0 4 3v18a3 3 0 0 0 4.63 2.52l14-9a3 3 0 0 0 0-5.04"
        }
      ]
    },
    // forward button for story pins
    forward: {
      w: "24",
      h: "24",
      p: [
        {
          f: "fff",
          s: "aaa",
          w: ".5",
          d:
            "M6.72 24c.57 0 1.14-.22 1.57-.66L19.5 12 8.29.66c-.86-.88-2.27-.88-3.14 0-.87.88-.87 2.3 0 3.18L13.21 12l-8.06 8.16c-.87.88-.87 2.3 0 3.18.43.44 1 .66 1.57.66"
        }
      ]
    },
    // backward button for story pins
    backward: {
      w: "24",
      h: "24",
      p: [
        {
          f: "fff",
          s: "aaa",
          w: ".5",
          d:
            "M17.28 24c-.57 0-1.14-.22-1.58-.66L4.5 12 15.7.66a2.21 2.21 0 0 1 3.15 0c.87.88.87 2.3 0 3.18L10.79 12l8.06 8.16c.87.88.87 2.3 0 3.18-.44.44-1 .66-1.57.66"
        }
      ]
    },
    // pin count bubble; shows above
    above: {
      w: "114",
      h: "76",
      p: [
        {
          s: "b5b5b5",
          f: "fff",
          d:
            "M9 1C4.6 1 1 4.6 1 9v43c0 4.3 3.6 8 8 8h26l18 15h7.5l16-15H105c4.4 0 8-3.7 8-8V9c0-4.4-3.6-8-8-8H9z"
        }
      ]
    },
    // pin count bubble; shows to the right
    beside: {
      w: "126",
      h: "56",
      // side bubble needs a bit of space inside to successfully show the outline all the way around
      x1: "2",
      y1: "0",
      x2: "130",
      y2: "60",
      p: [
        {
          s: "b5b5b5",
          f: "fff",
          d:
            "M119.6 2c4.5 0 8 3.6 8 8v40c0 4.4-3.5 8-8 8H23.3L1.6 32.4v-4.6L23.3 2h96.3z"
        }
      ]
    },
    // round Pinterest logo for round Pin It buttons and Follow buttons
    logo: {
      w: "30",
      h: "30",
      x1: "-1",
      y1: "-1",
      x2: "31",
      y2: "31",
      // logo has two shapes: white background and red foreground
      p: [
        {
          // 1px white stroke
          s: "fff",
          w: "1",
          f: "fff",
          d:
            "M29.449,14.662 C29.449,22.722 22.868,29.256 14.75,29.256 C6.632,29.256 0.051,22.722 0.051,14.662 C0.051,6.601 6.632,0.067 14.75,0.067 C22.868,0.067 29.449,6.601 29.449,14.662"
        },
        {
          // the P
          f: "e60023",
          d:
            "M14.733,1.686 C7.516,1.686 1.665,7.495 1.665,14.662 C1.665,20.159 5.109,24.854 9.97,26.744 C9.856,25.718 9.753,24.143 10.016,23.022 C10.253,22.01 11.548,16.572 11.548,16.572 C11.548,16.572 11.157,15.795 11.157,14.646 C11.157,12.842 12.211,11.495 13.522,11.495 C14.637,11.495 15.175,12.326 15.175,13.323 C15.175,14.436 14.462,16.1 14.093,17.643 C13.785,18.935 14.745,19.988 16.028,19.988 C18.351,19.988 20.136,17.556 20.136,14.046 C20.136,10.939 17.888,8.767 14.678,8.767 C10.959,8.767 8.777,11.536 8.777,14.398 C8.777,15.513 9.21,16.709 9.749,17.359 C9.856,17.488 9.872,17.6 9.84,17.731 C9.741,18.141 9.52,19.023 9.477,19.203 C9.42,19.44 9.288,19.491 9.04,19.376 C7.408,18.622 6.387,16.252 6.387,14.349 C6.387,10.256 9.383,6.497 15.022,6.497 C19.555,6.497 23.078,9.705 23.078,13.991 C23.078,18.463 20.239,22.062 16.297,22.062 C14.973,22.062 13.728,21.379 13.302,20.572 C13.302,20.572 12.647,23.05 12.488,23.657 C12.193,24.784 11.396,26.196 10.863,27.058 C12.086,27.434 13.386,27.637 14.733,27.637 C21.95,27.637 27.801,21.828 27.801,14.662 C27.801,7.495 21.95,1.686 14.733,1.686"
        }
      ]
    },
    // full Pinterest logotype for grid footer buttons
    lockup: {
      w: "50",
      h: "12",
      x1: "0",
      y1: "0",
      x2: "50",
      y2: "12",
      p: [
        {
          f: "e60023",
          d:
            "M19.69,9.28 L19.69,4.28 L21.27,4.28 L21.27,9.28 L19.69,9.28 Z M5.97,0.00 C9.27,0.00 11.95,2.69 11.95,6.00 C11.95,9.31 9.27,12.00 5.97,12.00 C5.38,12.00 4.80,11.91 4.26,11.75 C4.26,11.75 4.26,11.75 4.26,11.75 C4.25,11.75 4.24,11.74 4.23,11.74 L4.21,11.73 C4.21,11.73 4.21,11.73 4.21,11.73 C4.45,11.33 4.81,10.68 4.95,10.16 C5.02,9.88 5.32,8.73 5.32,8.73 C5.52,9.11 6.08,9.42 6.69,9.42 C8.49,9.42 9.79,7.76 9.79,5.69 C9.79,3.71 8.18,2.23 6.11,2.23 C3.53,2.23 2.16,3.96 2.16,5.86 C2.16,6.74 2.63,7.83 3.37,8.18 C3.49,8.23 3.55,8.21 3.57,8.10 C3.59,8.02 3.69,7.61 3.74,7.42 C3.75,7.36 3.75,7.31 3.70,7.25 C3.45,6.95 3.25,6.39 3.25,5.88 C3.25,4.55 4.25,3.27 5.95,3.27 C7.42,3.27 8.45,4.28 8.45,5.71 C8.45,7.34 7.63,8.46 6.57,8.46 C5.98,8.46 5.54,7.98 5.68,7.38 C5.85,6.67 6.18,5.90 6.18,5.38 C6.18,4.92 5.93,4.54 5.42,4.54 C4.82,4.54 4.34,5.16 4.34,5.99 C4.34,6.52 4.52,6.88 4.52,6.88 C4.52,6.88 3.93,9.40 3.82,9.87 C3.70,10.38 3.75,11.11 3.80,11.59 L3.80,11.59 C3.79,11.59 3.78,11.58 3.78,11.58 C3.77,11.58 3.76,11.58 3.76,11.57 C3.76,11.57 3.76,11.57 3.76,11.57 C1.56,10.69 0.00,8.53 0.00,6.00 C0.00,2.69 2.67,0.00 5.97,0.00 Z M16.87,2.31 C17.71,2.31 18.34,2.54 18.76,2.95 C19.21,3.37 19.46,3.96 19.46,4.66 C19.46,6.00 18.54,6.95 17.11,6.95 L15.72,6.95 L15.72,9.28 L14.12,9.28 L14.12,2.31 L16.87,2.31 Z M16.94,5.58 C17.56,5.58 17.91,5.21 17.91,4.65 C17.91,4.10 17.55,3.76 16.94,3.76 L15.72,3.76 L15.72,5.58 L16.94,5.58 Z M50.00,5.28 L49.19,5.28 L49.19,7.62 C49.19,8.01 49.40,8.11 49.74,8.11 C49.83,8.11 49.93,8.10 50.00,8.10 L50.00,9.28 C49.84,9.31 49.58,9.33 49.22,9.33 C48.30,9.33 47.64,9.03 47.64,7.96 L47.64,5.28 L47.16,5.28 L47.16,4.28 L47.64,4.28 L47.64,2.70 L49.19,2.70 L49.19,4.28 L50.00,4.28 L50.00,5.28 Z M45.31,6.13 C46.18,6.27 47.21,6.50 47.21,7.77 C47.21,8.87 46.25,9.43 44.95,9.43 C43.55,9.43 42.65,8.81 42.54,7.78 L44.05,7.78 C44.15,8.20 44.46,8.40 44.94,8.40 C45.42,8.40 45.72,8.22 45.72,7.90 C45.72,7.45 45.12,7.40 44.46,7.29 C43.59,7.14 42.67,6.91 42.67,5.74 C42.67,4.68 43.64,4.14 44.82,4.14 C46.22,4.14 46.98,4.75 47.06,5.74 L45.60,5.74 C45.54,5.29 45.24,5.15 44.80,5.15 C44.42,5.15 44.12,5.30 44.12,5.61 C44.12,5.96 44.68,6.01 45.31,6.13 Z M20.48,2.00 C21.00,2.00 21.43,2.42 21.43,2.95 C21.43,3.48 21.00,3.90 20.48,3.90 C19.95,3.90 19.53,3.48 19.53,2.95 C19.53,2.42 19.95,2.00 20.48,2.00 Z M28.48,7.62 C28.48,8.01 28.70,8.11 29.04,8.11 C29.10,8.11 29.18,8.10 29.24,8.10 L29.24,9.29 C29.08,9.31 28.83,9.33 28.52,9.33 C27.60,9.33 26.94,9.03 26.94,7.96 L26.94,5.28 L26.42,5.28 L26.42,4.28 L26.94,4.28 L26.94,2.70 L28.48,2.70 L28.48,4.28 L29.24,4.28 L29.24,5.28 L28.48,5.28 L28.48,7.62 Z M24.69,4.14 C25.77,4.14 26.41,4.92 26.41,6.03 L26.41,9.28 L24.83,9.28 L24.83,6.35 C24.83,5.82 24.57,5.46 24.05,5.46 C23.53,5.46 23.18,5.90 23.18,6.52 L23.18,9.28 L21.60,9.28 L21.60,4.28 L23.12,4.28 L23.12,4.97 L23.15,4.97 C23.52,4.43 24.00,4.14 24.69,4.14 Z M33.42,4.76 C32.99,4.37 32.43,4.14 31.72,4.14 C30.20,4.14 29.16,5.28 29.16,6.77 C29.16,8.28 30.17,9.42 31.81,9.42 C32.44,9.42 32.95,9.26 33.37,8.96 C33.80,8.66 34.10,8.23 34.20,7.78 L32.66,7.78 C32.52,8.10 32.25,8.28 31.83,8.28 C31.18,8.28 30.81,7.86 30.72,7.19 L34.29,7.19 C34.30,6.18 34.01,5.31 33.42,4.76 L33.42,4.76 Z M41.66,4.76 C42.26,5.31 42.55,6.18 42.54,7.19 L38.97,7.19 C39.06,7.86 39.43,8.28 40.08,8.28 C40.50,8.28 40.77,8.10 40.91,7.78 L42.45,7.78 C42.34,8.23 42.05,8.66 41.62,8.96 C41.20,9.26 40.69,9.42 40.06,9.42 C38.42,9.42 37.41,8.28 37.41,6.77 C37.41,5.28 38.45,4.14 39.97,4.14 C40.67,4.14 41.24,4.37 41.66,4.76 Z M30.73,6.24 C30.83,5.65 31.14,5.27 31.75,5.27 C32.26,5.27 32.63,5.65 32.69,6.24 L30.73,6.24 Z M38.98,6.24 L40.94,6.24 C40.88,5.65 40.51,5.27 40.00,5.27 C39.39,5.27 39.08,5.65 38.98,6.24 Z M37.54,4.21 L37.54,5.60 C36.64,5.51 36.07,5.99 36.07,7.03 L36.07,9.28 L34.48,9.28 L34.48,4.28 L36.00,4.28 L36.00,5.06 L36.03,5.06 C36.38,4.47 36.78,4.21 37.39,4.21 C37.45,4.21 37.50,4.21 37.54,4.21 Z"
        }
      ]
    },
    // Pin It logotype, English
    pinit_en: {
      w: "42",
      h: "18",
      p: [
        {
          f: "e60023",
          d:
            "M16.853,6.345 C17.632,6.345 18.38,5.702 18.51,4.909 C18.664,4.138 18.135,3.494 17.357,3.494 C16.578,3.494 15.83,4.138 15.698,4.909 C15.546,5.702 16.053,6.345 16.853,6.345 Z M7.458,0 C2.5,0 0,3.522 0,6.459 C0,8.237 0.68,9.819 2.137,10.409 C2.376,10.505 2.59,10.412 2.66,10.15 C2.708,9.969 2.822,9.511 2.873,9.32 C2.943,9.061 2.916,8.97 2.723,8.744 C2.302,8.253 2.034,7.617 2.034,6.716 C2.034,4.104 4.007,1.765 7.172,1.765 C9.975,1.765 11.514,3.461 11.514,5.726 C11.514,8.708 10.183,11.18 8.206,11.18 C7.114,11.18 6.297,10.329 6.559,9.233 C6.872,7.922 7.48,6.509 7.48,5.564 C7.48,4.717 7.022,4.011 6.072,4.011 C4.956,4.011 4.06,5.155 4.06,6.687 C4.06,7.663 4.393,8.323 4.393,8.323 C4.393,8.323 3.251,13.117 3.051,13.957 C2.652,15.629 2.991,17.679 3.019,17.886 C3.036,18.009 3.195,18.038 3.267,17.946 C3.37,17.812 4.7,16.187 5.151,14.562 C5.279,14.102 5.885,11.72 5.885,11.72 C6.248,12.406 7.308,13.009 8.435,13.009 C11.79,13.009 14.066,9.979 14.066,5.923 C14.066,2.857 11.444,0 7.458,0 Z M26.896,14.189 C26.348,14.189 26.117,13.915 26.117,13.328 C26.117,12.404 27.035,10.091 27.035,9.041 C27.035,7.638 26.276,6.826 24.72,6.826 C23.739,6.826 22.722,7.453 22.291,8.003 C22.291,8.003 22.422,7.553 22.467,7.38 C22.515,7.196 22.415,6.884 22.173,6.884 L20.651,6.884 C20.328,6.884 20.238,7.055 20.191,7.244 C20.172,7.32 19.624,9.584 19.098,11.632 C18.738,13.034 17.863,14.205 16.928,14.205 C16.447,14.205 16.233,13.906 16.233,13.399 C16.233,12.959 16.519,11.877 16.86,10.534 C17.276,8.898 17.642,7.551 17.681,7.394 C17.732,7.192 17.642,7.017 17.379,7.017 L15.849,7.017 C15.572,7.017 15.473,7.161 15.414,7.361 C15.414,7.361 14.983,8.977 14.527,10.775 C14.196,12.079 13.83,13.409 13.83,14.034 C13.83,15.148 14.336,15.944 15.724,15.944 C16.796,15.944 17.644,15.45 18.292,14.764 C18.197,15.135 18.136,15.414 18.13,15.439 C18.074,15.65 18.142,15.838 18.394,15.838 L19.961,15.838 C20.233,15.838 20.337,15.73 20.394,15.494 C20.449,15.269 21.619,10.667 21.619,10.667 C21.928,9.443 22.692,8.632 23.768,8.632 C24.279,8.632 24.72,8.967 24.669,9.618 C24.612,10.333 23.741,12.903 23.741,14.031 C23.741,14.884 24.06,15.945 25.683,15.945 C26.789,15.945 27.603,15.464 28.195,14.786 L27.489,13.941 C27.311,14.094 27.114,14.189 26.896,14.189 Z M41.701,6.873 L40.134,6.873 C40.134,6.873 40.856,4.109 40.873,4.035 C40.942,3.745 40.698,3.578 40.441,3.631 C40.441,3.631 39.23,3.866 39.005,3.913 C38.779,3.958 38.604,4.081 38.522,4.403 C38.512,4.445 37.88,6.873 37.88,6.873 L36.622,6.873 C36.385,6.873 36.245,6.968 36.192,7.188 C36.115,7.504 35.975,8.145 35.936,8.297 C35.885,8.494 36,8.644 36.222,8.644 L37.457,8.644 C37.448,8.677 37.064,10.125 36.725,11.521 L36.724,11.516 C36.72,11.532 36.716,11.546 36.712,11.562 L36.712,11.556 C36.712,11.556 36.708,11.571 36.702,11.598 C36.324,12.968 35.118,14.209 34.201,14.209 C33.721,14.209 33.506,13.909 33.506,13.402 C33.506,12.963 33.792,11.88 34.134,10.537 C34.549,8.901 34.915,7.555 34.955,7.397 C35.006,7.196 34.915,7.02 34.652,7.02 L33.122,7.02 C32.845,7.02 32.746,7.164 32.687,7.364 C32.687,7.364 32.257,8.98 31.8,10.778 C31.469,12.083 31.103,13.412 31.103,14.037 C31.103,15.151 31.609,15.948 32.997,15.948 C34.07,15.948 35.136,15.453 35.783,14.767 C35.783,14.767 36.011,14.521 36.23,14.229 C36.241,14.581 36.324,14.837 36.411,15.018 C36.458,15.119 36.515,15.215 36.581,15.303 C36.582,15.304 36.583,15.306 36.585,15.308 L36.585,15.308 C36.891,15.713 37.398,15.962 38.151,15.962 C39.894,15.962 40.944,14.938 41.562,13.909 L40.704,13.239 C40.333,13.774 39.839,14.175 39.324,14.175 C38.846,14.175 38.579,13.878 38.579,13.372 C38.579,12.935 38.889,11.868 39.229,10.53 C39.344,10.083 39.516,9.401 39.708,8.644 L41.302,8.644 C41.539,8.644 41.678,8.549 41.732,8.329 C41.808,8.012 41.948,7.372 41.988,7.221 C42.039,7.023 41.923,6.873 41.701,6.873 Z M34.126,6.348 C34.905,6.348 35.653,5.706 35.783,4.912 C35.937,4.141 35.409,3.498 34.63,3.498 C33.851,3.498 33.103,4.141 32.971,4.912 C32.819,5.706 33.326,6.348 34.126,6.348 Z"
        }
      ]
    },
    // Pin It logotype, Japanese
    pinit_ja: {
      w: "41",
      h: "18",
      p: [
        {
          f: "e60023",
          d:
            "M19.822,7.173 C19.822,6.51 19.835,6.276 19.887,5.964 L18.145,5.964 C18.197,6.289 18.197,6.497 18.197,7.16 L18.21,13.192 C18.21,13.946 18.223,14.167 18.249,14.388 C18.327,15.025 18.522,15.441 18.886,15.714 C19.393,16.104 20.29,16.273 21.928,16.273 C22.721,16.273 24.359,16.195 25.126,16.117 C26.504,15.987 26.569,15.974 26.842,15.974 L26.764,14.245 C26.192,14.414 25.906,14.479 25.282,14.557 C24.333,14.687 23.137,14.765 22.266,14.765 C21.005,14.765 20.264,14.648 20.043,14.427 C19.861,14.245 19.809,13.959 19.809,13.231 C19.809,13.179 19.809,13.101 19.822,13.023 L19.822,11.307 C21.993,10.904 24.008,10.228 25.932,9.24 L26.27,9.071 C26.374,9.019 26.4,9.006 26.543,8.954 L25.503,7.485 C24.658,8.278 21.785,9.435 19.822,9.799 L19.822,7.173 Z M27.31,4.872 C26.491,4.872 25.815,5.548 25.815,6.367 C25.815,7.199 26.491,7.875 27.31,7.875 C28.142,7.875 28.818,7.199 28.818,6.367 C28.818,5.548 28.142,4.872 27.31,4.872 L27.31,4.872 Z M27.31,5.522 C27.791,5.522 28.168,5.899 28.168,6.367 C28.168,6.835 27.791,7.225 27.31,7.225 C26.842,7.225 26.465,6.835 26.465,6.367 C26.465,5.899 26.842,5.522 27.31,5.522 L27.31,5.522 Z M30.586,7.654 C31.795,8.33 32.861,9.188 33.901,10.293 L35.019,8.876 C34.018,7.927 33.212,7.329 31.665,6.367 L30.586,7.654 Z M31.041,16.234 C31.34,16.13 31.379,16.117 31.899,16.013 C33.914,15.584 35.526,14.947 36.852,14.063 C38.633,12.88 39.868,11.346 40.973,8.967 C40.31,8.499 40.102,8.304 39.595,7.693 C39.205,8.746 38.841,9.461 38.269,10.293 C37.242,11.775 36.033,12.776 34.408,13.478 C33.225,13.998 31.678,14.375 30.56,14.44 L31.041,16.234 Z M7.458,0 C2.5,0 0,3.522 0,6.459 C0,8.237 0.68,9.819 2.137,10.409 C2.376,10.505 2.59,10.412 2.66,10.15 C2.708,9.969 2.822,9.511 2.873,9.32 C2.943,9.061 2.916,8.97 2.723,8.744 C2.302,8.253 2.034,7.617 2.034,6.716 C2.034,4.104 4.007,1.765 7.172,1.765 C9.975,1.765 11.514,3.461 11.514,5.726 C11.514,8.708 10.183,11.18 8.206,11.18 C7.114,11.18 6.297,10.329 6.559,9.233 C6.872,7.922 7.48,6.509 7.48,5.564 C7.48,4.717 7.022,4.011 6.072,4.011 C4.956,4.011 4.06,5.155 4.06,6.687 C4.06,7.663 4.393,8.323 4.393,8.323 C4.393,8.323 3.251,13.117 3.051,13.957 C2.652,15.629 2.991,17.679 3.019,17.886 C3.036,18.009 3.195,18.038 3.267,17.946 C3.37,17.812 4.7,16.187 5.151,14.562 C5.279,14.102 5.885,11.72 5.885,11.72 C6.248,12.406 7.308,13.009 8.435,13.009 C11.79,13.009 14.066,9.979 14.066,5.923 C14.066,2.857 11.444,0 7.458,0 Z"
        }
      ]
    }
  },
  // a Sass-like object that compiles into an inline stylesheet
  styles: {
    "span._embed_grid": {
      width: "100%",
      "max-width": 237 + 20 + "px",
      "min-width": 60 * 2 + 20 + "px",
      display: "inline-block",
      border: "1px solid rgba(0,0,0,.1)",
      "border-radius": "%widgetBorderRadius%",
      overflow: "hidden",
      font: '12px "Helvetica Neue", Helvetica, arial, sans-serif',
      color: "rgb(54, 54, 54)",
      "box-sizing": "border-box",
      background: "#fff",
      cursor: "pointer",
      "%prefix%font-smoothing": "antialiased",
      "*": {
        display: "block",
        position: "relative",
        font: "inherit",
        cursor: "inherit",
        color: "inherit",
        "box-sizing": "inherit",
        margin: "0",
        padding: "0",
        "text-align": "left"
      },
      "._hd": {
        height: "55px",
        "._img": {
          position: "absolute",
          top: "10px",
          left: "10px",
          height: "36px",
          width: "36px",
          "border-radius": "18px",
          background: "transparent url () 0 0 no-repeat",
          "background-size": "cover"
        },
        "._pinner": {
          "white-space": "nowrap",
          overflow: "hidden",
          "text-overflow": "ellipsis",
          width: "75%",
          position: "absolute",
          top: "20px",
          left: "56px",
          "font-size": "14px",
          "font-weight": "bold"
        }
      },
      "._bd": {
        padding: "0 10px",
        "-moz-scrollbars": "none",
        "-ms-overflow-style": "none",
        "overflow-x": "hidden",
        "overflow-y": "auto",
        "._ct": {
          width: "100%",
          height: "auto",
          "._col": {
            display: "inline-block",
            width: "100%",
            padding: "1px",
            "vertical-align": "top",
            "min-width": "60px",
            "._img": {
              margin: "0",
              display: "inline-block",
              width: "100%",
              background: "transparent url() 0 0 no-repeat",
              "background-size": "cover",
              // "box-shadow": "inset 0 0 1px #000",
              "border-radius": "8px"
            }
          }
        }
      },
      "._ft": {
        padding: "10px",
        "._button": {
          "border-radius": "16px",
          "text-align": "center",
          "background-color": "#efefef",
          border: "1px solid #efefef",
          position: "relative",
          display: "block",
          overflow: "hidden",
          height: "32px",
          width: "100%",
          "min-width": "70px",
          padding: "0 3px",
          "._label": {
            position: "absolute",
            left: "0",
            width: "100%",
            "text-align": "center",
            "&._top": {
              top: "0"
            },
            "&._bottom": {
              bottom: "0"
            },
            "._string": {
              "white-space": "pre",
              color: "#746d6a",
              "font-size": "13px",
              "font-weight": "bold",
              "vertical-align": "top",
              display: "inline-block",
              height: "32px",
              "line-height": "32px"
            },
            "._logo": {
              display: "inline-block",
              "vertical-align": "bottom",
              height: "32px",
              width: "80px",
              background: "transparent url(%lockup%) 50% 50% no-repeat",
              "background-size": "contain"
            }
          },
          "&:hover": {
            border: "1px solid rgba(0,0,0,.1)",
          }
        }
      },
      "&._noscroll ._bd": {
        overflow: "hidden"
      },
      "&._board": {
        "._hd": {
          "._pinner": {
            top: "10px"
          },
          "._board": {
            "white-space": "nowrap",
            overflow: "hidden",
            "text-overflow": "ellipsis",
            width: "75%",
            position: "absolute",
            bottom: "10px",
            left: "56px",
            color: "#363636",
            "font-size": "12px"
          }
        }
      },
      // other layouts
      "&._c2": {
        "max-width": 237 * 2 + 20 + "px",
        "min-width": 60 * 2 + 20 + "px",
        "._bd ._ct ._col": { width: "50%" }
      },
      "&._c3": {
        "max-width": 237 * 3 + 20 + "px",
        "min-width": 60 * 3 + 20 + "px",
        "._bd ._ct ._col": { width: "33.33%" }
      },
      "&._c4": {
        "max-width": 237 * 4 + 20 + "px",
        "min-width": 60 * 4 + 20 + "px",
        "._bd ._ct ._col": { width: "25%" }
      },
      "&._c5": {
        "max-width": 237 * 5 + 20 + "px",
        "min-width": 60 * 5 + 20 + "px",
        "._bd ._ct ._col": { width: "20%" }
      },
      "&._c6": {
        "max-width": 237 * 6 + 20 + "px",
        "min-width": 60 * 6 + 20 + "px",
        "._bd ._ct ._col": { width: "16.66%" }
      },
      "&._c7": {
        "max-width": 237 * 7 + 20 + "px",
        "min-width": 60 * 7 + 20 + "px",
        "._bd ._ct ._col": { width: "14.28%" }
      },
      "&._c8": {
        "max-width": 237 * 8 + 20 + "px",
        "min-width": 60 * 8 + 20 + "px",
        "._bd ._ct ._col": { width: "12.5%" }
      },
      "&._c9": {
        "max-width": 237 * 9 + 20 + "px",
        "min-width": 60 * 9 + 20 + "px",
        "._bd ._ct ._col": { width: "11.11%" }
      },
      "&._c10": {
        "max-width": 237 * 10 + 20 + "px",
        "min-width": 60 * 10 + 20 + "px",
        "._bd ._ct ._col": { width: "10%" }
      }
    },
    "span._embed_pin": {
      // change further down for medium and large widgets
      "min-width": "160px",
      "max-width": "236px",
      // push for largest possible width within constraint of max-width
      width: "100%",
      "border-radius": "16px",
      font: '12px "SF Pro", "Helvetica Neue", Helvetica, arial, sans-serif',
      // universal
      display: "inline-block",
      background: "rgba(0,0,0,.1)",
      overflow: "hidden",
      border: "1px solid rgba(0,0,0,.1)",
      // must be in place to be inherited for proper box model
      "box-sizing": "border-box",
      // fix some Firefox issues with display fonts
      "%prefix%font-smoothing": "antialiased",
      "%prefix%osx-font-smoothing": "grayscale",
      // all children inherit
      "*": {
        display: "block",
        position: "relative",
        font: "inherit",
        cursor: "inherit",
        color: "inherit",
        "box-sizing": "inherit",
        margin: "0",
        padding: "0",
        "text-align": "left"
      },
      // main container for all pages
      "._pages": {
        height: "100%",
        width: "100%",
        display: "block",
        position: "relative",
        overflow: "hidden",
        // each page has its own container
        "._page": {
          position: "absolute",
          // left will be overriden by past/future positioning
          left: "0",
          // page-turning animation
          "transition-property": "left",
          "transition-duration": ".25s",
          "transition-timing-function": "ease-in",
          // inherit height and width from parent
          height: "inherit",
          width: "inherit",
          // we have already seen this page; it's to the left
          "&._past": {
            left: "-100%"
          },
          // we have yet to see this page; it's to the right
          "&._future": {
            left: "100%"
          },
          // each page has a container for one or more blocks
          "._blocks": {
            // inherit height and width from page
            height: "inherit",
            width: "inherit",
            // pin 66217057010794733 has images that render at greater than 100% wide
            overflow: "hidden",
            // blocks default to one per page
            "._block": {
              position: "absolute",
              // this may be be overriden inline along with top
              height: "100%",
              // width is always 100%
              width: "100%",
              // in case our contents poke out to the sides
              overflowX: "hidden",
              // a container block for text
              "._container": {
                position: "absolute",
                // width must be 100% or centering won't work
                width: "100%",
                // vertical alignment
                "&._top": {
                  top: "0"
                },
                "&._middle": {
                  top: "50%",
                  transform: "translateY(-50%)"
                },
                "&._bottom": {
                  bottom: "0"
                },
                // horizontal alignment
                "&._left": {
                  "text-align": "left"
                },
                "&._center": {
                  "text-align": "center"
                },
                "&._right": {
                  "text-align": "right"
                },
                // text formatting
                "._paragraph": {
                  // set above in container
                  "text-align": "inherit",
                  // block level won't show highlighted text
                  display: "inline",
                  // break long lines into word-like things
                  "word-break": "break-word",
                  // small font formatting; overriden below in &_medium and &_large
                  "font-size": "16px",
                  "line-height": "1.24em",
                  // border radius and padding for "highlighted" text
                  "border-radius": "3px",
                  padding: "0.1em 0.2em"
                },
                // the actual video tag
                _video: {
                  position: "absolute",
                  height: "100%",
                  width: "auto",
                  // center all videos
                  left: "50%",
                  transform: "translateX(-50%)",
                },
                // video container needs to be 100% to allow video full spread
                "&._video": {
                  height: "100%"
                }
              },
              "._image": {
                // images should always take the full size of their parent blocks
                position: "absolute",
                height: "100%",
                width: "100%",
                "background-position": "50% 50%",
                "background-repeat": "no-repeat",
                "&._containMe": {
                  "background-size": "contain"
                },
                "&._coverMe": {
                  "background-size": "cover"
                }
              },
              // note: this is a VIDEO tag, not a SPAN
              video: {
                position: "absolute",
                height: "100%",
                width: "auto",
                // center all videos
                left: "50%",
                transform: "translateX(-50%)",
                // native videos are always 100% x 100%
                "&._isNative": {
                  width: "100%"
                }
              }
            }
          }
        },
        // translucent overlay showing nav, repin, and progress elements
        "._overlay": {
          position: "absolute",
          height: "100%",
          width: "100%",
          opacity: ".001",
          background: "rgba(0,0,0,.03)",
          cursor: "pointer",
          "user-select": "none",
          "._repin": {
            position: "absolute",
            top: "12px",
            right: "12px",
            height: "40px",
            color: "#fff",
            background: "%saveButtonBackgroundColor% url(%logo%) 10px 50% no-repeat",
            "background-size": "18px 18px",
            "text-indent": "36px",
            "font-size": "14px",
            "line-height": "40px",
            "font-weight": "bold",
            "border-radius": "20px",
            padding: "0 12px 0 0",
            width: "auto",
            "z-index": "2"
          },
          "._price": {
            position: "absolute",
            top: "12px",
            left: "12px",
            height: "40px",
            background: "rgba(255,255,255,.9)",
            "font-size": "14px",
            "line-height": "40px",
            "font-weight": "bold",
            "border-radius": "20px",
            padding: "0 12px",
            width: "auto",
            "z-index": "2"
          },
          "._controls": {
            position: "absolute",
            height: "64px",
            width: "64px",
            top: "50%",
            left: "50%",
            "margin-top": "-32px",
            "margin-left": "-32px",
            "._play": {
              background: "rgba(0,0,0,.8) url(%play%) 50% 50% no-repeat",
            },
            "._pause": {
              background: "rgba(0,0,0,.8) url(%pause%) 50% 50% no-repeat",
            },
            "._pause, ._play": {
              position: "absolute",
              display: "block",
              height: "64px",
              width: "64px",
              "border-radius": "32px"
            }
          },
          "._nav": {
            "user-select": "none",
            position: "absolute",
            height: "100%",
            width: "20%",
            background: "transparent url() 0 0 no-repeat",
            "background-size": "24px 24px",
            "z-index": "1",
            "&._forward, &._forward_noop": {
              right: "0"
            },
            "&._backward, &._backward_noop": {
              left: "0"
            },
            "&._forward": {
              "background-image": "url(%forward%)",
              // set background image to right edge
              "background-position": "100% 50%"
            },
            "&._backward": {
              "background-image": "url(%backward%)",
              // set background image to left edge
              "background-position": "0 50%"
            }
          },
          "._progress": {
            position: "absolute",
            bottom: "0",
            left: "0",
            height: "36px",
            width: "100%",
            background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.2))",
            "text-align": "center",
            "._indicator": {
              display: "inline-block",
              height: "8px",
              width: "8px",
              margin: "16px 2px 0",
              background: "rgba(255,255,255,.5)",
              "border-radius": "50%",
              "&._current": {
                background: "#fff"
              }
            }
          },
          "&:hover": {
            opacity: "1"
          }
        }
      },
      "._footer": {
        position: "relative",
        display: "block",
        height: "96px",
        padding: "16px",
        color: "#333",
        background: "#fff",
        "._container": {
          // container element allows us to position contents by padding the parent element
          position: "relative",
          display: "block",
          width: "100%",
          height: "100%",
          background: "#fff",
          "._title": {
            // absolute positioning with zero left and right gets us overflow: ellipsis without specifying explicit width
            position: "absolute",
            left: "0px",
            right: "0px",
            "font-size": "16px",
            "font-weight": "bold",
            // text breaks with ellipsis
            overflow: "hidden",
            "white-space": "pre",
            "text-overflow": "ellipsis"
          },
          "._avatar": {
            position: "absolute",
            bottom: "0",
            left: "0",
            height: "30px",
            width: "30px",
            // make it a circle
            "border-radius": "50%",
            // url to be set inline
            background: "transparent url() 0 0 no-repeat",
            // in case we need to resize, this will stretch or shrink the background image
            "background-size": "cover",
            "box-shadow": "%thinShadow%"
          },
          // text container
          "._deets": {
            position: "absolute",
            left: "40px",
            right: "0px",
            bottom: "0px",
            height: "30px",
            span: {
              // same trick as in title for overflow: ellpsis without explicit width
              left: "0px",
              right: "0px",
              position: "absolute",
              "font-size": "12px",
              overflow: "hidden",
              "white-space": "pre",
              "text-overflow": "ellipsis"
            },
            "._topline": {
              top: "0"
            },
            "._bottomline": {
              bottom: "0"
            }
          }
        },
        // invisible spreader bar -- the content inside holds widget open to the correct width
        "&::after": {
          content:
            '"------------------------------------------------------------------------------------------------------------------------"',
          display: "block",
          height: "1px",
          "line-height": "1px",
          color: "transparent"
        },
        // vertically center single line of credit
        "&._uno": {
          "._container": {
            "._deets": {
              "._topline": {
                top: "8px"
              },
              "._bottomline": {
                display: "none"
              }
            }
          }
        }
      },
      "&._fresh": {
        "._pages": {
          "._overlay": {
            opacity: "1"
          }
        }
      },
      "&._medium": {
        "min-width": "237px",
        "max-width": "345px",
        "border-radius": "24px",
        "._pages": {
          "._page": {
            "._blocks": {
              "._block": {
                "._container": {
                  "._paragraph": {
                    "font-size": "21px",
                    "line-height": "1.23em",
                    "border-radius": "5px",
                    padding: "2px 3px"
                  }
                }
              }
            }
          },
          "._overlay": {
            "._progress": {
              "._indicator": {
                margin: "16px 4px 0"
              }
            }
          }
        }
      },
      "&._large": {
        "min-width": "346px",
        "max-width": "600px",
        "border-radius": "36px",
        "._pages": {
          "._page": {
            "._blocks": {
              "._block": {
                "._container": {
                  "._paragraph": {
                    "font-size": "27px",
                    "line-height": "1.11em",
                    "border-radius": "5px",
                    padding: "3px 4.5px"
                  }
                }
              }
            }
          },
          "._overlay": {
            "._progress": {
              "._indicator": {
                margin: "16px 4px 0"
              }
            }
          }
        }
      },
      "&._atStart": {
        "._pages": {
          "._overlay": {
            "._backward": {
              display: "none"
            }
          }
        }
      },
      "&._atEnd": {
        "._pages": {
          "._overlay": {
            "._forward": {
              display: "none"
            }
          }
        }
      }
    },
    "._button_follow": {
      display: "inline-block",
      color: "#363636",
      "box-sizing": "border-box",
      "box-shadow": "inset 0 0 1px #888",
      "border-radius": "%buttonBorderRadius%",
      font:
        'bold 11px/20px "Helvetica Neue", Helvetica, arial, sans-serif !important',
      "box-sizing": "border-box",
      cursor: "pointer",
      "%prefix%font-smoothing": "antialiased",
      height: "20px",
      padding: "0 4px 0 20px",
      "background-color": "#efefef",
      position: "relative",
      "white-space": "nowrap",
      "vertical-align": "baseline",
      "&:hover": {
        "box-shadow": "inset 0 0 1px #000"
      },
      "&::after": {
        content: '""',
        position: "absolute",
        height: "14px",
        width: "14px",
        top: "3px",
        left: "3px",
        background: "transparent url(%logo%) 0 0 no-repeat",
        "background-size": "14px 14px"
      },
      "&._tall": {
        height: "26px",
        "line-height": "26px",
        "font-size": "13px",
        padding: "0 6px 0 25px",
        "border-radius": "%buttonBorderRadiusTall%",
        "&::after": {
          height: "18px",
          width: "18px",
          top: "4px",
          left: "4px",
          "background-size": "18px 18px"
        }
      }
    },
    "._button_pin": {
      cursor: "pointer",
      display: "inline-block",
      "box-sizing": "border-box",
      "box-shadow": "inset 0 0 1px #888",
      "border-radius": "%buttonBorderRadius%",
      height: "20px",
      width: "40px",
      "%prefix%font-smoothing": "antialiased",
      background: "#efefef url(%pinit_en_red%) 50% 50% no-repeat",
      "background-size": "75%",
      position: "relative",
      font: '12px "Helvetica Neue", Helvetica, arial, sans-serif',
      color: "#555",
      "box-sizing": "border-box",
      "text-align": "center",
      "vertical-align": "baseline",
      "&:hover": {
        "box-shadow": "inset 0 0 1px #000"
      },
      "&._above": {
        "._count": {
          position: "absolute",
          top: "-28px",
          left: "0",
          height: "28px",
          width: "inherit",
          "line-height": "24px",
          background: "transparent url(%above%) 0 0 no-repeat",
          "background-size": "40px 28px"
        },
        "&._padded": {
          "margin-top": "28px"
        }
      },
      "&._beside": {
        "._count": {
          position: "absolute",
          right: "-45px",
          "text-align": "center",
          "text-indent": "5px",
          height: "inherit",
          width: "45px",
          "font-size": "11px",
          "line-height": "20px",
          background: "transparent url(%beside%)",
          "background-size": "cover"
        },
        "&._padded": {
          "margin-right": "45px"
        }
      },
      // legacy
      "&._ja": {
        "background-image": "url(%pinit_ja_red%)",
        "background-size": "72%"
      },
      // legacy
      "&._red": {
        "background-color": "#e60023",
        "background-image": "url(%pinit_en_white%)",
        "&._ja": {
          "background-image": "url(%pinit_ja_white%)"
        }
      },
      // legacy
      "&._white": {
        "background-color": "#fff"
      },
      // current
      "&._save": {
        "&:hover": {
          "background-color": "%saveButtonBackgroundColor%",
          "box-shadow": "none",
          color: "#fff!important"
        },
        "border-radius": "2px",
        "text-indent": "20px",
        width: "auto",
        padding: "0 4px 0 0",
        "text-align": "center",
        "text-decoration": "none",
        font: '11px/20px "Helvetica Neue", Helvetica, sans-serif',
        "font-weight": "bold",
        color: "#fff!important",
        background: "%saveButtonBackgroundColor% url(%logo%) 3px 50% no-repeat",
        "background-size": "14px 14px",
        "font-weight": "bold",
        "-webkit-font-smoothing": "antialiased",
        "._count": {
          "text-indent": "0",
          position: "absolute",
          color: "#555",
          background: "#efefef",
          "border-radius": "2px",
          // fang
          "&::before": {
            content: '""',
            position: "absolute"
          }
        },
        "&._beside": {
          "._count": {
            right: "-46px",
            height: "20px",
            width: "40px",
            "font-size": "10px",
            "line-height": "20px",
            "&::before": {
              top: "3px",
              left: "-4px",
              "border-right": "7px solid #efefef",
              "border-top": "7px solid transparent",
              "border-bottom": "7px solid transparent"
            }
          }
        },
        "&._above": {
          "._count": {
            top: "-36px",
            width: "100%",
            height: "30px",
            "font-size": "10px",
            "line-height": "30px",
            "&::before": {
              bottom: "-4px",
              left: "4px",
              "border-top": "7px solid #efefef",
              "border-right": "7px solid transparent",
              "border-left": "7px solid transparent"
            }
          },
          "&._padded": {
            "margin-top": "28px"
          }
        }
      },
      "&._tall": {
        height: "28px",
        width: "56px",
        "border-radius": "%buttonBorderRadiusTall%",
        "&._above": {
          "._count": {
            position: "absolute",
            height: "37px",
            width: "inherit",
            top: "-37px",
            left: "0",
            "line-height": "30px",
            "font-size": "14px",
            background: "transparent url(%above%)",
            "background-size": "cover"
          },
          "&._padded": {
            "margin-top": "37px"
          }
        },
        "&._beside": {
          "._count": {
            "text-indent": "5px",
            position: "absolute",
            right: "-63px",
            height: "inherit",
            width: "63px",
            "font-size": "14px",
            "line-height": "28px",
            background: "transparent url(%beside%)",
            "background-size": "cover"
          },
          "&._padded": {
            "margin-right": "63px"
          }
        },
        "&._save": {
          "border-radius": "4px",
          width: "auto",
          "background-position-x": "6px",
          "background-size": "18px 18px",
          "text-indent": "29px",
          font: '14px/28px "Helvetica Neue", Helvetica, Arial, "sans-serif"',
          "font-weight": "bold",
          padding: "0 6px 0 0",
          "._count": {
            position: "absolute",
            color: "#555",
            "font-size": "12px",
            "text-indent": "0",
            background: "#efefef",
            "border-radius": "4px",
            "&::before": {
              content: '""',
              position: "absolute"
            }
          },
          "&._above": {
            "._count": {
              "font-size": "14px",
              top: "-50px",
              width: "100%",
              height: "44px",
              "line-height": "44px",
              "&::before": {
                bottom: "-4px",
                left: "7px",
                "border-top": "7px solid #efefef",
                "border-right": "7px solid transparent",
                "border-left": "7px solid transparent"
              }
            }
          },
          "&._beside": {
            "._count": {
              "font-size": "14px",
              right: "-63px",
              width: "56px",
              height: "28px",
              "line-height": "28px",
              "&::before": {
                top: "7px",
                left: "-4px",
                "border-right": "7px solid #efefef",
                "border-top": "7px solid transparent",
                "border-bottom": "7px solid transparent"
              }
            }
          }
        }
      },
      "&._round": {
        height: "16px",
        width: "16px",
        background: "transparent url(%logo%) 0 0 no-repeat",
        "background-size": "16px 16px",
        "box-shadow": "none",
        "&._tall": {
          height: "32px",
          width: "32px",
          "background-size": "32px 32px"
        }
      }
    }
  }
});

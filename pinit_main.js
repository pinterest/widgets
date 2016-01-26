/* jshint indent: false, maxlen: false */
// send base_scheme=https to API calls if we're on an https page

(function (w, d, a) {
  var $ = w[a.k] = {
    'w': w,
    'd': d,
    'a': a,
    's': {},
    'f': (function () {
      return {
        // an empty array of callbacks to be populated later
        callback: [],

        // get a DOM property or text attribute
        get: function (el, att) {
          var v = null;
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

        // return the selected text, if any
        getSelection: function () {
          return ("" + ($.w.getSelection ? $.w.getSelection() : $.d.getSelection ? $.d.getSelection() : $.d.selection.createRange().text)).replace(/(^\s+|\s+$)/g, "");
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
          before.parentNode.insertBefore(after, before);
          $.f.kill(before);
        },

        // find an event's target element
        getEl: function (e) {
          var el = null;
          if (e.target) {
            el = (e.target.nodeType === 3) ? e.target.parentNode : e.target;
          } else {
            el = e.srcElement;
          }
          return el;
        },

        // listen for events in a cross-browser fashion
        listen: function (el, ev, fn) {
          if (el) {
            if (typeof $.w.addEventListener !== 'undefined') {
              el.addEventListener(ev, fn, false);
            } else if (typeof $.w.attachEvent !== 'undefined') {
              el.attachEvent('on' + ev, fn);
            }
          }
        },

        // call an API endpoint
        call: function (url, func) {
          var n, id, tag, msg, sep = '?';

          // $.f.callback starts as an empty array
          n = $.f.callback.length;

          // new SCRIPT tags get IDs so we can find them, query them, and delete them later
          id = $.a.k + '.f.callback[' + n + ']';

          // the callback will fire only when the API returns
          $.f.callback[n] = function (r) {
            // do we have output?
            if (r) {
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
                    $.f.log('&type=api_error&code=' + r.code + '&msg=' + msg + '&url=' + encodeURIComponent(tag.src.split('?')[0]));
                  }
                }
              } else {
                // send the API output to the function we passed when we made the SCRIPT tag
                func(r, n);
              }
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

        // console.log only if debug is on
        debug: function (obj, force) {
          if (($.v.config.debug || force) && ($.w.console && $.w.console.log)) {
            $.w.console.log(obj);
          }
        },

        // build stylesheet
        presentation: function () {
          var css, rules;

          css = $.f.make({'STYLE': {'type': 'text/css'}});

          rules = $.a.rules.join('\n');

          // each rule has our randomly-created key at its root to minimize style collisions
          rules = rules.replace(/\._/g, '.' + a.k + '_');

          // every rule ending in ; also gets !important
          rules = rules.replace(/;/g, '!important;');

          // cdn
          rules = rules.replace(/_cdn/g, $.a.cdn);

          // resolution
          rules = rules.replace(/_rez/g, $.v.resolution);

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

        // return current style property for element
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

        hideFloatingButton: function () {
          if ($.s.floatingButton) {
            $.f.kill($.s.floatingButton);
          }
        },

        getButtonConfig: function (el) {

          var c = {
            'height': $.f.getData(el, 'height') || $.v.config.height,
            'color': $.f.getData(el, 'color') || $.v.config.color,
            'shape': $.f.getData(el, 'shape') || $.v.config.shape,
            'assets': $.f.getData(el, 'lang') || $.v.config.lang,
            'zero': $.f.getData(el, 'zero') || null,
            'pad': $.f.getData(el, 'count-pad') || null,
            'config': $.f.getData(el, 'config') || 'none'
          };

          var id = $.f.getData(el, 'id');
          if (id) {
            c.id = id;
          }

          // shape, size, color
          if (c.shape === 'round') {
            if (c.height !== '16' && c.height !== '32') {
              // height not found; default to 16
              c.height = '16';
            }
            // color is always red
            c.color = 'red';
          } else {
            if (c.shape === 'rect') {
              if (c.height !== '20' && c.height !== '28') {
                // nonsense value for height; default to 20
                c.height = '20';
              }
              if (c.color !== 'gray' && c.color !== 'red' && c.color !== 'white') {
                // color not found; default to gray
                c.color = 'gray';
              }
            } else {
              // shape not found; default to small gray
              c.shape = 'rect';
              c.height = '20';
              c.color = 'gray';
            }
          }

          // allow asset change only for rectangles
          if (c.shape === 'rect') {
            if (!$.a.hazAssets[c.assets]) {
              c.assets = $.v.config.assets;
            }
          } else {
            c.assets = 'en';
          }

          return c;

        },

        showFloatingButton: function (img) {
          $.f.debug('show floating Pin It button');

          $.f.hideFloatingButton();

          var c = $.f.getButtonConfig(img);

          // size > 80x80 and source is not a data: uri?
          if (img.height > $.a.minImgSize && img.width > $.a.minImgSize && !img.src.match(/^data/)) {

            // make it fresh each time; this pays attention to individual image config options
            var buttonClass = $.a.k + '_pin_it_button_' + c.height + ' ' + $.a.k + '_pin_it_button_' + c.assets + '_' + c.height + '_' + c.color + ' ' + $.a.k + '_pin_it_button_floating_' + c.height;
            if (c.shape === 'round') {
              buttonClass = $.a.k + '_pin_it_button_en_' + c.height + '_red_round ' + $.a.k + '_pin_it_button_floating_en_' + c.height + '_red_round';
            }

            // get position, start href
            var p = $.f.getPos(img), href;

            if (c.id) {
              href = $.v.endpoint.repin.replace(/%s/, c.id);
              $.s.floatingButton = $.f.make({'A': {
                'className': buttonClass,
                'title': 'Pin it!',
                'data-pin-log': 'button_pinit_floating_repin',
                'data-pin-href': href
              }});
            } else {
              // set the button href
              href = $.v.endpoint.create + 'guid=' + $.v.guid;
              href = href + '&url=' + encodeURIComponent($.f.getData(img, 'url') || $.d.URL);
              href = href + '&media=' + encodeURIComponent($.f.getData(img, 'media') || img.src);
              href = href + '&description=' + encodeURIComponent($.f.getSelection() || $.f.getData(img, 'description') || img.title || img.alt || $.d.title);
              $.s.floatingButton = $.f.make({'A': {
                'className': buttonClass,
                'title': 'Pin it!',
                'data-pin-log': 'button_pinit_floating',
                'data-pin-href': href
              }});
            }

            $.d.b.appendChild($.s.floatingButton);

            // set height and position
            $.s.floatingButton.style.top = (p.top + $.a.floatingButtonOffsetTop) + 'px';
            $.s.floatingButton.style.left = (p.left + $.a.floatingButtonOffsetLeft) + 'px';
            $.s.floatingButton.style.zIndex = '8675309';
            // show it
            $.s.floatingButton.style.display = 'block';
          }
        },

        // mouse over; only active if we have floaters
        over: function (v) {
          var t, el;
          t = v || $.w.event;
          el = $.f.getEl(t);
          if (el) {
            if (el.tagName === 'IMG' && el.src && !$.f.getData(el, 'no-hover') && !$.f.get(el, 'nopin') && !$.f.getData(el, 'nopin') && $.v.config.hover) {
              // we are inside an image
              if ($.v.hazFloatingButton === false) {
                // show the floating button
                $.v.hazFloatingButton = true;
                $.f.showFloatingButton(el);
              } else {
                // we have moved from one image to another while the floater was on
                $.f.hideFloatingButton();
                $.f.showFloatingButton(el);
              }
            } else {
              // we are outside an image. Do we need to hide the floater?
              if ($.v.hazFloatingButton === true) {
                // don't hide the floater if we are over it
                if (el !== $.s.floatingButton) {
                  // hide it
                  $.v.hazFloatingButton = false;
                  $.f.hideFloatingButton();
                }
              }
            }
          }
        },

        // a click!
        click: function (v) {

          v = v || $.w.event;
          var el, log, pinId, href;
          el = $.f.getEl(v);

          if (el) {
            log = $.f.getData(el, 'log');
            if (log) {
              // log this click
              if (log === 'embed_pin_play') {
                // play or pause animated GIF
                var img = el.parentNode.getElementsByTagName('IMG')[0];
                if (el.innerHTML !== 'II GIF') {
                  el.innerHTML = 'II GIF';
                  $.f.set(el, 'data-pin-pause', img.src);
                  img.src = img.src.replace(/(237x|345x|600x)/, 'originals');
                } else {
                  el.innerHTML = '&#9654; GIF';
                  img.src = $.f.getData(el, 'pause');
                }
              } else {
                // check for data-pin-href
                href = $.f.getData(el, 'href');
                if (href) {
                  // this is a data-pin link
                  $.f.log('&type=' + log + '&href=' + encodeURIComponent(href));
                  // gray out any clickable thing
                  if (!el.className.match(/hazClick/)) {
                    el.className = el.className + ' ' + $.a.k + '_hazClick';
                  }
                  switch (log) {
                    case 'button_pinit':
                      var q = $.f.parse(href, {'url': true, 'media': true, 'description': true});
                      if (!q.description) {
                        // log an error
                        $.f.log('&type=config_warning&warning_msg=no_description&href=' + encodeURIComponent($.d.URL));
                      }
                      // found valid URLs?
                      if (q.url && q.url.match(/^http/i) && q.media && q.media.match(/^http/i)) {
                        // pop the pin form
                        $.w.open(href, 'pin' + new Date().getTime(), $.a.pop);
                      } else {
                        // log an error
                        $.f.log('&type=config_error&error_msg=invalid_url&href=' + encodeURIComponent($.d.URL));
                        // fire up the bookmarklet and hope for the best
                        $.f.fireBookmark();
                      }
                    break;

                    // pop bookmarklet
                    case 'button_pinit_bookmarklet':
                      $.f.fireBookmark();
                    break;

                    // pop pin create dialog
                    case 'button_pinit_floating':
                    case 'button_pinit_floating_repin':
                      $.w.open(href, 'pin' + new Date().getTime(), $.a.pop);
                      $.f.hideFloatingButton();
                      $.v.hazFloatingButton = false;
                    break;

                    // pop repin dialog
                    case 'button_pinit_repin':
                    case 'embed_pin':
                    case 'embed_pin_repin':
                    case 'embed_board_thumb':
                    case 'embed_user_thumb':
                      $.w.open(href, 'pin' + new Date().getTime(), $.a.pop);
                    break;

                    // follow button
                    case 'button_follow':
                      // follow buttons have real hrefs for SEO; prevent default to avoid following
                      v.preventDefault();
                      $.w.open(href, 'pin' + new Date().getTime(), $.a.popHuge);
                    break;

                    // open href in new page
                    case 'embed_pin_pinner':
                    case 'embed_pin_board':
                    case 'embed_pin_img':
                    case 'embed_board_hd':
                    case 'embed_user_hd':
                    case 'embed_board_ft':
                    case 'embed_user_ft':
                    case 'button_follow_auto':
                      $.w.open(href, '_blank');
                    break;

                    default:
                    break;
                  }
                } else {
                  // check for SEO href
                  href = $.f.get(el, 'href');
                  if (href) {
                    $.f.log('&type=' + log + '&href=' + encodeURIComponent(href));
                  }
                }
              }
            }
          }
        },

        filter: function (str) {
          var decoded, ret;
          decoded = '';
          ret = '';
          try {
            decoded = decodeURIComponent(str);
          } catch (e) { }
          ret = decoded.replace(/</g, '&lt;');
          ret = ret.replace(/>/g, '&gt;');
          return ret;
        },

        behavior: function () {
          // add a single event listener to the body for minimal impact
          $.f.listen($.d.b, 'click', $.f.click);
          if ($.v.config.hover) {
            $.v.countButton = $.v.countButton + 1;
            $.d.b.setAttribute('data-pin-hover', true);
            $.f.listen($.d.b, 'mouseover', $.f.over);
          }

          // log calls may be dropped on the floor by the server; clean them up
          var cleanLog = function () {
            var s = $.d.getElementsByTagName('SCRIPT');
            for (var i = 0, n = s.length; i < n; i = i + 1) {
              if (s[i] && s[i].src && s[i].src.match(/^https?:\/\/log\.pinterest\.com/)) {
                $.f.kill(s[i]);
              }
            }
            $.w.setTimeout(function () {
              cleanLog();
            }, 2000);
          };
          cleanLog();

        },

        getPinCount: function (url) {
          var query = '?url=' +  url + '&ref=' + encodeURIComponent($.v.here) + '&source=' + $.a.countSource;
          $.f.call($.a.endpoint.count + query, $.f.ping.count);
        },

        prettyPinCount: function (n) {
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
          return n;
        },

        // arrange pin images neatly on a board
        grid: function (parent, data, log) {
          if (!log) {
            log = 'embed_grid';
          }
          parent.style.display = 'block';
          var scaleFactors = {
            'height': $.a.tile.scale.height,
            'width': $.a.tile.scale.width
          };
          var scaleHeight = $.f.getData(parent, 'scale-height');
          if (scaleHeight && scaleHeight >= $.a.tile.scale.minHeight) {
            scaleFactors.height = parseInt(scaleHeight, 10);
          }
          var scaleWidth = $.f.getData(parent, 'scale-width');
          if (scaleWidth && scaleWidth >= $.a.tile.scale.minWidth) {
            scaleFactors.width = parseInt(scaleWidth, 10);
          }
          var width = $.f.getData(parent, 'board-width') || parent.offsetWidth;
          if (width > parent.offsetWidth) {
            width = parent.offsetWidth;
          }
          var columns = Math.floor(width / (scaleFactors.width + $.a.tile.style.margin));
          if (columns > $.a.tile.maxColumns) {
            columns = $.a.tile.maxColumns;
          }
          if (columns < $.a.tile.minColumns) {
            return false;
          }
          var bd = $.f.make({'SPAN': {'className': $.a.k + '_embed_grid_bd'}});
          bd.style.height = scaleFactors.height + 'px';
          $.v.renderedWidth = (columns * (scaleFactors.width + $.a.tile.style.margin)) - $.a.tile.style.margin;
          bd.style.width =  $.v.renderedWidth + 'px';
          var ct = $.f.make({'SPAN': {'className': $.a.k + '_embed_grid_ct'}});
          var c = 0;
          var h = [];
          for (var i = 0, n = data.length; i < n; i = i + 1) {

            // converts HTML entities to unicode for thumb titles
            var temp = $.f.make({'SPAN':{'innerHTML': data[i].description}});
            var thumb = $.f.make({'A': {
              'className': $.a.k + '_embed_grid_th',
              'title': temp.innerHTML,
              'data-pin-href': $.v.endpoint.repin.replace(/%s/, data[i].id),
              'data-pin-id': data[i].id,
              'data-pin-log': log + '_thumb'
            }});

            var imgReply = data[i].images[$.a.pinWidget.imgKey];

            var scale = {
              'height': imgReply.height * (scaleFactors.width / imgReply.width),
              'width': scaleFactors.width
            };
            var img = $.f.make({'IMG': {
              'src': imgReply.url,
              'data-pin-nopin': 'true',
              'height': scale.height,
              'width': scale.width,
              'className': $.a.k + '_embed_grid_img',
              'alt': data[i].description
            }});
            img.style.height = scale.height + 'px';
            img.style.width = scale.width + 'px';
            img.style.minHeight = scale.height + 'px';
            img.style.minWidth = scale.width + 'px';
            img.style.marginTop = 0 - (scale.height / $.a.tile.style.margin) + 'px';
            if (scale.height > scaleFactors.height) {
              scale.height = scaleFactors.height;
            }
            thumb.appendChild(img);
            thumb.style.height = scale.height + 'px';
            thumb.style.width = scale.width + 'px';

            // to which column shall we append this thumbnail?
            if (!h[c]) {
              // brand-new column: always go here
              h[c] = 0;
            } else {
              // find the shortest column
              var min = 10000;
              for (var j = 0; j < columns; j = j + 1) {
                if (h[j] < min) {
                  min = h[j];
                  c = j;
                }
              }
            }

            thumb.style.top = h[c] + 'px';
            thumb.style.left = (c * (scaleFactors.width + $.a.tile.style.margin)) + 'px';
            h[c] = h[c] + scale.height + $.a.tile.style.margin;
            thumb.appendChild(img);
            ct.appendChild(thumb);
            c = (c + 1) % columns;
          }

          // style the scrolling grid container
          var maxHeight = 0;
          for (var i = 0; i < h.length; i = i + 1) {
            if (h[i] > maxHeight) {
              maxHeight = h[i];
            }
          }
          ct.style.height = maxHeight + 'px';
          bd.appendChild(ct);

          if ($.v.userAgent.match(/Mac OS X/)) {
            bd.className = bd.className + ' ' + $.a.k + '_embed_grid_scrolling_okay';
          }
          return bd;
        },

        // make a board header - takes data, parent element, string to log, and true/false for showing board
        makeHeader: function (r, parent, log, showSecond) {

          // internationalize URLs in header
          var go = $.v.endpoint.pinterest + parent.href.split('.com')[1];

          var hd = $.f.make({'SPAN': { 'className': $.a.k + '_embed_grid_hd'}});

          // pinner avatar

          var avatar = $.f.make({'A': {
            'className': $.a.k + '_avatar',
            'data-pin-log': log,
            'href': go,
            'target': '_blank'
          }});

          var img = $.f.make({'IMG': {
            'alt': $.f.filter(r.data.user.full_name),
            'title': $.f.filter(r.data.user.full_name),
            'src': r.data.user.image_small_url.replace(/_30.jpg/, '_60.jpg')
          }});

          avatar.appendChild(img);

          hd.appendChild(avatar);

          // pinner name, possibly board name

          if (showSecond) {
            // showing first and second lines
            var first = $.f.make({'A': {
              'className': $.a.k + '_embed_grid_first',
              'innerHTML': $.f.filter(r.data.user.full_name),
              'target': '_blank',
              'data-pin-href': go,
              'data-pin-log': log
            }});
            first.style.width = ($.v.renderedWidth) - 45 + 'px';
            hd.appendChild(first);
            var second = $.f.make({'A': {
              'className': $.a.k + '_embed_grid_second',
              'innerHTML':  $.f.filter(r.data.board.name),
              'data-pin-href': go,
              'data-pin-log': log
            }});
            second.style.width = ($.v.renderedWidth) - 45 + 'px';
            hd.appendChild(second);
          } else {

            // only showing one line; center it vertically
            var mid = $.f.make({'A': {
              'className': $.a.k + '_embed_grid_mid',
              'innerHTML': $.f.filter(r.data.user.full_name),
              'data-pin-log': log,
              'data-pin-href': go
            }});
            mid.style.width = ($.v.renderedWidth) - 45 + 'px';
            hd.appendChild(mid);
          }

          return hd;
        },

        // make a board footer
        makeFooter: function (a, log, lang) {
          var ft, logo, see, go;

          go = $.v.endpoint.pinterest + a.href.split('.com')[1];

          ft = $.f.make({'A': {
            'className': $.a.k + '_embed_grid_ft',
            'data-pin-log': log,
            'data-pin-href': go
          }});

          logo = $.f.make({'SPAN': {
            'className': $.a.k + '_embed_grid_ft_logo',
            'data-pin-log': log,
            'data-pin-href': go
          }});

          var strings = $.v.strings;
          if (lang && $.a.strings[lang]) {
            strings = $.a.strings[lang];
          }

          if ($.v.renderedWidth > $.a.tile.minWidthToShowAuxText) {

            see = $.f.make({'SPAN':{
              'innerHTML': strings.seeOn,
              'data-pin-log': log,
              'data-pin-href': go
            }});

            if (strings.seeOnTextAfterLogo) {
              ft.appendChild(logo);
              ft.appendChild(see);
            } else {
              ft.appendChild(see);
              ft.appendChild(logo);
            }
          } else {
            ft.appendChild(logo);
          }

          return ft;

        },

        // add a CSS class to the container if specified
        cssHook: function (parent, container) {
          var cssHook = $.f.getData(parent, 'css-hook');
          if (cssHook) {
            container.className = container.className + ' ' + cssHook;
          }
        },

        // fire the bookmarklet
        fireBookmark: function () {
          $.d.b.appendChild($.f.make({
            'SCRIPT': {
              'type': 'text/javascript',
              'charset': 'utf-8',
              'pinMethod': 'button',
              'src': $.a.endpoint.bookmark + '?r=' + Math.random() * 99999999
            }
          }));
        },

        // callbacks
        ping: {
          log: function (r, k) {
            // drop logging callbacks on the floor
          },
          count: function (r, k) {
            var container = $.d.getElementById($.a.k + '_pin_count_' + k);
            if (container) {
              $.f.debug('API replied with count: ' + r.count);
              var parent = container.parentNode;
              var config = $.f.getData(parent, 'config');

              if (r.count === 0) {
                if (config === 'above') {
                  $.f.debug('Rendering zero count above.');
                  container.className = $.a.k + '_pin_it_button_count';
                  container.appendChild($.d.createTextNode('0'));
                } else {
                  if ($.f.getData(parent, 'zero')) {
                    $.f.debug('Zero pin count rendered to the side.');
                    container.className = $.a.k + '_pin_it_button_count';
                    container.appendChild($.d.createTextNode('0'));
                  } else {
                    $.f.debug('Zero pin count NOT rendered to the side.');
                  }
                }
              }

              if (r.count > 0) {
                $.f.debug('Got ' + r.count + ' pins for the requested URL.');
                if (config === 'above' || config === 'beside') {
                  $.f.debug('Rendering pin count ' + config);
                  container.className = $.a.k + '_pin_it_button_count';
                  container.appendChild($.d.createTextNode($.f.prettyPinCount(r.count)));
                } else {
                  $.f.debug('No valid pin count position specified; not rendering.');
                }
              }
              $.f.cssHook(parent, container);
            } else {
              $.f.debug('Pin It button container not found.');
            }
          },

          // build an embedded pin with shiny red candylike repin button
          pin: function (r, k) {
            var parent = $.d.getElementById($.a.k + '_' + k);
            if (parent && r.data && r.data[0]) {

              // did we find the pin ID?
              if (r.data[0].error) {
                // do we have a custom error handler?
                if (typeof $.v.config.error === 'string') {
                  if (typeof $.w[$.v.config.error] === 'function') {
                    $.w[$.v.config.error](r.data[0].error);
                  }
                }
                // return instead of trying to render
                return;
              }

              $.f.debug('API replied with pin data');

              var pin = r.data[0], thumb = {};
              if (pin.images) {
                thumb = pin.images[$.a.pinWidget.imgKey];
              }

              if (pin && pin.id && pin.description && thumb.url && thumb.width && thumb.height) {
                $.f.debug('Found enough data to embed a pin');

                var strings = $.v.strings;

                // overridden language?
                var lang = $.f.getData(parent, 'lang') || $.v.config.lang;

                if ($.a.strings[lang]) {
                  strings = $.a.strings[lang];
                }

                // container
                var container = $.f.make({'SPAN': {
                  'className': $.a.k + '_embed_pin',
                  'data-pin-id': pin.id
                }});

                var style = $.f.getData(parent, 'style');
                if (style !== 'plain') {
                  container.className = container.className + ' ' + $.a.k + '_fancy';
                }

                // main image
                var link = $.f.make({'A': {
                  'className': $.a.k + '_embed_pin_link',
                  'data-pin-log': 'embed_pin',
                  'data-pin-href': $.v.endpoint.repin.replace(/%s/, pin.id)
                }});

                // Shall we build a wider-than-normal pin widget?
                width = $.f.getData(parent, 'width');
                if (width === 'large') {
                  // top-level domain must match $.a.pinWidget.domain
                  var tld = $.d.URL.split('/')[2].split('.').pop() || '';
                  // language must match $.a.pinWidget.lang
                  if (lang.match($.a.pinWidget.lang) && tld.match($.a.pinWidget.domain)) {
                    thumb.url = thumb.url.replace(/237x/, $.a.pinWidget.large.width + 'x');
                    thumb.height = ~~(thumb.height * $.a.pinWidget.large.ratio);
                    thumb.width = $.a.pinWidget.large.width;
                    container.className = container.className + ' ' + $.a.k + '_large';
                  } else {
                    thumb.url = thumb.url.replace(/237x/, $.a.pinWidget.medium.width + 'x');
                    thumb.height = ~~(thumb.height * $.a.pinWidget.medium.ratio);
                    thumb.width = $.a.pinWidget.medium.width;
                    container.className = container.className + ' ' + $.a.k + '_medium';
                  }
                }

                // embedded media?
                if (pin.embed && pin.embed.type !== 'gif' && pin.embed.src) {
                  // nerf several variations of autoplay, autoPlay, true, and 1
                  embedSrc = pin.embed.src.replace(/autoplay=/i, 'nerfAutoPlay=');
                  player = $.f.make({'IFRAME': {
                    'className': $.a.k + '_embed_pin_link_iframe',
                    'src': embedSrc
                  }});
                  player.width = thumb.width;
                  player.height = thumb.height;
                  player.frameBorder = '0';
                  container.appendChild(player);
                } else {
                  img = $.f.make({'IMG': {
                    'className': $.a.k + '_embed_pin_link_img',
                    'alt': pin.description,
                    'data-pin-nopin': 'true',
                    'src': thumb.url,
                    'width': thumb.width,
                    'height': thumb.height,
                    'data-pin-log': 'embed_pin_img',
                    'data-pin-href': $.v.endpoint.pinterest + '/pin/' + pin.id + '/'
                  }});

                  img.style.width = thumb.width + 'px';
                  img.style.height = thumb.height + 'px';
                  link.appendChild(img);

                  // pin it button
                  rpc = $.a.k + '_repin';

                  // Japanese button
                  if (lang === 'ja') {
                    rpc = rpc + '_ja';
                  }

                  // repin button
                  repin = $.f.make({'I': {
                    'className': rpc,
                    'data-pin-id': pin.id,
                    'data-pin-log': 'embed_pin_repin',
                    'data-pin-href': $.v.endpoint.repin.replace(/%s/, pin.id)
                  }});

                  link.appendChild(repin);

                  if (pin.embed && pin.embed.type && pin.embed.type === 'gif') {
                    play = $.f.make({'I': {
                      'className': $.a.k + '_play ' + $.a.k + '_paused',
                      'innerHTML': '&#9654; GIF',
                      'data-pin-log': 'embed_pin_play'
                    }});
                    link.appendChild(play);
                  }

                  container.appendChild(link);
                }

                // description
                var description = $.f.make({'SPAN': {
                  'className': $.a.k + '_embed_pin_desc',
                  'innerHTML': $.f.filter(pin.description)
                }});

                // partner attribution
                if (pin.attribution && pin.attribution.url && pin.attribution.author_name && pin.attribution.provider_icon_url) {
                  $.f.debug('Building attribution line');

                  var attribution = $.f.make({
                    'SPAN': {
                      'className': $.a.k + '_embed_pin_attrib'
                    }
                  });
                  attribution.appendChild($.f.make({
                    'IMG': {
                      'className': $.a.k + '_embed_pin_attrib_icon',
                      'src': pin.attribution.provider_icon_url
                    }
                  }));
                  attribution.appendChild($.f.make({'SPAN':{'className': $.a.k + '_embed_pin_attrib',  'innerHTML': strings.attribTo + ' <a href="' + pin.attribution.url + '" target="_blank">' + $.f.filter(pin.attribution.author_name) + '</a>'}}));
                  description.appendChild(attribution);

                }

                if (pin.repin_count || pin.like_count) {
                  // stats
                  var stats = $.f.make({'SPAN': {
                    'className': $.a.k + '_embed_pin_stats'
                  }});

                  if (pin.repin_count) {
                    var repin_count = $.f.make({'SPAN': {
                      'className': $.a.k + '_embed_pin_stats_repin_count',
                      'innerHTML': '' + pin.repin_count
                    }});
                    stats.appendChild(repin_count);
                  }

                  if (pin.like_count) {
                    var like_count = $.f.make({'SPAN': {
                      'className': $.a.k + '_embed_pin_stats_like_count',
                      'innerHTML': '' + pin.like_count
                    }});
                    stats.appendChild(like_count);
                  }

                  description.appendChild(stats);
                }

                container.appendChild(description);

                // pinner
                if (pin.pinner && pin.pinner.profile_url && pin.pinner.image_small_url && pin.pinner.full_name) {
                  $.f.debug('Building pinner line');

                  // Hack: Replace domain to get internationalized URL

                  pin.pinner.profile_url = pin.pinner.profile_url.replace('//' + $.a.defaults.domain + '.pinterest.com', $.v.endpoint.pinterest);

                  var pinner = $.f.make({'SPAN': {
                    'className': $.a.k + '_embed_pin_text',
                  }});

                  var avatar = $.f.make({'A':{
                    'data-pin-log': 'embed_pin_pinner',
                    'href': pin.pinner.profile_url,
                    'target': '_blank'
                  }});

                  avatar.appendChild($.f.make({
                    'IMG': {
                      'className': $.a.k + '_embed_pin_text_avatar',
                      'alt': $.f.filter(pin.pinner.full_name),
                      'title': $.f.filter(pin.pinner.full_name),
                      'src': pin.pinner.image_small_url
                    }
                  }));

                  pinner.appendChild(avatar);

                  pinner.appendChild($.f.make({
                    'SPAN': {
                      'className': $.a.k + '_embed_pin_text_container',
                      'innerHTML': '<span data-pin-log="embed_pin_pinner" data-pin-href="' + pin.pinner.profile_url + '" class="' + $.a.k + '_embed_pin_text_container_pinner">' + $.f.filter(pin.pinner.full_name) + '</span><span data-pin-log="embed_pin_board" data-pin-href="' + $.v.endpoint.pinterest + pin.board.url + '" class="' + $.a.k + '_embed_pin_text_container_board">' + $.f.filter(pin.board.name) + '</span>'
                    }
                  }));

                  container.appendChild(pinner);
                }

                $.f.cssHook(parent, container);
                $.f.replace(parent, container);
              } else {
                $.f.debug('Not enough data to embed a pin; aborting');
              }
            }
          },

          // user's last few pins
          user: function (r, k) {
            var parent = $.d.getElementById($.a.k + '_' + k);
            if (parent && r.data && r.data.pins && r.data.pins.length) {

              var lang = $.f.getData(parent, 'lang') || $.v.config.lang;

              $.f.debug('API replied with a user');
              var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_grid'}});
              var style = $.f.getData(parent, 'style');
              if (style !== 'plain') {
                container.className = container.className + ' ' + $.a.k + '_fancy';
              }
              var bd = $.f.grid(parent, r.data.pins, 'embed_user');
              if (bd) {
                var hd = $.f.makeHeader(r, parent, 'embed_user_hd');
                container.appendChild(hd);
                container.appendChild(bd);
                container.appendChild($.f.makeFooter(parent, 'embed_user_ft', lang));
                $.f.cssHook(parent, container);
                $.f.replace(parent, container);
              }

            }
          },

          // last few pins from a board
          board: function (r, k) {
            var parent = $.d.getElementById($.a.k + '_' + k);
            if (parent && r.data && r.data.pins && r.data.pins.length) {
              $.f.debug('API replied with a group of pins');

              var lang = $.f.getData(parent, 'lang') || $.v.config.lang;

              var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_grid'}});
              var style = $.f.getData(parent, 'style');
              if (style !== 'plain') {
                container.className = container.className + ' ' + $.a.k + '_fancy';
              }
              var bd = $.f.grid(parent, r.data.pins, 'embed_board');
              if (bd) {
                var hd = $.f.makeHeader(r, parent, 'embed_board_hd', true);
                container.appendChild(hd);
                container.appendChild(bd);
                container.appendChild($.f.makeFooter(parent, 'embed_board_ft', lang));
                $.f.cssHook(parent, container);
                $.f.replace(parent, container);
              }
            }
          }
        },

        // parse an URL, return values for specified keys
        parse: function (str, keys) {
          var query, pair, part, i, n, ret;
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
                  // yes: set return value for key to second part, which is value
                  ret[part[0]] = part[1];
                }
              }
            }
          }
          return ret;
        },

        // encode and prepend http: and/or // to URLs
        fixUrl: function (str) {
          // see if this string has been url-encoded
          var decoded = '';
          // try-catch because decodeURIComponent throws errors
          try {
            decoded = decodeURIComponent(str);
          } catch (e) { }
          // encode string if decoded matches original
          if (decoded === str) {
            str = encodeURIComponent(str);
          }
          // does it start with http?
          if (!str.match(/^http/i)) {
            // does it start with //
            if (!str.match(/^%2F%2F/i)) {
              str = '%2F%2F' + str;
            }
            str = 'http%3A' + str;
            $.f.debug('fixed URL: ' + str);
          }
          return str;
        },

        render: {
          buttonBookmark: function (el) {
            $.f.debug('build bookmarklet button');

            var c = $.f.getButtonConfig(el);

            var buttonClass = $.a.k + '_pin_it_button_' + c.height + ' ' + $.a.k + '_pin_it_button_' + c.assets + '_' + c.height + '_' + c.color + ' ' + $.a.k + '_pin_it_button_inline_' + c.height;
            if (c.shape === 'round') {
              buttonClass = $.a.k + '_pin_it_button_en_' + c.height + '_red_round ' + $.a.k + '_pin_it_button_inline_en_' + c.height + '_red_round';
            }

            var a = $.f.make({'A': {
              'data-pin-href': el.href,
              'data-pin-log': 'button_pinit_bookmarklet',
              'className': buttonClass
            }});

            if ($.f.getData(el, 'zero') || $.v.config.zero) {
              $.f.set(a, $.a.dataAttributePrefix + 'zero', true);
            }

            if ($.a.config.pinItCountPosition[c.config] === true && c.shape === 'rect') {
              $.f.set(a, $.a.dataAttributePrefix + 'config', c.config);
              a.className = a.className + ' ' + $.a.k + '_pin_it_' + c.config + '_' + c.height;
              var span = $.f.make({'SPAN': {'className': $.a.k + '_hidden', 'id': $.a.k + '_pin_count_' + $.f.callback.length, 'innerHTML': '<i></i>'}});
              a.appendChild(span);
              $.f.getPinCount($.d.URL);
            } else {
              a.className = a.className + ' ' + $.a.k + '_pin_it_none';
            }

            $.f.replace(el, a);
            $.v.countButton = $.v.countButton + 1;

          },
          buttonPin: function (el) {
            $.f.debug('build Pin It button');

            var c = $.f.getButtonConfig(el);

            var buttonClass = $.a.k + '_pin_it_button_' + c.height + ' ' + $.a.k + '_pin_it_button_' + c.assets + '_' + c.height + '_' + c.color + ' ' + $.a.k + '_pin_it_button_inline_' + c.height;
            if (c.shape === 'round') {
              buttonClass = $.a.k + '_pin_it_button_en_' + c.height + '_red_round ' + $.a.k + '_pin_it_button_inline_en_' + c.height + '_red_round';
            }

            // get just the url, media, and description parameters and percent-encode them, if needed
            var href, q;
            q = $.f.parse(el.href, {'url': true, 'media': true, 'description': true});
            if (q.media) {
              q.media = $.f.fixUrl(q.media);
            } else {
              // misconfigured: no media URL was given
              q.media = '';
              $.f.debug('no media found; click will pop bookmark');
            }

            if (q.url) {
              q.url = $.f.fixUrl(q.url);
            } else {
              // misconfigured: no page URL was given
              q.url = encodeURIComponent($.d.URL);
              $.f.debug('no url found; click will pin this page');
            }

            // automatically fill in document.title (if avaiable) for blank descriptions
            if (!q.description) {
              q.description = encodeURIComponent($.d.title || '');
            }

            $.v.buttonId = $.v.buttonId + 1;

            href = $.v.endpoint.create + 'guid=' + $.v.guid + '-' + $.v.buttonId + '&url=' + q.url + '&media=' + q.media + '&description=' + q.description;

            var a = $.f.make({'A': {
              'className': buttonClass,
              'data-pin-href': href,
              'data-pin-log': 'button_pinit'
            }});

            // always show zero count?
            if ($.f.getData(el, 'zero') || $.v.config.zero) {
              $.f.set(a, $.a.dataAttributePrefix + 'zero', true);
            }

            var config = $.f.getData(el, 'config');

            // count position / visibility
            if ($.a.config.pinItCountPosition[config] === true) {
              $.f.set(a, $.a.dataAttributePrefix + 'config', config);
              a.className = a.className + ' ' + $.a.k + '_pin_it_' + c.config + '_' + c.height;
              if (c.pad) {
                a.className = a.className + ' ' + $.a.k + '_pin_it_' + c.config + '_' + c.height + '_pad';
              }
            } else {
              a.className = a.className + ' ' + $.a.k + '_pin_it_none';
            }

            // overwrite if we have a pin ID
            if (c.id && q.media) {
              $.f.set(a, 'data-pin-log', 'button_pinit_repin');
              $.f.set(a, 'data-pin-id', c.id);
              $.f.set(a, 'data-pin-href', $.v.endpoint.repin.replace(/%s/, c.id) + '?media=' + q.media);
            }

            // get pin count only if there's an URL
            if (q.url) {
              if (c.shape === 'rect') {
                var span = $.f.make({'SPAN': {'className': $.a.k + '_hidden', 'id': $.a.k + '_pin_count_' + $.f.callback.length, 'innerHTML': '<i></i>'}});
                a.appendChild(span);
                $.f.getPinCount(q.url);
              }
              $.f.replace(el, a);
              $.v.countButton = $.v.countButton + 1;
            }

          },
          buttonFollow: function (el) {
            $.f.debug('build follow button');
            var className = '_follow_me_button';

            // allow for tall buttons
            var h = $.f.getData(el, 'height') || $.v.config.height || 0;
            if (h === '28') {
              className = className + '_28';
            }

            var a = $.f.make({'A': {
              // show href in follow button
              'href': el.href,
              'className': $.a.k + className,
              'innerHTML': el.innerHTML,
              'data-pin-href': el.href + '?guid=' + $.v.guid + '-' + $.v.buttonId
            }});

            if (el.href.match(/\/follow\//)) {
              // this is an autofollow button; don't mess with it
              a.setAttribute('data-pin-log', 'button_follow_auto');
            } else {
              // this is a new follow button
              a.setAttribute('data-pin-log', 'button_follow');
              // add trailing slash if not found
              if (!el.href.match(/\/$/)) {
                el.href = el.href + '/';
              }
              // fix old URLs to point to /pins/follow/
              if (!el.href.match(/pins\/follow\/$/)) {
                // add pins/follow/
                el.href = el.href + 'pins/follow/';
              }
              a.setAttribute('data-pin-href', el.href + '?guid=' + $.v.guid + '-' + $.v.buttonId);
            }

            a.appendChild($.f.make({'B': {}}));
            a.appendChild($.f.make({'I': {}}));
            $.f.replace(el, a);
            $.v.buttonId = $.v.buttonId + 1;
            $.v.countFollow = $.v.countFollow + 1;
          },
          embedPin: function (el) {
            $.f.debug('build embedded pin');
            var pin = el.href.split('/')[4];
            if (pin && parseInt(pin, 10) > 0) {
              $.f.getPinsIn('pin', '', {'pin_ids': pin});
            }
            $.v.countPin = $.v.countPin + 1;
          },
          embedUser: function (el) {
            $.f.debug('build embedded profile');
            var user = el.href.split('/')[3];
            if (user) {
              $.f.getPinsIn('user', user + '/pins/');
            }
            $.v.countProfile = $.v.countProfile + 1;
          },
          embedBoard: function (el) {
            $.f.debug('build embedded board');
            var user = el.href.split('/')[3];
            var board = el.href.split('/')[4];
            if (user && board) {
              $.f.getPinsIn('board', user + '/' + board + '/pins/');
            }
            $.v.countBoard = $.v.countBoard + 1;
          }
        },
        getPinsIn: function (endpoint, path, params) {
          if (!params) {
            params = {};
          }
          var query = '', sep = '?', p;
          params['sub'] = $.v.config.domain;
          if ($.w.location.protocol === 'https:') {
            params['base_scheme'] = 'https';
          }
          for (p in params) {
            if (params[p].hasOwnProperty) {
              query = query + sep + p + '=' + params[p];
              sep = '&';
            }
          }
          $.f.call($.a.endpoint[endpoint] + path + query, $.f.ping[endpoint]);
        },
        build: function (el) {
          // look for buildable pidgets in element el
          // may be fired by function specified in data-pin-render
          if (typeof el !== 'object' ||  el === null || !el.parentNode) {
            el = $.d;
          }
          // grab all the links on the page
          var temp = el.getElementsByTagName('A'), n, i, doThis, legacyLayout, legacyConfig, legacyTranslate = {'vertical': 'above', 'horizontal': 'beside'}, link = [];
          for (i = 0, n = temp.length; i < n; i = i + 1) {
            link.push(temp[i]);
          }
          // go through all links and look for ours
          for (i = 0, n = link.length; i < n; i = i + 1) {
            if (link[i].href && link[i].href.match($.a.myDomain)) {
              doThis = $.f.getData(link[i], 'do');

              // fix legacy buttons
              if (!doThis && link[i].href.match(/pin\/create\/button/)) {
                doThis = 'buttonPin';
                // assume no count layout given
                legacyConfig = 'none';
                // can we find it?
                legacyLayout = $.f.get(link[i], 'count-layout');
                // do we have 'vertical' or 'horizontal'?
                if (legacyLayout && legacyTranslate[legacyLayout]) {
                  // translate to 'above' or 'beside'
                  legacyConfig = legacyTranslate[legacyLayout];
                }
                // fix the link
                $.f.set(link[i], 'data-pin-config', legacyConfig);
              }

              if (typeof $.f.render[doThis] === 'function') {
                link[i].id = $.a.k + '_' + $.f.callback.length;
                $.f.render[doThis](link[i]);
              }
            }
          }
        },
        config: function () {
          // find and apply configuration requests passed as data attributes on SCRIPT tag
          var script = $.d.getElementsByTagName('SCRIPT'), i, j, p, foundMe = false;

          // loop backwards through all SCRIPT tags
          for (i = script.length - 1; i > -1; i = i - 1) {

            // is it us?
            if ($.a.me && script[i] && script[i].src && script[i].src.match($.a.me)) {
              // loop through all possible config params
              for (j = 0; j < $.a.configParam.length; j = j + 1) {
                p = $.f.get(script[i], $.a.dataAttributePrefix + $.a.configParam[j]);
                if (p) {
                  // set or overwrite config param with contents
                  $.v.config[$.a.configParam[j]] = p;
                }
              }
              // burn after reading to prevent future calls from re-reading config params
              $.f.kill(script[i]);
            }
          }

          // find and apply configuration requests passed as META tags
          var metas = $.d.getElementsByTagName('META'), i, j;

          // loop through all META tags
          for (i = metas.length - 1; i > -1; i = i - 1) {

            // is it us?
            if (metas[i] && metas[i].hasAttribute("property") && metas[i].hasAttribute("content")) {
              // loop through all possible config params
              for (j = 0; j < $.a.configParam.length; j = j + 1) {
                if (metas[i].getAttribute("property") ==  $.a.dataAttributePrefix + $.a.configParam[j]) {
                  // set or overwrite config param with contents
                  $.v.config[$.a.configParam[j]] = metas[i].content;
                  // burn after reading to prevent future calls from re-reading config params
                  $.f.kill(metas[i]);
               }
              }
            }
          }
          if (typeof $.v.config.build === 'string') {
            $.w[$.v.config.build] = function (el) {
              $.f.build(el);
            };
          }

          $.w.setTimeout(function () {
            var str = '&type=pidget&sub=' + $.v.config.domain + '&button_count=' + $.v.countButton + '&follow_count=' + $.v.countFollow + '&pin_count=' + $.v.countPin + '&profile_count=' + $.v.countProfile + '&board_count=' + $.v.countBoard;
            $.f.log(str);
          }, 1000);
        },

        // send logging information
        log: function (str) {

            // query always starts with guid
            var query = '?guid=' + $.v.guid;

            // add optional string &foo=bar
            if (str) {
              query = query + str;
            }

            // add the page we're looking at right now
            query = query + '&via=' + encodeURIComponent($.v.here);

            $.f.call($.a.endpoint.log + query, $.f.ping.log);
        },

        // trade a lang for domain and strings
        langToDomain: function (str) {

          // this will run once on init and (eventually) once for every widget that has a data-pin-lang specified
          var langPart, locPart, strParts, checkDomain, thisDomain, domainMatch, langMatch, foundDomain;

          // clean input
          if (!str) {
            str = 'en';
          }
          str = str.toLowerCase();

          // find language part and optional location part
          strParts = str.split('-');
          langPart = strParts[0];
          if (strParts.length === 2) {
            locPart = strParts[1];
          }

          // defaults
          domainMatch = $.a.defaults.domain;
          langMatch = $.a.defaults.lang;
          stringMatch = $.a.defaults.strings;
          assetMatch = $.a.defaults.assets;

          // if this goes to true we will break all loops and return
          foundDomain = false;

          // loop through all the domains we know about
          for (checkDomain in $.a.domains) {
            // not found?
            if (!foundDomain) {
              thisDomain = $.a.domains[checkDomain];
              // loop through all languages found in this domain
              for (i = 0, n = thisDomain.lang.length; i < n; i = i + 1) {
                // match language part or language plus location parts
                if (thisDomain.lang[i] === langPart || thisDomain.lang[i] === langPart + '-' + locPart) {
                  // set matches
                  domainMatch = checkDomain;
                  langMatch = langPart;
                  // match on two-parter like br-pt? you're done
                  if (thisDomain.lang[i] === langPart + '-' + locPart) {
                    // return full language string
                    langMatch = langPart + '-' + locPart;
                    // found = true will break outer loop
                    foundDomain = true;
                    // break inner loop
                    break;
                  }
                }
              }
            }
          }

          thisDomain = $.a.domains[domainMatch];
          // set strings if available (defaults to en)
          if (thisDomain.assets) {
            assetMatch = thisDomain.assets;
          }
          // set strings if available (defaults to en)
          if (thisDomain.strings && $.a.strings[thisDomain.strings]) {
            stringMatch = thisDomain.strings;
          }

          // if we see www:th, the domain is www
          domainMatch = domainMatch.split(':')[0];

          // this result should always be fully populated
          return {'lang': langMatch, 'domain': domainMatch, 'strings': stringMatch, 'assets':  assetMatch };

        },

        init: function () {
          $.d.b = $.d.getElementsByTagName('BODY')[0];

          // no document body? this page is broken
          if (!$.d.b) {
            return;
          }

          $.d.h = $.d.getElementsByTagName('HEAD')[0];

          // just a few variables that need to be shared throughout this script
          $.v = {
            'resolution': 1,
            'here': $.d.URL.split('#')[0],
            'hazFloatingButton': false,
            'config': {
              // button config defaults to 20px gray english rectangle
              'color': 'gray',
              'assets': 'en',
              'height': '20',
              'shape': 'rect'
            },
            'strings': $.a.strings.en,
            'guid': '',
            'buttonId': 0,
            'userAgent': $.w.navigator.userAgent,
            'countButton': 0,
            'countFollow': 0,
            'countPin': 0,
            'countBoard': 0,
            'countProfile': 0
          };

          // are we using IE?
          if ($.v.userAgent.match(/MSIE/) !== null) {
            // we're on Internet Explorer. Don't check margin or padding on HTML when determing hoverbutton position.
            $.v.hazIE = true;
          }

          // make a 12-digit base-60 number for conversion tracking
          for (var i = 0; i < 12; i = i + 1) {
            $.v.guid = $.v.guid + '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz'.substr(Math.floor(Math.random() * 60), 1);
          }

          // got Retina?
          if ($.w.devicePixelRatio && $.w.devicePixelRatio >= 2) {
            $.v.resolution = 2;
          }

          // find the script node we are running now
          // remove it and set config options if we find any
          $.f.config();

          // choose the right strings and domains for widgets on this page

          var lang = $.a.defaults.lang;

          // do we have a valid global language request in script node
          if ($.v.config.lang && typeof $.a.strings[$.v.config.lang] === 'object') {
            lang = $.v.config.lang;
          } else {
            // do we have an HTML lang="foo" directive
            var lang = $.d.getElementsByTagName('HTML')[0].getAttribute('lang');

            // not found, look for a META
            if (!lang) {
              var meta = $.d.getElementsByTagName('META');
              for (i = 0, n = meta.length; i < n; i = i + 1) {
                var equiv = $.f.get(meta[i], 'http-equiv');
                if (equiv) {
                  // match content-language or Content-Language
                  equiv = equiv.toLowerCase();
                  if (equiv === 'content-language') {
                    var content = $.f.get(meta[i], 'content');
                    // is there something in content-language?
                    if (content) {
                      // use this, stop looking at metas
                      lang = content.split('-')[0];
                      break;
                    }
                  }
                }
              }
            }
          }

          if ($.v.config.lang) {
            // a language has been specified in the call to pinit.js
            lang = $.v.config.lang;
          }

          // once we know our lang, map language, domain, and assets
          var map = $.f.langToDomain(lang);

          $.v.config.assets = map.assets;
          $.v.config.lang = map.lang;
          $.v.config.domain = map.domain;

          $.v.endpoint = {
            'pinterest': '//' + map.domain + '.pinterest.com',
            'repin': '//' + map.domain + '.pinterest.com/pin/%s/repin/x/',
            'create': '//' + map.domain + '.pinterest.com/pin/create/button/?'
          }

          // note: build can also be triggered by a user-specified request passed in data-pin-build
          $.f.build();

          $.f.presentation();
          $.f.behavior();

        }
      };
    }())
  };

  $.f.init();

}(window, document, {
  'k': 'PIN_' + new Date().getTime(),
  // This regex is intentionally lax so it does not need to be
  // actively maintained each time a new international subdomain is added.
  // As a side effect, widget links with bogus domains (e.g. xyz.pinterest.com)
  // will be rendered into widgets.
  'myDomain': /^https?:\/\/(([a-z]{1,3})\.)?pinterest\.com\//,
  'me': /pinit\.js$/,
  'floatingButtonOffsetTop': 10,
  'floatingButtonOffsetLeft': 10,
  // www.pinterest.com and business.pinterest.com endpoints should be
  // initialized in internationalizeUrls so they use the right international subdomain
  'endpoint': {
    'bookmark': 'https://assets.pinterest.com/js/pinmarklet.js',
    'count': 'https://widgets.pinterest.com/v1/urls/count.json',
    'pin': 'https://widgets.pinterest.com/v3/pidgets/pins/info/',
    'board': 'https://widgets.pinterest.com/v3/pidgets/boards/',
    'user': 'https://widgets.pinterest.com/v3/pidgets/users/',
    'log': 'https://log.pinterest.com/'
  },
  'config': {
    'pinItCountPosition': {
      'none': true,
      'above': true,
      'beside': true
    }
  },
  'pinWidget': {
    'domain':  /(jp)/,
    'lang': /(ja)/,
    'imgKey': '237x',
    'medium': {
      'width': 345,
      'ratio': 1.46
    },
    'large': {
      'width': 600,
      'ratio': 2.54
    }
  },
  'minImgSize': 119,
  // source 6 means "pinned with the externally-hosted Pin It button"
  'countSource': 6,
  'dataAttributePrefix': 'data-pin-',
  // valid config parameters
  'configParam': [ 'build', 'debug', 'style', 'hover', 'zero', 'color', 'height', 'lang', 'shape', 'error'],
  // configuration for the pop-up window
  'pop': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=750,height=320,left=0,top=0',
  'popLarge': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=900,height=500,left=0,top=0',
  'popHuge': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=1040,height=640,left=0,top=0',
  // secure and non-secure content distribution networks
  'cdn': 'https://s-passets.pinimg.com',
  // tiled image settings
  'tile': {
    'scale': {
      'minWidth': 60,
      'minHeight': 60,
      'width': 92,
      'height': 175
    },
    'minWidthToShowAuxText': 150,
    'minContentWidth': 120,
    'minColumns': 1,
    'maxColumns': 8,
    'style': {
      'margin': 2,
      'padding': 10
    }
  },
  // valid localized assets
  'hazAssets': {
    'en': true,
    'ja': true
  },
  // default values
  'defaults': {
    'domain': 'www',
    'strings': 'en',
    'lang': 'en',
    'assets': 'en'
  },
  'domains': {
    'www': { 'lang': ['en'], 'strings': 'en', 'assets': 'en' },
    'br': { 'lang': ['pt-br'], 'strings': 'pt-br'},
    'cz': { 'lang': ['cs'], 'strings': 'cs'},
    'de': { 'lang': ['de'], 'strings': 'de'},
    'dk': { 'lang': ['da'], 'strings': 'da'},
    'es': { 'lang': ['es'], 'strings': 'es'},
    'fi': { 'lang': ['fi'], 'strings': 'fi'},
    'fr': { 'lang': ['fr'], 'strings': 'fr'},
    'uk': { 'lang': ['en-uk', 'en-gb', 'en-ie'], 'strings': 'en'},
    'gr': { 'lang': ['el'], 'strings': 'el'},
    'hu': { 'lang': ['hu'], 'strings': 'hu'},
    'id': { 'lang': ['id', 'in'], 'strings': 'id'},
    'in': { 'lang': ['hi'], 'strings': 'hi'},
    'it': { 'lang': ['it'], 'strings': 'it'},
    'jp': { 'lang': ['ja'], 'strings': 'ja', 'assets': 'ja'},
    'kr': { 'lang': ['ko', 'kr'], 'strings': 'ko'},
    'www:my': { 'lang': ['ms'], 'strings': 'ms'},
    'nl': { 'lang': ['nl'], 'strings': 'nl'},
    'no': { 'lang': ['nb'], 'strings': 'nb'},
    'www:ph': { 'lang': ['tl'], 'strings': 'tl'},
    'pl': { 'lang': ['pl'], 'strings': 'pl' },
    'pt': { 'lang': ['pt'], 'strings': 'pt'},
    'ro': { 'lang': ['ro'], 'strings': 'ro'},
    'ru': { 'lang': ['ru'], 'strings': 'ru'},
    'sk': { 'lang': ['sk'], 'strings': 'sk'},
    'se': { 'lang': ['sv', 'sv-se'], 'strings': 'sv'},
    'www:th': { 'lang': ['th'], 'strings': 'th'},
    'tr': { 'lang': ['tr'], 'strings': 'tr' },
    'www:ua': { 'lang': ['ua'], 'strings': 'ua'},
    'www:vn': { 'lang': ['vi'], 'strings': 'vi'}
  },
  'strings': {
   'cs': {
      'seeOn': 'Zobrazit na',
      'attribTo': 'od'
    },
    'da': {
      'seeOn': 'Se p&#229;',
      'attribTo': 'af'
    },
    'de': {
      'seeOn': 'Ansehen auf',
      'attribTo': 'von'
    },
    'el': {
      'seeOn': '&delta;&epsilon;&#943;&tau;&epsilon; &tau;&omicron; &sigma;&tau;&omicron;',
      'attribTo': '&alpha;&pi;&omicron;&delta;&#943;&delta;&epsilon;&tau;&alpha;&iota; &sigma;&tau;&omicron;'
    },
    'en': {
      'seeOn': 'See On',
      'attribTo': 'by'
    },
    'en-gb': {
      'seeOn': 'See On',
      'attribTo': 'by'
    },
    'en-uk': {
      'seeOn': 'See On',
      'attribTo': 'by'
    },
    'es': {
      'seeOn': 'Ver en',
      'attribTo': 'por'
    },
    'fi': {
      'seeOn': 'Katso palvelussa',
      'attribTo': 'tekij&#228;'
    },
    'fr': {
      'seeOn': 'Voir sur',
      'attribTo': 'par'
    },
    'hi': {
      'seeOn': '&#2346;&#2352; &#2342;&#2375;&#2326;&#2375;&#2306;',
      'attribTo': '&#2325;&#2379; &#2358;&#2381;&#2352;&#2375;&#2351; &#2342;&#2375;&#2344;&#2366;'
    },
    'hu': {
      'seeOn': 'L&aacute;sd itt',
      'attribTo': 'Hozz&aacute;rendelve a k&ouml;vetkez&#337;h&ouml;z:'
    },
    'id': {
      'seeOn': 'Lihat di',
      'attribTo': 'oleh'
    },
    'it': {
      'seeOn': 'Visualizza in',
      'attribTo': 'da'
    },
    'ko': {
      'seeOn': '&#45796;&#51020;&#50640;&#49436; &#48372;&#44592;',
      'attribTo': '&#51060; &#54592;&#54632;'
    },
    'ja': {
      'seeOn': '&#12391;&#35211;&#12427;',
      'seeOnTextAfterLogo': true,
      'attribTo': ''
    },
    'ms': {
      'seeOn': 'lihat di',
      'attribTo': 'attribut ke'
    },
    'nb': {
      'seeOn': 'Vis p&#229;',
      'attribTo': 'av'
    },
    'nl': {
      'seeOn': 'Bekijken op',
      'attribTo': 'door'
    },
    'pl': {
      'seeOn': 'Zobacz na',
      'attribTo': 'przez'
    },
    'pt': {
      'seeOn': 'Ver em',
      'attribTo': 'por'
    },
    'pt-br': {
      'seeOn': 'Ver em',
      'attribTo': 'por'
    },
    'ro': {
      'seeOn': 'vezi pe',
      'attribTo': 'de la'
    },
    'ru': {
      'seeOn': '&#1055;&#1086;&#1089;&#1084;&#1086;&#1090;&#1088;&#1077;&#1090;&#1100; &#1074;',
      'attribTo': '&#1087;&#1086;&#1083;&#1100;&#1079;&#1086;&#1074;&#1072;&#1090;&#1077;&#1083;&#1077;&#1084;'
    },
    'tl': {
      'seeOn': 'tingnan sa',
      'attribTo': ''
    },
    'th': {
      'seeOn': '&#3604;&#3641;&#3651;&#3609;',
      'attribTo': '&#3648;&#3586;&#3637;&#3618;&#3609;&#3650;&#3604;&#3618;'
    },
    'sk': {
      'seeOn': 'Zobrazi&#357; na',
      'attribTo': 'od'
    },
    'sv': {
      'seeOn': 'Visa p&#229;',
      'attribTo': 'av'
    },
    'tr': {
      'seeOn': '&#220;zerinde g&#246;r',
      'attribTo': 'taraf&#305;ndan'
    },
    'ua': {
      'seeOn': '&#1076;&#1080;&#1074;&#1110;&#1090;&#1100;&#1089;&#1103; &#1085;&#1072;',
      'attribTo': '&#1086;&#1087;&#1080;&#1089;'
    },
    'vi': {
      'seeOn': 'xem tr&ecirc;n',
      'attribTo': '&#273;&#432;a v&agrave;o'
    }
  },
  // CSS rules
  'rules': [

    // PIN IT BUTTON -- 20px

    'a._pin_it_button_20 { cursor: pointer; background-repeat: none; background-size: 40px 60px; height: 20px; padding: 0; vertical-align: baseline; text-decoration: none; width: 40px; background-position: 0 -20px }',
    'a._pin_it_button_20:hover { background-position: 0 0px }',
    'a._pin_it_button_20:active, a._pin_it_button_20._hazClick { background-position: 0 -40px }',
    'a._pin_it_button_inline_20 { cursor: pointer; position: relative; display: inline-block; }',
    'a._pin_it_button_floating_20 { cursor: pointer; position: absolute; }',


    // background images
    'a._pin_it_button_en_20_red { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_red_20__rez.png); }',
    'a._pin_it_button_en_20_white { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_white_20__rez.png); }',
    'a._pin_it_button_en_20_gray { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_gray_20__rez.png); }',

    'a._pin_it_button_ja_20_red { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_red_20__rez.png); }',
    'a._pin_it_button_ja_20_white { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_white_20__rez.png); }',
    'a._pin_it_button_ja_20_gray { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_gray_20__rez.png); }',

    // the count
    'a._pin_it_above_20 span._pin_it_button_count { background: transparent url(_cdn/images/pidgets/count_north_white_rect_20__rez.png) 0 0 no-repeat; background-size: 40px 29px; position: absolute; bottom: 21px; left: 0px; height: 29px; width: 40px; font: 12px Arial, Helvetica, sans-serif; line-height: 24px; text-indent: 0;}',
    'a._pin_it_button_20 span._pin_it_button_count { position: absolute; color: #777; text-align: center; text-indent: 0; }',
    'a._pin_it_beside_20 span._pin_it_button_count, a._pin_it_beside_20 span._pin_it_button_count i { background-color: transparent; background-repeat: no-repeat; background-image: url(_cdn/images/pidgets/count_east_white_rect_20__rez.png); }',
    'a._pin_it_beside_20 span._pin_it_button_count { padding: 0 3px 0 10px; background-size: 45px 20px; background-position: 0 0; position: absolute; top: 0; left: 41px; height: 20px; font: 10px Arial, Helvetica, sans-serif; line-height: 20px; }',
    'a._pin_it_beside_20 span._pin_it_button_count i { background-position: 100% 0; position: absolute; top: 0; right: -2px; height: 20px; width: 2px; }',
    'a._pin_it_button_20._pin_it_above { margin-top: 20px; }',

    // some space for count
    'a._pin_it_above_20_pad { margin-top: 30px; }',
    'a._pin_it_beside_20_pad { margin-right: 45px; }',

    // PIN IT BUTTON -- 28px

    'a._pin_it_button_28 { cursor: pointer; background-repeat: none; background-size: 56px 84px; height: 28px; padding: 0; vertical-align: baseline; text-decoration: none; width: 56px; background-position: 0 -28px }',
    'a._pin_it_button_28:hover { background-position: 0 0px }',
    'a._pin_it_button_28:active, a._pin_it_button_28._hazClick { background-position: 0 -56px }',
    'a._pin_it_button_inline_28 { cursor: pointer; position: relative; display: inline-block; }',
    'a._pin_it_button_floating_28 { cursor: pointer; position: absolute; }',

    // some space for count
    'a._pin_it_above_28_pad { margin-top: 38px;}',
    'a._pin_it_beside_28_pad { margin-right: 50px;}',

    // background images
    'a._pin_it_button_en_28_red { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_red_28__rez.png); }',
    'a._pin_it_button_en_28_white { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_white_28__rez.png); }',
    'a._pin_it_button_en_28_gray { background-image: url(_cdn/images/pidgets/pinit_bg_en_rect_gray_28__rez.png); }',

    'a._pin_it_button_ja_28_red { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_red_28__rez.png); }',
    'a._pin_it_button_ja_28_white { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_white_28__rez.png); }',
    'a._pin_it_button_ja_28_gray { background-image: url(_cdn/images/pidgets/pinit_bg_ja_rect_gray_28__rez.png); }',

    // round buttons - red, english, 16/32px only

    'a._pin_it_button_en_16_red_round, a._pin_it_button_en_32_red_round { background-repeat: none; margin: 0; padding: 0; vertical-align: baseline; text-decoration: none; }',
    'a._pin_it_button_en_16_red_round { height: 16px; width: 16px; background-size: 16px 16px; background-image: url(_cdn/images/pidgets/pinit_bg_en_round_red_16__rez.png);}',
    'a._pin_it_button_en_32_red_round { height: 32px; width: 32px; background-size: 32px 32px; background-image: url(_cdn/images/pidgets/pinit_bg_en_round_red_32__rez.png);}',
    'a._pin_it_button_inline_en_16_red_round, a._pin_it_button_inline_en_32_red_round { position: relative; display: inline-block; }',
    'a._pin_it_button_floating_en_16_red_round, a._pin_it_button_floating_en_32_red_round  { position: absolute; }',

    // the count
    'a._pin_it_button_28 span._pin_it_button_count { position: absolute; color: #777; text-align: center; text-indent: 0; }',
    'a._pin_it_above_28 span._pin_it_button_count { background: transparent url(_cdn/images/pidgets/count_north_white_rect_28__rez.png) 0 0 no-repeat; background-size: 56px 37px; position: absolute; bottom: 29px; left: 0px; height: 37px; width: 56px; font: 15px Arial, Helvetica, sans-serif; line-height: 28px; text-indent: 0;}',
    'a._pin_it_beside_28 span._pin_it_button_count, a._pin_it_beside_28 span._pin_it_button_count i { background-color: transparent; background-repeat: no-repeat; background-image: url(_cdn/images/pidgets/count_east_white_rect_28__rez.png); }',
    'a._pin_it_beside_28 span._pin_it_button_count { padding: 0 3px 0 10px; background-size: 63px 28px; background-position: 0 0; position: absolute; top: 0; left: 57px; height: 28px; font: 12px Arial, Helvetica, sans-serif; line-height: 28px; }',
    'a._pin_it_beside_28 span._pin_it_button_count i { background-position: 100% 0; position: absolute; top: 0; right: -2px; height: 28px; width: 2px; }',
    'a._pin_it_button_28._pin_it_above { margin-top: 28px; }',

    // FOLLOW ME ON PINTEREST BUTTON

    // background images (last selector) have no semicolon, so they don't get an !important
    'a._follow_me_button, a._follow_me_button i { background-size: 200px 60px; background: transparent url(_cdn/images/pidgets/bfs_rez.png) 0 0 no-repeat }',
    'a._follow_me_button { cursor: pointer; color: #444; display: inline-block; font: bold normal normal 11px/20px "Helvetica Neue",helvetica,arial,san-serif; height: 20px; margin: 0; padding: 0; position: relative; text-decoration: none; text-indent: 19px; vertical-align: baseline;}',
    'a._follow_me_button:hover { background-position: 0 -20px}',
    'a._follow_me_button:active  { background-position: 0 -40px}',

    // b = logo
    'a._follow_me_button b { position: absolute; top: 3px; left: 3px; height: 14px; width: 14px; background-size: 14px 14px; background-image: url(_cdn/images/pidgets/log_rez.png); }',

    // i = right cap
    'a._follow_me_button i { position: absolute; top: 0; right: -4px; height: 20px; width: 4px; background-position: 100% 0px; }',
    'a._follow_me_button:hover i { background-position: 100% -20px;  }',
    'a._follow_me_button:active i { background-position: 100% -40px; }',

    // TALL VERSION OF FOLLOW ME ON PINTEREST BUTTON

    // background images (last selector) have no semicolon, so they don't get an !important
    'a._follow_me_button_28, a._follow_me_button_28 i { background-size: 400px 84px; background: transparent url(_cdn/images/pidgets/bft_rez.png) 0 0 no-repeat }',
    'a._follow_me_button_28 { cursor: pointer; color: #444; display: inline-block; font: bold normal normal 13px/28px "Helvetica Neue",helvetica,arial,san-serif; height: 28px; margin: 0; padding: 0; position: relative; text-decoration: none; text-indent: 33px; vertical-align: baseline;}',
    'a._follow_me_button_28:hover { background-position: 0 -28px}',
    'a._follow_me_button_28:active  { background-position: 0 -56px}',

    // b = logo
    'a._follow_me_button_28 b { position: absolute; top: 5px; left: 10px; height: 18px; width: 18px; background-size: 18px 18px; background-image: url(_cdn/images/pidgets/smt_rez.png); }',

    // i = right cap
    'a._follow_me_button_28 i { position: absolute; top: 0; right: -10px; height: 28px; width: 10px; background-position: 100% 0px; }',
    'a._follow_me_button_28:hover i { background-position: 100% -28px;  }',
    'a._follow_me_button_28:active i { background-position: 100% -56px; }',

    // EMBEDDED PIN

    // main container
    'span._embed_pin { -webkit-font-smoothing: antialiased; cursor: pointer; display: inline-block; text-align: center; overflow: hidden; vertical-align: top; width: 237px }',
    'span._embed_pin._medium { width: 345px; }',
    'span._embed_pin._large { width: 600px; }',

    // reset styles
    'span._embed_pin img { border: 0; padding: 0; box-shadow: none; }',

    // shadow and rounded corner
    'span._embed_pin._fancy { background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .33); border-radius: 3px; }',

    // thumbnail link has relative position
    'span._embed_pin a._embed_pin_link { display: block;  margin: 0 auto; padding: 0; position: relative;  line-height: 0}',

    // border under images separate white backgrounds from main body
    'span._embed_pin img._embed_pin_link_img { border: 0; margin: 0; padding: 0; border-bottom: 1px solid rgba(0, 0, 0, .09);}',

    // repin button
    'span._embed_pin a._embed_pin_link i._repin { left: 12px; top: 12px; position: absolute; height: 20px; width: 40px; background-size: 40px 60px;  background: transparent url(_cdn/images/pidgets/pinit_bg_en_rect_red_20__rez.png) }',
    'span._embed_pin a._embed_pin_link i._repin_ja { left: 12px; top: 12px; position: absolute; height: 20px; width: 40px; background-size: 40px 60px; background: transparent url(_cdn/images/pidgets/pinit_bg_ja_rect_red_20__rez.png) }',
    'span._embed_pin a._embed_pin_link i._repin:hover, span._embed_pin a._embed_pin_link i._repin_ja:hover { background-position: 0 -20px; }',
    'span._embed_pin a._embed_pin_link i._repin._hazClick, span._embed_pin a._embed_pin_link i._repin_ja._hazClick { background-position: 0 -40px; }',

    // play button for animated GIFs
    'span._embed_pin a._embed_pin_link i._play { display: block; width: 50px; white-space: pre; font-family: "Helvetica Neue",helvetica,arial,san-serif; font-weight: bold; font-style: normal; font-size: 9px; line-height: 12px; margin: 0; position: absolute; bottom: 12px; left: 12px; text-decoration: none; background: rgba(0, 0, 0, .4); color: rgba(255, 255, 255, 1); border-radius: 13px; padding: 5px 0; box-shadow: 0 0 2px rgba(0, 0, 0, .2); border: 2px solid rgba(255, 255, 255, .68);}',
    'span._embed_pin a._embed_pin_link i._play:hover { background: rgba(0, 0, 0, .8); color: #fff; }',

    // description and attribution blocks
    'span._embed_pin span._embed_pin_desc { color: #363636; white-space: normal; border-bottom: 1px solid rgba(0, 0, 0, .09);; display: block; font-family: "Helvetica Neue", arial, sans-serif; font-size: 13px; line-height: 17px; padding: 12px; text-align: left; }',
    'span._embed_pin span._embed_pin_attrib { color: #a8a8a8; font-family: "Helvetica Neue", sans-serif; font-size: 11px; line-height: 18px; margin-top: 12px; font-weight: bold; display: block;}',
    'span._embed_pin span._embed_pin_attrib img._embed_pin_attrib_icon { height: 16px; width: 16px; vertical-align: middle; padding: 0; margin: 0 5px 0 0; float: left;}',
    'span._embed_pin span._embed_pin_attrib a { color: #a8a8a8; text-decoration: none;}',
    'span._embed_pin span._embed_pin_stats { display: block; }',
    'span._embed_pin span._embed_pin_stats span._embed_pin_stats_repin_count, span._embed_pin span._embed_pin_stats span._embed_pin_stats_like_count { display: inline-block; padding-left: 17px; padding-right: 10px; color: #a8a8a8; font-family: "Helvetica Neue", sans-serif; font-size: 11px; line-height: 12px; margin-top: 12px; font-weight: bold; }',
    'span._embed_pin span._embed_pin_stats span._embed_pin_stats_repin_count { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAAAAABq7uO+AAAASklEQVQI10WNMQrAMBRCvf/Z3pQcImPplsIPdqhNXOSJqLxVtnWQsuUO9IM3cHlV8dSSDZQHAOPH2YA2FU+qtH7MRhaVh/xt/PQCEW6N4EV+CPEAAAAASUVORK5CYII=) 0 0 no-repeat; }',
    'span._embed_pin span._embed_pin_stats span._embed_pin_stats_like_count { background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAAAAAClR+AmAAAAUElEQVR4AT2HMQpFIQwEc/+zbXhFLBW8QUihIAT2E8Q/xe6M0Jv2zK7NKUcBzAlAjzjqtdZl4c8S2nOjMPS6BoWMr/wLVnAbYJs3mGMkXzx+OeRqUf5HHRoAAAAASUVORK5CYII=) 0 2px no-repeat; }',
    'span._embed_pin span._embed_pin_text { padding: 12px; position: relative; text-decoration: none; display: block; font-weight: bold; color: #b7b7b7; font-family: "Helvetica Neue", arial, sans-serif; font-size: 11px; line-height: 14px; height: 30px; text-align: left; }',
    'span._embed_pin span._embed_pin_text img._embed_pin_text_avatar { border-radius: 15px; border: none; overflow: hidden; height: 30px; width: 30px; vertical-align: middle; margin: 0 8px 12px 0; float: left;}',
    'span._embed_pin span._embed_pin_text span._embed_pin_text_container_pinner, span._embed_pin a._embed_pin_text span._embed_pin_text_container_board { display: block; width: 175px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}',
    'span._embed_pin span._embed_pin_text span._embed_pin_text_container_pinner { color: #777;}',

    // EMBEDDED BOARDS

    // main container
    'span._embed_grid { display: inline-block; margin: 0; padding:10px 0; position: relative; text-align: center}',

    // border and corners
    'span._embed_grid._fancy { background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .33); border-radius: 3px; }',

    // header container
    'span._embed_grid span._embed_grid_hd { display: block; margin: 0 10px; padding: 0; height: 45px; position: relative;}',

    // avatar
    'span._embed_grid span._embed_grid_hd a._avatar { position: absolute; top: 0; left: 0; height: 36px; width: 36px; }',
    'span._embed_grid span._embed_grid_hd a._avatar img { position: relative; height: 36px; width: 36px; min-height: 36px; min-width: 36px; margin: 0; padding: 0; border-radius: 3px; border: none;}',

    // header
    'span._embed_grid span._embed_grid_hd a { text-decoration: none; border: none; background: transparent; cursor: pointer; white-space: nowrap; position: absolute; left: 44px; text-align: left; overflow: hidden; text-overflow: ellipsis; }',
    'span._embed_grid span._embed_grid_hd a:hover { text-decoration: none; background: inherit; }',
    'span._embed_grid span._embed_grid_hd a:active { text-decoration: none; background: inherit; }',
    // top line
    'span._embed_grid span._embed_grid_hd a._embed_grid_first { top: 2px; font-family: helvetica, sans-serif; font-weight: bold; color:#333; font-size: 14px; line-height: 16px; }',
    // second line
    'span._embed_grid span._embed_grid_hd a._embed_grid_second { bottom: 11px; font-family: helvetica, sans-serif; color:#8e8e8e; font-size: 12px; line-height: 14px; }',
    // mid line
    'span._embed_grid span._embed_grid_hd a._embed_grid_mid { top: 12px; font-family: helvetica, sans-serif; font-weight: bold; color:#333; font-size: 14px; line-height: 16px; }',

    // grid body - note final selector for overflow:hidden won't have an !important, so we can override
    'span._embed_grid span._embed_grid_bd { display:block; margin: 0 10px; border-radius: 2px; position: relative; overflow: hidden }',

    // set me if we're on an OS that doesn't supply scrollbars
    'span._embed_grid span._embed_grid_scrolling_okay { overflow: auto; }',

    // grid container -- allows us to halt scrolling before we get to the ragged bottom
    'span._embed_grid span._embed_grid_bd span._embed_grid_ct { display:block; position: relative; overflow: hidden; }',

    // each thumbnail
    'span._embed_grid span._embed_grid_bd a._embed_grid_th { cursor: pointer; display: inline-block; position: absolute; overflow: hidden; }',
    // inset shadow mask
    'span._embed_grid span._embed_grid_bd a._embed_grid_th::before { position: absolute; content:""; z-index: 2; top: 0; left: 0; right: 0; bottom: 0; box-shadow: inset 0 0 2px #888; }',
    // thumbnail image
    'span._embed_grid span._embed_grid_bd a._embed_grid_th img._embed_grid_img { border: none; margin-left: 0; margin-right: 0; margin-bottom: 0; padding: 0;position: absolute; top: 50%; left: 0; }',
    // footer button
    'a._embed_grid_ft { cursor: pointer; text-shadow: 0 1px #fff; display: block; text-align: center; border: 1px solid #ccc; margin: 10px 10px 0; height: 31px; line-height: 30px;border-radius: 2px; text-decoration: none; font-family: Helvetica; font-weight: bold; font-size: 13px; color: #746d6a; background: #f4f4f4 url(_cdn/images/pidgets/board_button_link.png) 0 0 repeat-x}',
    'a._embed_grid_ft:hover { text-decoration: none; background: #fefefe url(_cdn/images/pidgets/board_button_hover.png) 0 0 repeat-x}',
    'a._embed_grid_ft:active { text-decoration: none; background: #e4e4e4 url(_cdn/images/pidgets/board_button_active.png) 0 0 repeat-x}',
    'a._embed_grid_ft span._embed_grid_ft_logo { vertical-align: top; display: inline-block; margin-left: 2px; height: 30px; width: 66px; background: transparent url(_cdn/images/pidgets/board_button_logo.png) 50% 48% no-repeat; }',

    // leave this at the bottom, to avoid trailing commas
    '._hidden { display:none; }'
  ]
}));

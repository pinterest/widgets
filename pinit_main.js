/* jshint indent: false, maxlen: false */

// fix hoverbutton position for sites with margin or padding on HTML element

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

        call: function (url, func) {
          var n, id, sep = '?';

          n = $.f.callback.length;
          id = $.a.k + '.f.callback[' + n + ']';

          // create the callback
          $.f.callback[n] = function (r) {
            func(r, n);
            $.f.kill(id);
          };

          // some calls may come with a query string already set
          if (url.match(/\?/)) {
            sep = '&';
          }

          // make and call the new script node
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
          var css, cdn, rules;

          css = $.f.make({'STYLE': {'type': 'text/css'}});

          // suspenders AND belt; if some weird protocol sneaks through, default to http
          cdn = $.a.cdn[$.v.protocol] || $.a.cdn['http:'];

          rules = $.a.rules.join('\n');

          // each rule has our randomly-created key at its root to minimize style collisions
          rules = rules.replace(/\._/g, '.' + a.k + '_');

          // every rule ending in ; also gets !important
          rules = rules.replace(/;/g, '!important;');

          // cdn
          rules = rules.replace(/_cdn/g, cdn);

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
            'config': $.f.getData(el, 'config') || 'none'
          };

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

            $.s.floatingButton = $.f.make({'A': {'className': buttonClass, 'title': 'Pin it!', 'target': '_blank'}});
            $.f.set($.s.floatingButton, $.a.dataAttributePrefix + 'log', 'button_pinit_floating');
            $.d.b.appendChild($.s.floatingButton);

            // get position, start href
            var p = $.f.getPos(img), href = $.v.endpoint.create;
            // set the button href
            href = href + 'url=' + encodeURIComponent($.d.URL) + '&media=' + encodeURIComponent(img.src) + '&description=' + encodeURIComponent(img.getAttribute('data-pin-description') || img.title || img.alt || $.d.title);
            $.s.floatingButton.href = href;
            // pop new window and hide on click
            $.s.floatingButton.onclick = function () {
              $.w.open(this.href, 'pin' + new Date().getTime(), $.a.pop);
              $.f.hideFloatingButton();
              $.v.hazFloatingButton = false;
              // don't open href; we've successfully popped a window
              return false;
            };
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
            if (el.tagName === 'IMG' && el.src && !$.f.getData(el, 'no-hover') && !$.f.get(el, 'nopin') && $.v.config.hover) {
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
          var el, log, pinId;
          el = $.f.getEl(v);
          if (el) {

            // log this click
            log = $.f.getData(el, 'log');
            if (log) {
              $.f.log('&type=' + log + '&href=' + encodeURIComponent(el.href || $.f.getData(el, 'href')));
              // gray out the button
              if (!el.className.match(/hazClick/)) {
                el.className = el.className + ' ' + $.a.k + '_hazClick';
              }
            }

            // pop repin dialogue
            pinId = $.f.getData(el, 'pin-id');
            if (pinId) {
              $.w.open($.v.endpoint.repin.replace(/%s/, pinId), 'pin' + new Date().getTime(), $.a.pop);
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
            $.d.b.setAttribute('data-pin-hover', true);
            $.f.listen($.d.b, 'mouseover', $.f.over);
          }

          // log calls may be dropped on the floor by the server; clean them up
          var cleanLog = function () {
            var s = $.d.getElementsByTagName('SCRIPT');
            for (var i = 0, n = s.length; i < n; i = i + 1) {
              if (s[i] && s[i].src && s[i].src.match(/^https?:\/\/logc?\.pinterest\.com/)) {
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

        // make an avatar for board header
        avatar: function (url, href) {
          var src = url.replace(/_30.jpg/, '_60.jpg');
          var span = $.f.make({'A': {'className': $.a.k + '_avatar', 'href': href, 'target': '_blank'}});
          var img = $.f.make({'IMG': {'src': src }});
          span.appendChild(img);
          return span;
        },

        // arrange pin images neatly on a board
        grid: function (parent, data, log) {
          if (!log) {
            log = 'embed_board';
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
            var thumb = $.f.make({'A': {'className': $.a.k + '_embed_grid_th', 'title': temp.innerHTML}});

            $.f.set(thumb, $.a.dataAttributePrefix + 'pin-id', data[i].id);
            $.f.set(thumb, $.a.dataAttributePrefix + 'log', log);
            var scale = {
              'height': data[i].images['237x'].height * (scaleFactors.width / data[i].images['237x'].width),
              'width': scaleFactors.width
            };
            var img = $.f.make({'IMG': {'src': data[i].images['237x'].url, 'nopin': 'true', 'height': scale.height, 'width': scale.width, 'className': $.a.k + '_embed_grid_img', 'alt': data[i].description}});
            img.style.height = scale.height + 'px';
            img.style.width = scale.width + 'px';
            img.style.marginTop = 0 - (scale.height / $.a.tile.style.margin) + 'px';
            if (scale.height > scaleFactors.height) {
              scale.height = scaleFactors.height;
            }
            thumb.appendChild(img);
            thumb.style.height = scale.height + 'px';
            thumb.style.width = scale.width + 'px';
            if (!h[c]) {
              h[c] = 0;
            }
            thumb.style.top = h[c] + 'px';
            thumb.style.left = (c * (scaleFactors.width + $.a.tile.style.margin)) + 'px';
            h[c] = h[c] + scale.height + $.a.tile.style.margin;
            thumb.appendChild(img);
            ct.appendChild(thumb);
            c = (c + 1) % columns;
          }

          var minHeight = 10000;
          for (var i = 0; i < h.length; i = i + 1) {
            if (h[i] < minHeight) {
              minHeight = h[i];
            }
          }
          ct.style.height = minHeight + 'px';
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
          var avatar = $.f.avatar(r.data.user.image_small_url, go);
          $.f.set(avatar, $.a.dataAttributePrefix + 'log', log);
          hd.appendChild(avatar);

          if (showSecond) {
            // showing first and second lines
            var first = $.f.make({'A': {'className': $.a.k + '_embed_grid_first', 'innerHTML': $.f.filter(r.data.user.full_name), 'target': '_blank', 'href': go }});
            first.style.width = ($.v.renderedWidth) - 45 + 'px';
            $.f.set(first, $.a.dataAttributePrefix + 'log', log);
            hd.appendChild(first);
            var second = $.f.make({'A': {'className': $.a.k + '_embed_grid_second', 'innerHTML':  $.f.filter(r.data.board.name), 'target': '_blank', 'href': go }});
            second.style.width = ($.v.renderedWidth) - 45 + 'px';
            $.f.set(second, $.a.dataAttributePrefix + 'log', log);
            hd.appendChild(second);
          } else {
            // only showing one line; center it vertically
            var mid = $.f.make({'A': {'className': $.a.k + '_embed_grid_mid', 'innerHTML': $.f.filter(r.data.user.full_name), 'target': '_blank', 'href': go }});
            mid.style.width = ($.v.renderedWidth) - 45 + 'px';
            $.f.set(mid, $.a.dataAttributePrefix + 'log', log);
            hd.appendChild(mid);
          }

          return hd;
        },

        // make a board footer
        makeFooter: function (a, type, lang) {
          var ft, logo, see, go;

          go = $.v.endpoint.pinterest + a.href.split('.com')[1];

          ft = $.f.make({'A': { 'className': $.a.k + '_embed_grid_ft', 'href': go, 'target': '_blank'}});

          logo = $.f.make({'SPAN': { 'className': $.a.k + '_embed_grid_ft_logo'}});

          var strings = $.v.strings;
          if (lang && $.a.strings[lang]) {
            strings = $.a.strings[lang];
          }

          if ($.v.renderedWidth > $.a.tile.minWidthToShowAuxText) {
            see = $.f.make({'SPAN':{'innerHTML': strings.seeOn }});
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

          $.f.set(ft, $.a.dataAttributePrefix + 'log', type);
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
              $.f.debug('API replied with pin data');

              var pin = r.data[0], thumb = {};
              if (pin.images) {
                thumb = pin.images['237x'];
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
                var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_pin', 'data-pin-id': pin.id }});
                var style = $.f.getData(parent, 'style');
                if (style !== 'plain') {
                  container.className = container.className + ' ' + $.a.k + '_fancy';
                }

                // main image
                var link = $.f.make({'A': { 'className': $.a.k + '_embed_pin_link', 'title': pin.description, 'href': $.v.endpoint.pinterest + '/pin/' + pin.id + '/', 'target': '_blank'}});

                var img = $.f.make({'IMG': {'className': $.a.k + '_embed_pin_link_img', 'alt': pin.description, 'nopin': 'true', 'src': thumb.url, 'width': thumb.width, 'height': thumb.height}});
                $.f.set(img, $.a.dataAttributePrefix + 'log', 'image_from_embedded_pin');
                $.f.set(img, $.a.dataAttributePrefix + 'href', $.v.endpoint.pinterest + '/pin/' + pin.id + '/');
                img.style.width = thumb.width + 'px';
                img.style.height = thumb.height + 'px';
                link.appendChild(img);

                // pin it button
                var rpc = $.a.k + '_repin';

                // gross hack
                if (lang === 'ja') {
                  rpc = rpc + '_ja';
                }

                var repin = $.f.make({'I': {'className': rpc, 'data-pin-id': pin.id }});
                $.f.set(repin, $.a.dataAttributePrefix + 'log', 'repin');
                $.f.set(repin, $.a.dataAttributePrefix + 'href', $.v.endpoint.repin.replace(/%s/, pin.id));

                link.appendChild(repin);
                repin.onclick = function () {
                  if (!this.className.match(/hazClick/)) {
                    this.className = this.className + ' ' + $.a.k + '_hazClick';
                  }
                  var href = $.v.endpoint.repin.replace(/%s/, $.f.get(this, 'data-pin-id'));
                  $.w.open(href, 'pin' + new Date().getTime(), $.a.popLarge);
                  return false;
                };

                // open the widget builder with this pin in preview
                var getThis = $.f.make({'I': {'className': $.a.k + '_getThis', 'innerHTML': strings.getThis + '<i></i>', 'data-pin-id': pin.id}});
                link.appendChild(getThis);
                getThis.onclick = function () {
                  var pinId = $.f.get(this, 'data-pin-id');
                  var href = $.v.endpoint.builder + '#do_embed_pin&' + pinId;
                  $.f.log('&type=getThis&href=' + encodeURIComponent(href));
                  $.w.open(href, 'pin' + new Date().getTime());
                  return false;
                };
                $.f.set(link, $.a.dataAttributePrefix + 'log', 'embed_pin');
                container.appendChild(link);

                // description
                var description = $.f.make({'SPAN': {'className': $.a.k + '_embed_pin_desc', 'innerHTML': $.f.filter(pin.description)}});

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
                container.appendChild(description);

                // pinner
                if (pin.pinner && pin.pinner.profile_url && pin.pinner.image_small_url && pin.pinner.full_name) {
                  $.f.debug('Building pinner line');

                  // Hack: Replace domain to get internationalized URL
                  pin.pinner.profile_url = pin.pinner.profile_url.replace($.a.defaults.domain + '.pinterest.com', $.v.endpoint.pinterest);

                  var pinner = $.f.make({'A': {'className': $.a.k + '_embed_pin_text', 'href': pin.pinner.profile_url, 'target': '_blank'}});

                  pinner.appendChild($.f.make({
                    'IMG': {
                      'className': $.a.k + '_embed_pin_text_avatar',
                      'src': pin.pinner.image_small_url
                    }
                  }));
                  pinner.appendChild($.f.make({
                    'SPAN': {'className': $.a.k + '_embed_pin_text_container', 'innerHTML': '<em class="' + $.a.k + '_embed_pin_text_container_em">' + $.f.filter(pin.pinner.full_name) + '</em>' + $.f.filter(pin.board.name) }
                  }));

                  var pinnerShield = $.f.make({'B':{'className': $.a.k + '_embed_pin_link_shield'}});
                  $.f.set(pinnerShield, $.a.dataAttributePrefix + 'log', 'pinner_from_embedded_pin');
                  $.f.set(pinnerShield, $.a.dataAttributePrefix + 'href', pin.pinner.profile_url);
                  pinner.appendChild(pinnerShield);

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
                var hd = $.f.makeHeader(r, parent, 'embed_user');
                container.appendChild(hd);
                container.appendChild(bd);
                container.appendChild($.f.makeFooter(parent, 'embed_user', lang));
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
                var hd = $.f.makeHeader(r, parent, 'embed_board', true);
                container.appendChild(hd);
                container.appendChild(bd);
                container.appendChild($.f.makeFooter(parent, 'embed_board', lang));
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

        // deep link to Pinterest apps
        deepLink: {
          ios_safari: function (a) {
            var shallow, deep, start, count, amount, delay, watchForError;

            // link target points to pin/create/button/?url=foo&media=bar
            shallow = a.href;

            // make the deep-link URL
            deep = shallow.split('?')[1];
            deep = deep.replace(/url=/, 'source_url=');
            deep = deep.replace(/media=/, 'image_url=');
            deep = 'pinit://pinit/?' + deep;

            // start the clock ticking
            start = new Date().getTime();
            count = 0;
            amount = 10;
            delay = 80;

            // watch for the clock to fall out of sync, meaning Safari can't find the app
            watchForError = function () {
              $.w.setTimeout(function () {
                if (count < amount) {
                  // keep watching
                  watchForError();
                } else {
                  // is our clock out of sync?
                  var since = start + (count * delay);
                  var now = new Date().getTime();
                  var diff = (now - since) / amount;
                  // yes: Safari has tried to pop the app but failed
                  if (diff < delay) {
                    // send us over to pin/create/button (dismisses error pop-up)
                    $.w.top.location = shallow;
                  }
                }
                count = count + 1;
              }, delay);
            };

            // attempt to pop the Pinterest application
            $.w.location = deep;

            // if we're still here, start watching the clock
            watchForError();
          }
        },

        render: {
          buttonBookmark: function (el) {
            $.f.debug('build bookmarklet button');

            var c = $.f.getButtonConfig(el);

            var buttonClass = $.a.k + '_pin_it_button_' + c.height + ' ' + $.a.k + '_pin_it_button_' + c.assets + '_' + c.height + '_' + c.color + ' ' + $.a.k + '_pin_it_button_inline_' + c.height;
            if (c.shape === 'round') {
              buttonClass = $.a.k + '_pin_it_button_en_' + c.height + '_red_round ' + $.a.k + '_pin_it_button_inline_en_' + c.height + '_red_round';
            }

            var a = $.f.make({'A': {'href': el.href, 'className': buttonClass}});

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

            $.f.set(a, $.a.dataAttributePrefix + 'log', 'button_pinit_bookmarklet');

            // fire the bookmarklet
            a.onclick = function () {
              $.f.fireBookmark();
              return false;
            };

            $.f.replace(el, a);

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

            href = $.v.endpoint.create + 'url=' + q.url + '&media=' + q.media + '&guid=' + $.v.guid + '-' + $.v.buttonId + '&description=' + q.description;
            $.v.buttonId = $.v.buttonId + 1;


            var a = $.f.make({'A': {'href': href, 'className': buttonClass, 'target': '_blank'}});
            $.f.set(a, $.a.dataAttributePrefix + 'log', 'button_pinit');

            if ($.f.getData(el, 'zero') || $.v.config.zero) {
              $.f.set(a, $.a.dataAttributePrefix + 'zero', true);
            }

            var config = $.f.getData(el, 'config');
            if ($.a.config.pinItCountPosition[config] === true) {
              $.f.set(a, $.a.dataAttributePrefix + 'config', config);
              a.className = a.className + ' ' + $.a.k + '_pin_it_' + c.config + '_' + c.height;
            } else {
              a.className = a.className + ' ' + $.a.k + '_pin_it_none';
            }

            // prevent old bad buttons from throwing errors
            if (q.url) {
              if (c.shape === 'rect') {
                var span = $.f.make({'SPAN': {'className': $.a.k + '_hidden', 'id': $.a.k + '_pin_count_' + $.f.callback.length, 'innerHTML': '<i></i>'}});
                a.appendChild(span);
                $.f.getPinCount(q.url);
              }
              $.f.replace(el, a);
            }

            // validate and log on click
            a.onclick = function () {
              // search for url and media in this button's href
              var q = $.f.parse(this.href, {'url': true, 'media': true, 'description': true});
              // log if no default description was specified
              if (!q.description) {
                $.f.log('&type=config_warning&warning_msg=no_description&href=' + encodeURIComponent($.d.URL));
              }
              // found valid URLs?
              if (q.url && q.url.match(/^http/i) && q.media && q.media.match(/^http/i)) {
                // yes
                if (!$.v.config.shallow && typeof $.f.deepLink[$.v.deepBrowser] === 'function') {
                  // attempt to deep link
                  $.f.deepLink[$.v.deepBrowser](this);
                } else {
                  // pop the pin form
                  $.w.open(this.href, 'pin' + new Date().getTime(), $.a.pop);
                }
              } else {
                // log an error with descriptive message
                $.f.log('&type=config_error&error_msg=invalid_url&href=' + encodeURIComponent($.d.URL));
                // fire up the bookmarklet and hope for the best
                $.f.fireBookmark();
              }
              return false;
            };

          },
          buttonFollow: function (el) {
            $.f.debug('build follow button');
            var className = '_follow_me_button';
            var render = $.f.getData(el, 'render');
            if (render) {
              className = className + '_' + render;
            }
            var a = $.f.make({'A': {'target': '_blank', 'href': el.href, 'innerHTML': el.innerHTML, 'className': $.a.k + className }});
            a.appendChild($.f.make({'B': {}}));
            a.appendChild($.f.make({'I': {}}));
            $.f.set(a, $.a.dataAttributePrefix + 'log', 'button_follow');
            $.f.replace(el, a);
          },
          embedPin: function (el) {
            $.f.debug('build embedded pin');
            var pin = el.href.split('/')[4];
            if (pin && parseInt(pin, 10) > 0) {
              $.f.getPinsIn('pin', '', {'pin_ids': pin});
            }
          },
          embedUser: function (el) {
            $.f.debug('build embedded profile');
            var user = el.href.split('/')[3];
            if (user) {
              $.f.getPinsIn('user', user + '/pins/');
            }
          },
          embedBoard: function (el) {
            $.f.debug('build embedded board');
            var user = el.href.split('/')[3];
            var board = el.href.split('/')[4];
            if (user && board) {
              $.f.getPinsIn('board', user + '/' + board + '/pins/');
            }
          }
        },
        getPinsIn: function (endpoint, path, params) {
          var query = '', sep = '?', p;
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

          if (typeof $.v.config.build === 'string') {
            $.w[$.v.config.build] = function (el) {
              $.f.build(el);
            };
          }

          $.w.setTimeout(function () {
            if (typeof $.v.config.logc === 'string') {
              $.f.log('&type=pidget&logc=' + $.v.config.logc, $.a.endpoint.logc);
            } else {
              $.f.log('&type=pidget');
            }
          }, 1000);
        },
        // send logging information
        log: function (str, endpoint) {

            if (!endpoint) {
              endpoint = $.a.endpoint.log;
            }

            // create the logging call
            var query = '?via=' + encodeURIComponent($.v.here) + '&guid=' + $.v.guid;

            // add the optional string to log
            if (str) {
              query = query + str;
            }

            $.f.call(endpoint + query, $.f.ping.log);
        },

        // trade a lang for domain, strings, and widget builder
        langToDomain: function (str) {

          // this will run once on init and (eventually) once for every widget that has a data-pin-lang specified
          var langPart, locPart, strParts, checkDomain, thisDomain, domainMatch, langMatch, foundDomain, builderUrl;

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
          builderUrl = 'business.pinterest.com/widget-builder/'
          builderMatch = 'http://' + builderUrl;
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
          // set widget builder domain
          if (thisDomain.builder) {
            builderMatch = 'http://' + thisDomain.builder + '.' + builderUrl;
          }
          // this result should always be fully populated
          return {'lang': langMatch, 'domain': domainMatch, 'builder':  builderMatch, 'strings': stringMatch, 'assets':  assetMatch };

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
            'deepBrowser': null,
            'protocol': $.w.location.protocol,
            'userAgent': $.w.navigator.userAgent
          };

          // are we testing by dragging a file into a browser?
          if ($.v.protocol === 'file:') {
            $.v.protocol = 'http:';
          }

          // prepend protocol to endpoints so testing from file:// works
          for (var e in $.a.endpoint) {
            $.a.endpoint[e] = $.v.protocol + $.a.endpoint[e];
          }

          // are we using an IOS device?
          if ($.v.userAgent.match(/iP/) !== null) {
            // we're on an IOS device. Don't deep link from inside the Pinterest app or Chrome.
            if ($.v.userAgent.match(/Pinterest/) === null && $.v.userAgent.match(/CriOS/) === null) {
              $.v.deepBrowser = 'ios_safari';
            }
          }

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

          // once we know our lang, map language, domain, assets, and widget builder
          var map = $.f.langToDomain(lang);

          $.v.config.assets = map.assets;
          $.v.config.lang = map.lang;

          $.v.endpoint = {
            'pinterest': '//' + map.domain + '.pinterest.com',
            'builder': map.builder,
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
    'bookmark': '//assets.pinterest.com/js/pinmarklet.js',
    'count': '//widgets.pinterest.com/v1/urls/count.json',
    'pin': '//widgets.pinterest.com/v3/pidgets/pins/info/',
    'board': '//widgets.pinterest.com/v3/pidgets/boards/',
    'user': '//widgets.pinterest.com/v3/pidgets/users/',
    'log': '//log.pinterest.com/',
    'logc': '//logc.pinterest.com/'
  },
  'config': {
    'pinItCountPosition': {
      'none': true,
      'above': true,
      'beside': true
    }
  },
  'minImgSize': 119,
  // source 6 means "pinned with the externally-hosted Pin It button"
  'countSource': 6,
  'dataAttributePrefix': 'data-pin-',
  // valid config parameters
  'configParam': [ 'build', 'debug', 'style', 'hover', 'logc', 'shallow', 'zero', 'color', 'height', 'lang', 'shape'],
  // configuration for the pop-up window
  'pop': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=632,height=270,left=0,top=0',
  'popLarge': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=900,height=500,left=0,top=0',
  // secure and non-secure content distribution networks
  'cdn': {
    'https:': 'https://s-passets.pinimg.com',
    'http:': 'http://passets.pinterest.com',
    // if we are dragging and dropping to test a page, use http instead of file
    'file:': 'http://passets.pinterest.com'
  },
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
    'fr': { 'lang': ['fr'], 'strings': 'fr', 'builder': 'fr'},
    'gb': { 'lang': ['en-uk', 'en-gb', 'en-ie'], 'strings': 'en', 'builder': 'uk'},
    'id': { 'lang': ['id', 'in'], 'strings': 'id'},
    'it': { 'lang': ['it'], 'strings': 'it'},
    'jp': { 'lang': ['ja'], 'strings': 'ja', 'builder': 'ja', 'assets': 'ja'},
    'kr': { 'lang': ['ko', 'kr'], 'strings': 'ko'},
    'nl': { 'lang': ['nl'], 'strings': 'nl'},
    'no': { 'lang': ['nb'], 'strings': 'nb'},
    'pl': { 'lang': ['pl'], 'strings': 'pl' },
    'pt': { 'lang': ['pt'], 'strings': 'pt'},
    'ru': { 'lang': ['ru'], 'strings': 'ru'},
    'sk': { 'lang': ['sk'], 'strings': 'sk'},
    'se': { 'lang': ['sv', 'sv-se'], 'strings': 'sv'},
    'tr': { 'lang': ['tr'], 'strings': 'tr' }
  },
  'strings': {
   'cs': {
      'seeOn': 'Zobrazit na',
      'getThis': 'st&#229;hnout',
      'attribTo': 'od'
    },
    'da': {
      'seeOn': 'Se p&#229;',
      'getThis': 'hent den',
      'attribTo': 'af'
    },
    'de': {
      'seeOn': 'Ansehen auf',
      'getThis': 'bekomme',
      'attribTo': 'von'
    },
    'en': {
      'seeOn': 'See On',
      'getThis': 'get this',
      'attribTo': 'by'
    },
    'en-gb': {
      'seeOn': 'See On',
      'getThis': 'get this',
      'attribTo': 'by'
    },
    'en-uk': {
      'seeOn': 'See On',
      'getThis': 'get this',
      'attribTo': 'by'
    },
    'es': {
      'seeOn': 'Ver En',
      'getThis': 'obtener',
      'attribTo': 'por'
    },
    'fi': {
      'seeOn': 'Katso palvelussa',
      'getThis': 'hanki',
      'attribTo': 'tekij&#228;'
    },
    'fr': {
      'seeOn': 'Voir sur',
      'getThis': 'obtenir',
      'attribTo': 'par'
    },
    'id': {
      'seeOn': 'Lihat di',
      'getThis': 'dapatkan',
      'attribTo': 'oleh'
    },
    'it': {
      'seeOn': 'Visualizza in',
      'getThis': 'scarica',
      'attribTo': 'da'
    },
    'ko': {
      'seeOn': '&#45796;&#51020;&#50640;&#49436; &#48372;&#44592;',
      'getThis': '&#45796;&#50868;&#47196;&#46300; &#54616;&#44592;',
      'attribTo': '&#51060; &#54592;&#54632;'
    },
    'ja': {
      'seeOn': '&#12391;&#35211;&#12427;',
      'seeOnTextAfterLogo': true,
      'getThis': '&#24471;&#12427;',
      'attribTo': ''
    },
    'nb': {
      'seeOn': 'Vis p&#229;',
      'getThis': 'hent den',
      'attribTo': 'av'
    },
    'nl': {
      'seeOn': 'Bekijken op',
      'getThis': 'krijg',
      'attribTo': 'door'
    },
    'pl': {
      'seeOn': 'Zobacz na',
      'getThis': 'pobierz',
      'attribTo': 'przez'
    },
    'pt': {
      'seeOn': 'Ver em',
      'getThis': 'obter',
      'attribTo': 'por'
    },
    'pt-br': {
      'seeOn': 'Ver em',
      'getThis': 'obter',
      'attribTo': 'por'
    },
    'ru': {
      'seeOn': '&#1055;&#1086;&#1089;&#1084;&#1086;&#1090;&#1088;&#1077;&#1090;&#1100; &#1074;',
      'getThis': '&#1087;&#1086;&#1083;&#1091;&#1095;&#1080;&#1090;&#1100;',
      'attribTo': '&#1087;&#1086;&#1083;&#1100;&#1079;&#1086;&#1074;&#1072;&#1090;&#1077;&#1083;&#1077;&#1084;'
    },
    'sk': {
      'seeOn': 'Zobrazi&#357; na',
      'getThis': 'stiahnu&#357;',
      'attribTo': 'od'
    },
    'sv': {
      'seeOn': 'Visa p&#229;',
      'getThis': 'H&#228;mta',
      'attribTo': 'av'
    },
    'tr': {
      'seeOn': '&#220;zerinde g&#246;r',
      'getThis': 'bunu al&#305;n',
      'attribTo': 'taraf&#305;ndan'
    }
  },
  // CSS rules
  'rules': [

    // PIN IT BUTTON -- 20px

    'a._pin_it_button_20 {  background-repeat: none; background-size: 40px 60px; height: 20px; margin: 0; padding: 0; vertical-align: baseline; text-decoration: none; width: 40px; background-position: 0 -20px }',
    'a._pin_it_button_20:hover { background-position: 0 0px }',
    'a._pin_it_button_20:active, a._pin_it_button_20._hazClick { background-position: 0 -40px }',
    'a._pin_it_button_inline_20 { position: relative; display: inline-block; }',
    'a._pin_it_button_floating_20 { position: absolute; }',

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

    // PIN IT BUTTON -- 28px

    'a._pin_it_button_28 { background-repeat: none; background-size: 56px 84px; height: 28px; margin: 0; padding: 0; vertical-align: baseline; text-decoration: none; width: 56px; background-position: 0 -28px }',
    'a._pin_it_button_28:hover { background-position: 0 0px }',
    'a._pin_it_button_28:active, a._pin_it_button_28._hazClick { background-position: 0 -56px }',
    'a._pin_it_button_inline_28 { position: relative; display: inline-block; }',
    'a._pin_it_button_floating_28 { position: absolute; }',

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
    'a._follow_me_button { color: #444; display: inline-block; font: bold normal normal 11px/20px "Helvetica Neue",helvetica,arial,san-serif; height: 20px; margin: 0; padding: 0; position: relative; text-decoration: none; text-indent: 19px; vertical-align: baseline;}',
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
    'a._follow_me_button_tall, a._follow_me_button_tall i { background-size: 400px 84px; background: transparent url(_cdn/images/pidgets/bft_rez.png) 0 0 no-repeat }',
    'a._follow_me_button_tall { color: #444; display: inline-block; font: bold normal normal 13px/28px "Helvetica Neue",helvetica,arial,san-serif; height: 28px; margin: 0; padding: 0; position: relative; text-decoration: none; text-indent: 33px; vertical-align: baseline;}',
    'a._follow_me_button_tall:hover { background-position: 0 -28px}',
    'a._follow_me_button_tall:active  { background-position: 0 -56px}',

    // b = logo
    'a._follow_me_button_tall b { position: absolute; top: 5px; left: 10px; height: 18px; width: 18px; background-size: 18px 18px; background-image: url(_cdn/images/pidgets/smt_rez.png); }',

    // i = right cap
    'a._follow_me_button_tall i { position: absolute; top: 0; right: -10px; height: 28px; width: 10px; background-position: 100% 0px; }',
    'a._follow_me_button_tall:hover i { background-position: 100% -28px;  }',
    'a._follow_me_button_tall:active i { background-position: 100% -56px; }',

    // EMBEDDED PIN

    // main container
    'span._embed_pin { display: inline-block; text-align: center; width: 237px; overflow: hidden; vertical-align: top; }',

    // shadow and rounded corner
    'span._embed_pin._fancy { background: #fff; box-shadow: 0 0 3px #aaa; border-radius: 3px; }',

    // thumbnail link has relative position
    'span._embed_pin a._embed_pin_link { display: block;  margin: 0 auto; padding: 0; position: relative;  line-height: 0}',

    // images should never show a border
    'span._embed_pin img { border: 0; margin: 0; padding: 0;}',

    // repin button
    'span._embed_pin a._embed_pin_link i._repin { left: 10px; top: 10px; position: absolute; height: 33px; width: 64px; background-size: 64px 99px; background: transparent url(_cdn/images/pidgets/repin_rez.png) }',
    'span._embed_pin a._embed_pin_link i._repin_ja { left: 10px; top: 10px; position: absolute; height: 33px; width: 64px; background-size: 64px 99px; background: transparent url(_cdn/images/pidgets/ja_repin_rez.png) }',

    'span._embed_pin a._embed_pin_link i._repin:hover { background-position: 0 -33px; }',
    'span._embed_pin a._embed_pin_link i._repin._hazClick { background-position: 0 -66px; }',

    // "get this" hoverbutton
    'span._embed_pin a._embed_pin_link i._getThis { display: none }',
    'span._embed_pin a._embed_pin_link:hover i._getThis, span._embed_pin a._embed_pin_link:hover i._getThis i { background: transparent url(_cdn/images/pidgets/bfs1.png) }',

    // text container and hover state
    'span._embed_pin a._embed_pin_link:hover i._getThis { color: #555; display: inline-block; font: normal normal normal 11px/20px "Helvetica Neue",helvetica,arial,san-serif; height: 20px; margin: 0; padding: 0 1px 0 5px; position: absolute; bottom: 10px; right: 10px; text-decoration: none;  }',
    'span._embed_pin a._embed_pin_link:hover i._getThis:hover { background-position: 0 -20px }',

    // end cap and hover state
    'span._embed_pin a._embed_pin_link:hover i._getThis i { position: absolute; top: 0; right: -4px; height: 20px; width: 5px; background-position: 100% 0px }',
    'span._embed_pin a._embed_pin_link:hover i._getThis:hover i { background-position: 100% -20px }',

    // description and attribution blocks
    'span._embed_pin span._embed_pin_desc { color: #333; white-space: normal; border-bottom: 1px solid #eee; display: block; font-family: "Helvetica Neue", arial, sans-serif; font-size: 12px; line-height: 17px; padding: 10px; text-align: left; }',

    'span._embed_pin span._embed_pin_attrib, span._embed_pin span._embed_pin_text_container { color: #a7a7a7; font-family: "Helvetica", sans-serif; font-size: 10px; line-height: 18px; font-weight: bold; display: block;}',
    'span._embed_pin span._embed_pin_attrib img._embed_pin_attrib_icon { height: 16px; width: 16px; vertical-align: middle; margin-right: 5px; float: left;}',
    'span._embed_pin span._embed_pin_attrib a { color: #a7a7a7; text-decoration: none;}',

    'span._embed_pin a._embed_pin_text, span._embed_pin a._embed_pin_text span._embed_pin_text_container { position: relative; text-decoration: none; display: block; font-weight: bold; color: #b7b7b7; font-family: "Helvetica Neue", arial, sans-serif; font-size: 11px; line-height: 14px; height: 39px; text-align: left; }',
    'span._embed_pin a._embed_pin_text { padding: 5px 0 0 7px; }',
    'span._embed_pin a._embed_pin_text:hover { background: #eee;}',
    'span._embed_pin a._embed_pin_text img._embed_pin_text_avatar { border-radius: 2px; overflow: hidden; height: 30px; width: 30px; vertical-align: middle; margin-right: 5px; float: left;}',
    'span._embed_pin a._embed_pin_text span._embed_pin_text_container em._embed_pin_text_container_em { font-family: inherit; display: block; color: #717171; font-style: normal; width: 180px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }',
    'span._embed_pin a._embed_pin_text b._embed_pin_link_shield { position: absolute; top: 0; left: 0; height: 100%; width: 100%; }',


    // EMBEDDED BOARDS

    // main container
    'span._embed_grid { display: inline-block; margin: 0; padding:10px 0; position: relative; text-align: center}',
    // border and corners
    'span._embed_grid._fancy { background: #fff; box-shadow: 0 0 3px #aaa; border-radius: 3px; }',
    // header container
    'span._embed_grid span._embed_grid_hd { display: block; margin: 0 10px; padding: 0; height: 45px; position: relative; background: #fff}',

    // avatar
    'span._embed_grid span._embed_grid_hd a._avatar { position: absolute; top: 0; left: 0; height: 36px; width: 36px; }',
    'span._embed_grid span._embed_grid_hd a._avatar::before { position: absolute; content:""; z-index: 2; top: 0; left: 0; right: 0; bottom: 0; box-shadow: inset 0 0 2px #888;  border-radius: 3px; }',
    'span._embed_grid span._embed_grid_hd a._avatar img { position: relative; height: 36px; width: 36px; margin: 0; padding: 0; border-radius: 3px; border: none;}',

    // header
    'span._embed_grid span._embed_grid_hd a { text-decoration: none; background: transparent; cursor: pointer; white-space: nowrap; position: absolute; left: 44px; text-align: left; overflow: hidden; text-overflow: ellipsis; }',
    'span._embed_grid span._embed_grid_hd a:hover { text-decoration: none; background: #fff; }',
    'span._embed_grid span._embed_grid_hd a:active { text-decoration: none; background: #fff; }',
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
    'span._embed_grid span._embed_grid_bd a._embed_grid_th img._embed_grid_img { border: none; position: absolute; top: 50%; left: 0; }',
    // footer button
    'a._embed_grid_ft { text-shadow: 0 1px #fff; display: block; text-align: center; border: 1px solid #ccc; margin: 10px 10px 0; height: 31px; line-height: 30px;border-radius: 2px; text-decoration: none; font-family: Helvetica; font-weight: bold; font-size: 13px; color: #746d6a; background: #f4f4f4 url(_cdn/images/pidgets/board_button_link.png) 0 0 repeat-x}',
    'a._embed_grid_ft:hover { text-decoration: none; background: #fefefe url(_cdn/images/pidgets/board_button_hover.png) 0 0 repeat-x}',
    'a._embed_grid_ft:active { text-decoration: none; background: #e4e4e4 url(_cdn/images/pidgets/board_button_active.png) 0 0 repeat-x}',
    'a._embed_grid_ft span._embed_grid_ft_logo { vertical-align: top; display: inline-block; margin-left: 2px; height: 30px; width: 66px; background: transparent url(_cdn/images/pidgets/board_button_logo.png) 50% 48% no-repeat; }',

    // leave this at the bottom, to avoid trailing commas
    '._hidden { display:none; }'
  ]
}));

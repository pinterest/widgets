// drop minImgSize to 199 so 200px images show hoverbuttons

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
        listen : function (el, ev, fn) {
          if (typeof $.w.addEventListener !== 'undefined') {
            el.addEventListener(ev, fn, false);
          } else if (typeof $.w.attachEvent !== 'undefined') {
            el.attachEvent('on' + ev, fn);
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
        debug: function (obj) {
          if ($.v.config.debug && $.w.console && $.w.console.log) {
            $.w.console.log(obj);
          }
        },

        // build stylesheet
        presentation : function () {
          var css, cdn, rules;

          css = $.f.make({'STYLE': {'type': 'text/css'}});
          cdn = $.a.cdn[$.w.location.protocol] || $.a.cdn['http:'];
          rules = $.a.rules.join('\n');

          // each rule has our randomly-created key at its root to minimize style collisions
          rules = rules.replace(/\._/g, '.' + a.k + '_');

          // every rule ending in ; also gets !important
          rules = rules.replace(/;/g, '!important;');

          // pick the right content distribution network
          rules = rules.replace(/_cdn/g, cdn);

          // pick the right resolution
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

        getPos: function (el) {
          var x = 0, y = 0;
          if (el.offsetParent) {
            do {
              x = x + el.offsetLeft;
              y = y + el.offsetTop;
            } while (el = el.offsetParent);
            return {"left": x, "top": y};
          }
        },

        hideFloatingButton: function () {
          if ($.s.floatingButton) {
            $.s.floatingButton.style.display = 'none';
          }
        },

        getThis: function (widget, id) {
          var href = $.a.endpoint.builder +  widget + '&' + id;
          $.f.log('&type=getThis&href=' + encodeURIComponent(href));
          $.w.open(href, 'pin' + new Date().getTime());
        },

        showFloatingButton: function (img) {
          // size > 80x80 and source is not a data: uri?
          if (img.height > $.a.minImgSize && img.width > $.a.minImgSize && !img.src.match(/^data/)) {
            // do this only once
            if (!$.s.floatingButton) {
              $.s.floatingButton = $.f.make({'A': {'className': $.a.k + '_pin_it_button ' + $.a.k + '_pin_it_button_floating', 'title': 'Pin it!', 'target': '_blank'}});
              $.f.set($.s.floatingButton, $.a.dataAttributePrefix + 'log', 'button_pinit_floating');
              $.d.b.appendChild($.s.floatingButton);
            }
            // get position, start href
            var p = $.f.getPos(img), href = $.a.endpoint.create;
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
          var el, log;
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
            $.f.listen($.d.b, 'mouseover', $.f.over);
          }
        },

        getPinCount: function (url) {
          var query = '?url=' + url + '&ref=' + encodeURIComponent($.v.here) + '&source=' + $.a.countSource;
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
        tile: function (parent, data) {
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
          var bd = $.f.make({'SPAN': {'className': $.a.k + '_embed_board_bd'}});
          bd.style.height = scaleFactors.height + 'px';
          $.v.renderedWidth = (columns * (scaleFactors.width + $.a.tile.style.margin)) - $.a.tile.style.margin;
          bd.style.width =  $.v.renderedWidth + 'px';
          var c = 0;
          var h = [];
          for (var i = 0, n = data.length; i < n; i = i + 1) {
            var thumb = $.f.make({'A': {'className': $.a.k + '_embed_board_th', 'target': '_blank', 'href': parent.href, 'title': data[i].description}});
            $.f.set(thumb, $.a.dataAttributePrefix + 'log', 'embed_board');
            var scale = {
              'height': data[i].images['237x'].height * (scaleFactors.width / data[i].images['237x'].width),
              'width': scaleFactors.width
            };
            var img = $.f.make({'IMG': {'src': data[i].images['237x'].url, 'nopin': 'true', 'height': scale.height, 'width': scale.width, 'className': $.a.k + '_embed_board_img', 'alt': data[i].description}});
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
            bd.appendChild(thumb);
            c = (c + 1) % columns;
          }
          return bd;
        },

        // make a board footer
        makeFooter: function (a, type) {
          var ft = $.f.make({'A': { 'className': $.a.k + '_embed_board_ft', 'href': a.href, 'target': '_blank'}});
          if ($.v.renderedWidth > $.a.tile.minWidthToShowAuxText) {
            ft.innerHTML = $.v.strings.seeOn;
          }
          $.f.set(ft, $.a.dataAttributePrefix + 'log', type);
          var logo = $.f.make({'SPAN': { 'className': $.a.k + '_embed_board_ft_logo'}});
          ft.appendChild(logo);
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
              'src': $.a.endpoint.bookmark + '?r=' + Math.random() * 99999999
            }
          }));
        },

        // callbacks
        ping: {
          log: function (r, k) {
            // varnish should not return a callback for log.
            // if this changes, this callback needs to be here
            // to drop it on the floor
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
                  $.f.debug('Zero pin count not rendered to the side.');
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

                // container
                var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_pin', 'data-pin-id': pin.id }});
                var style = $.f.getData(parent, 'style');
                if (style !== 'plain') {
                  container.className = container.className + ' ' + $.a.k + '_fancy';
                }

                // main image
                var link = $.f.make({'A': { 'className': $.a.k + '_embed_pin_link', 'title': pin.description, 'href': 'http://www.pinterest.com/pin/' + pin.id + '/', 'target': '_blank'}});

                var img = $.f.make({'IMG': {'className': $.a.k + '_embed_pin_link_img', 'alt': pin.description, 'nopin': 'true', 'src': thumb.url, 'width': thumb.width, 'height': thumb.height}});
                $.f.set(img, $.a.dataAttributePrefix + 'log', 'image_from_embedded_pin');
                $.f.set(img, $.a.dataAttributePrefix + 'href', 'http://www.pinterest.com/pin/' + pin.id + '/');
                img.style.width = thumb.width + 'px';
                img.style.height = thumb.height + 'px';
                link.appendChild(img);

                // pin it button
                var repin = $.f.make({'I': {'className': $.a.k + '_repin', 'data-pin-id': pin.id }});
                $.f.set(repin, $.a.dataAttributePrefix + 'log', 'repin');
                $.f.set(repin, $.a.dataAttributePrefix + 'href', $.a.endpoint.repin.replace(/%s/, pin.id));

                link.appendChild(repin);
                repin.onclick = function () {
                  if (!this.className.match(/hazClick/)) {
                    this.className = this.className + ' ' + $.a.k + '_hazClick';
                  }
                  var href = $.a.endpoint.repin.replace(/%s/, $.f.get(this, 'data-pin-id'));
                  $.w.open(href, 'pin' + new Date().getTime(), $.a.popLarge);
                  return false;
                };

                // this button should open the widget builder with this pin in preview
                var getThis = $.f.make({'I': {'className': $.a.k + '_getThis', 'innerHTML': $.v.strings.getThis + '<i></i>', 'data-pin-id': pin.id}});
                link.appendChild(getThis);
                getThis.onclick = function () {
                  var pinId = $.f.get(this, 'data-pin-id');
                  $.f.getThis('do_embed_pin', pinId);
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
                  attribution.appendChild($.f.make({'SPAN':{'className': $.a.k + '_embed_pin_attrib',  'innerHTML': $.v.strings.attribTo + ' <a href="' + pin.attribution.url + '" target="_blank">' + $.f.filter(pin.attribution.author_name) + '</a>'}}));
                  description.appendChild(attribution);
                }
                container.appendChild(description);

                // pinner
                if (pin.pinner && pin.pinner.profile_url && pin.pinner.image_small_url && pin.pinner.full_name) {
                  $.f.debug('Building pinner line');

                  var pinner = $.f.make({'A': {'className': $.a.k + '_embed_pin_text', 'href': pin.pinner.profile_url, 'target': '_blank'}});

                  pinner.appendChild($.f.make({
                    'IMG': {
                      'className': $.a.k + '_embed_pin_text_avatar',
                      'src': pin.pinner.image_small_url
                    }
                  }));
                  pinner.appendChild($.f.make({
                    'SPAN': {'className': $.a.k + '_embed_pin_text_container', 'innerHTML': $.v.strings.pinnedBy + ' <em class="' + $.a.k + '_embed_pin_text_container_em">' + $.f.filter(pin.pinner.full_name) + '</em>'}
                  }));

                  var pinnerShield = $.f.make({'B':{'className': $.a.k + '_embed_pin_link_shield'}});
                  $.f.set(pinnerShield, $.a.dataAttributePrefix + 'log', 'pinner_from_embedded_pin');
                  $.f.set(pinnerShield, $.a.dataAttributePrefix + 'href', pin.pinner.profile_url);
                  pinner.appendChild(pinnerShield);

                  container.appendChild(pinner);
                }

                // board
                if (pin.board && pin.board.url && pin.board.image_thumbnail_url && pin.board.name) {
                  $.f.debug('Building board line');

                  // future-proof against API weirdness: sometimes absolute paths are not really absolute
                  if (!pin.board.url.match(/^(\/\/pinterest\.com|http:\/\/pinterest\.com|https:\/\/pinterest\.com)/)) {
                    pin.board.url = '//www.pinterest.com' + pin.board.url;
                    $.f.debug('appending Pinterest prefix to board URL');
                  }

                  var board = $.f.make({'A': {'className': $.a.k + '_embed_pin_text', 'href': pin.board.url, 'target': '_blank'}});
                  board.appendChild($.f.make({
                    'IMG': {
                      'className': $.a.k + '_embed_pin_text_avatar',
                      'src': pin.board.image_thumbnail_url
                    }
                  }));
                  board.appendChild($.f.make({
                    'SPAN': {'className': $.a.k + '_embed_pin_text_container', 'innerHTML': $.v.strings.onto + ' <em class="' + $.a.k + '_embed_pin_text_container_em">' + $.f.filter(pin.board.name) + '</em>'}
                  }));

                  var boardShield = $.f.make({'B':{'className': $.a.k + '_embed_pin_link_shield'}});
                  $.f.set(boardShield, $.a.dataAttributePrefix + 'log', 'board_from_embedded_pin');
                  $.f.set(boardShield, $.a.dataAttributePrefix + 'href', pin.board.url);
                  board.appendChild(boardShield);

                  container.appendChild(board);
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
              $.f.debug('API replied with a user');
              var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_board'}});
              var style = $.f.getData(parent, 'style');
              if (style !== 'plain') {
                container.className = container.className + ' ' + $.a.k + '_fancy';
              }
              var hd = $.f.make({'SPAN': { 'className': $.a.k + '_embed_board_hd'}});
              var title = $.f.make({'A': {'className': $.a.k + '_embed_board_title', 'innerHTML': $.f.filter(r.data.user.full_name), 'target': '_blank', 'href': parent.href}});
              $.f.set(title, $.a.dataAttributePrefix + 'log', 'embed_user');

              hd.appendChild(title);
              container.appendChild(hd);
              var bd = $.f.tile(parent, r.data.pins);
              if (bd) {
                container.appendChild(bd);
                // add trailing slash here if we need it
                parent.href = parent.href + 'pins/';
                container.appendChild($.f.makeFooter(parent, 'embed_user'));
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
              var container = $.f.make({'SPAN': { 'className': $.a.k + '_embed_board'}});
              var style = $.f.getData(parent, 'style');
              if (style !== 'plain') {
                container.className = container.className + ' ' + $.a.k + '_fancy';
              }
              // need to know width before making header
              var bd = $.f.tile(parent, r.data.pins);
              var hd = $.f.make({'SPAN': { 'className': $.a.k + '_embed_board_hd'}});
              var title = $.f.make({'A': { 'className': $.a.k + '_embed_board_name', 'innerHTML': $.f.filter(r.data.board.name), 'target': '_blank', 'href': parent.href}});
              $.f.set(title, $.a.dataAttributePrefix + 'log', 'embed_board');
              hd.appendChild(title);
              if ($.v.renderedWidth > $.a.tile.minWidthToShowAuxText) {
                var author = $.f.make({'A': { 'log': 'embed_board', 'className': $.a.k + '_embed_board_author', 'innerHTML': '<span>' + $.v.strings.attribTo + '</span> ' + $.f.filter(r.data.user.full_name), 'target': '_blank', 'href': parent.href}});
                $.f.set(author, $.a.dataAttributePrefix + 'log', 'embed_board');
                hd.appendChild(author);
              } else {
                // center it
                title.className = $.a.k + '_embed_board_title';
              }
              container.appendChild(hd);
              if (bd) {
                container.appendChild(bd);
                container.appendChild($.f.makeFooter(parent, 'embed_board'));
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
                    $.w.location = shallow;
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

            var a = $.f.make({'A': {'href': el.href, 'className': $.a.k + '_pin_it_button ' + $.a.k + '_pin_it_button_inline'}});
            $.f.set(a, $.a.dataAttributePrefix + 'log', 'button_pinit_bookmarklet');

            var config = $.f.getData(el, 'config');
            if ($.a.config.pinItCountPosition[config] === true) {
              $.f.set(a, $.a.dataAttributePrefix + 'config', config);
              a.className = a.className + ' ' + $.a.k + '_pin_it_' + config;
            } else {
              a.className = a.className + ' ' + $.a.k + '_pin_it_none';
            }
            $.f.getPinCount(encodeURIComponent($.v.here));

            // fire the bookmarklet
            a.onclick = function () {
              $.f.fireBookmark();
              return false;
            };

            var span = $.f.make({'SPAN': {'className': $.a.k + '_hidden', 'id': $.a.k + '_pin_count_' + $.f.callback.length, 'innerHTML': '<i></i>'}});
            a.appendChild(span);

            $.f.replace(el, a);

          },
          buttonPin: function (el) {
            $.f.debug('build Pin It button');

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

            href = $.a.endpoint.create + 'url=' + q.url + '&media=' + q.media + '&guid=' + $.v.guid + '-' + $.v.buttonId + '&description=' + q.description;
            $.v.buttonId = $.v.buttonId + 1;

            var a = $.f.make({'A': {'href': href, 'className': $.a.k + '_pin_it_button ' + $.a.k + '_pin_it_button_inline', 'target': '_blank'}});
            $.f.set(a, $.a.dataAttributePrefix + 'log', 'button_pinit');

            var config = $.f.getData(el, 'config');
            if ($.a.config.pinItCountPosition[config] === true) {
              $.f.set(a, $.a.dataAttributePrefix + 'config', config);
              a.className = a.className + ' ' + $.a.k + '_pin_it_' + config;
            } else {
              a.className = a.className + ' ' + $.a.k + '_pin_it_none';
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
                if (typeof $.f.deepLink[$.v.deepBrowser] === 'function') {
                  // deep link
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

            // prevent old bad buttons from throwing errors
            if (q.url) {
              var span = $.f.make({'SPAN': {'className': $.a.k + '_hidden', 'id': $.a.k + '_pin_count_' + $.f.callback.length, 'innerHTML': '<i></i>'}});
              a.appendChild(span);
              $.f.getPinCount(q.url);
              $.f.replace(el, a);
            }
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
          var script = $.d.getElementsByTagName('SCRIPT'), n = script.length, i, j, foundMe = false;

          for (i = 0; i < n; i = i + 1) {
            if ($.a.me && script[i] && script[i].src && script[i].src.match($.a.me)) {
              // only do this for the first instance of the script on the page
              if (foundMe === false) {
                for (j = 0; j < $.a.configParam.length; j = j + 1) {
                  $.v.config[$.a.configParam[j]] = $.f.get(script[i], $.a.dataAttributePrefix + $.a.configParam[j]);
                }
                foundMe = true;
              }
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

        init : function () {
          $.d.b = $.d.getElementsByTagName('BODY')[0];
          $.d.h = $.d.getElementsByTagName('HEAD')[0];

          // just a few variables that need to be shared throughout this script
          $.v = {
            'resolution': 1,
            'here': $.d.URL.split('#')[0],
            'hazFloatingButton': false,
            'config': {},
            'strings': $.a.strings.en,
            'guid': '',
            'buttonId': 0,
            'deepBrowser': null
          };

          // are we using an IOS device?
          if ($.w.navigator.userAgent.match(/iP/) !== null) {
            // we're on an IOS device. Don't deep link from inside the Pinterest app or Chrome.
            if ($.w.navigator.userAgent.match(/Pinterest/) === null && $.w.navigator.userAgent.match(/CriOS/) === null) {
              $.v.deepBrowser = 'ios_safari';
            }
          }

          // make a 12-digit base-60 number for conversion tracking
          for (var i = 0; i < 12; i = i + 1) {
            $.v.guid = $.v.guid + '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz'.substr(Math.floor(Math.random() * 60), 1);
          }

          // do we need to switch languages from en to something else?
          var lang = $.d.getElementsByTagName('HTML')[0].getAttribute('lang');
          if (lang) {
            lang = lang.toLowerCase();
            // direct match for pt-br
            if (typeof $.a.strings[lang] === 'object') {
              $.v.strings = $.a.strings[lang];
            } else {
              // match first part: en-uk = en
              lang = lang.split('-')[0];
              if (typeof $.a.strings[lang] === 'object') {
                $.v.strings = $.a.strings[lang];
              }
            }
          }

          if ($.w.devicePixelRatio && $.w.devicePixelRatio >= 2) {
            $.v.resolution = 2;
          }

          // find the script node we are running now
          // remove it and set config options if we find any
          $.f.config();

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
  'myDomain': /^https?:\/\/(www\.|)pinterest\.com\//,
  'me': /pinit.*?\.js$/,
  'floatingButtonOffsetTop': 10,
  'floatingButtonOffsetLeft': 10,
  'endpoint': {
    'bookmark': '//assets.pinterest.com/js/pinmarklet.js',
    // temp fix until business site is working on https
    'builder': 'http://business.pinterest.com/widget-builder/#',
    'count': '//widgets.pinterest.com/v1/urls/count.json',
    'pin': '//widgets.pinterest.com/v3/pidgets/pins/info/',
    'repin': '//pinterest.com/pin/%s/repin/x/',
    'board': '//widgets.pinterest.com/v3/pidgets/boards/',
    'user': '//widgets.pinterest.com/v3/pidgets/users/',
    'log': '//log.pinterest.com/',
    'logc': '//logc.pinterest.com/',
    'create': '//www.pinterest.com/pin/create/button/?'
  },
  'config': {
    'pinItCountPosition': {
      'none': true,
      'above': true,
      'beside': true
    }
  },
  'minImgSize': 199,
  // source 6 means "pinned with the externally-hosted Pin It button"
  'countSource': 6,
  'dataAttributePrefix': 'data-pin-',
  // valid config parameters
  'configParam': [ 'build', 'debug', 'style', 'hover', 'logc'],
  // configuration for the pop-up window
  'pop': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=632,height=270,left=0,top=0',
  'popLarge': 'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=900,height=500,left=0,top=0',
  // secure and non-secure content distribution networks
  'cdn': {
    'https:': 'https://s-passets.pinimg.com',
    'http:': 'http://passets.pinterest.com'
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
    'maxColumns': 6,
    'style': {
      'margin': 2,
      'padding': 10
    }
  },
  'strings': {
    'en': {
      'seeOn': 'See On',
      'getThis': 'get this',
      'attribTo': 'by',
      'pinnedBy': 'Pinned by',
      'onto': 'Onto'
    },
    'de': {
      'seeOn': 'Ansehen auf',
      'getThis': 'bekomme',
      'attribTo': 'von',
      'pinnedBy': 'Gepinnt von',
      'onto': 'Auf'
    },
    'es': {
      'seeOn': 'Ver En',
      'getThis': 'obtener',
      'attribTo': 'por',
      'pinnedBy': 'Pineado por',
      'onto': 'En'
    },
    'fr': {
      'seeOn': 'Voir sur',
      'getThis': 'obtenir',
      'attribTo': 'par',
      'pinnedBy': '&#201;pingl&#233; par',
      'onto': 'Sur'
    },
    'nl': {
      'seeOn': 'Bekijken op',
      'getThis': 'krijg',
      'attribTo': 'door',
      'pinnedBy': 'Gepind door',
      'onto': 'Op'
    },
    'pt': {
      'seeOn': 'Ver em',
      'getThis': 'obter',
      'attribTo': 'por',
      'pinnedBy': 'Pin afixado por',
      'onto': 'Em'
    },
    'pt-br': {
      'seeOn': 'Ver em',
      'getThis': 'obter',
      'attribTo': 'por',
      'pinnedBy': 'Pinado por',
      'onto': 'Em'
    }
  },
  // CSS rules
  'rules': [

    // PIN IT BUTTON

    'a._pin_it_button {  background-image: url(_cdn/images/pidgets/bps_rez.png); background-repeat: none; background-size: 40px 60px; height: 20px; margin: 0; padding: 0; vertical-align: baseline; text-decoration: none; width: 40px; background-position: 0 -20px }',
    'a._pin_it_button:hover { background-position: 0 0px }',
    'a._pin_it_button:active, a._pin_it_button._hazClick { background-position: 0 -40px }',
    'a._pin_it_button_inline { position: relative; display: inline-block; }',
    'a._pin_it_button_floating { position: absolute; }',

    // the count
    'a._pin_it_button span._pin_it_button_count { position: absolute; color: #777; text-align: center; text-indent: 0; }',
    'a._pin_it_above span._pin_it_button_count { background: transparent url(_cdn/images/pidgets/fpa_rez.png) 0 0 no-repeat; background-size: 40px 29px; position: absolute; bottom: 21px; left: 0px; height: 29px; width: 40px; font: 12px Arial, Helvetica, sans-serif; line-height: 24px; text-indent: 0;}',

    // pin count background
    'a._pin_it_beside span._pin_it_button_count, a._pin_it_beside span._pin_it_button_count i { background-color: transparent; background-repeat: no-repeat; background-image: url(_cdn/images/pidgets/fpb_rez.png); }',

    // pin count flag left site with number

    'a._pin_it_beside span._pin_it_button_count { padding: 0 3px 0 10px; background-size: 45px 20px; background-position: 0 0; position: absolute; top: 0; left: 41px; height: 20px; font: 10px Arial, Helvetica, sans-serif; line-height: 20px; }',

    // pin count flag right cap
    'a._pin_it_beside span._pin_it_button_count i { background-position: 100% 0; position: absolute; top: 0; right: -2px; height: 20px; width: 2px; }',
    'a._pin_it_button._pin_it_above { margin-top: 20px; }',

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
    'span._embed_pin a._embed_pin_link i._repin { left: 10px; top: 10px; position: absolute; height: 33px; width: 64px; background: transparent url(_cdn/images/pidgets/repin_rez.png); background-size: 64px 99px; }',
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
    'span._embed_board { display: inline-block; margin: 0; padding:10px 0; position: relative; text-align: center}',
    // border and corners
    'span._embed_board._fancy { background: #fff; box-shadow: 0 0 3px #aaa; border-radius: 3px; }',
    // header container
    'span._embed_board span._embed_board_hd { display: block; margin: 0 10px; padding: 0; line-height: 20px; height: 25px; position: relative;  }',
    // title and author
    'span._embed_board span._embed_board_hd a { cursor: pointer; background: inherit; text-decoration: none; width: 48%; white-space: nowrap; position: absolute; top: 0; overflow: hidden;  text-overflow: ellipsis; }',
    'span._embed_board span._embed_board_hd a:hover { text-decoration: none; background: inherit; }',
    'span._embed_board span._embed_board_hd a:active { text-decoration: none; background: inherit; }',
    // centered title
    'span._embed_board span._embed_board_hd a._embed_board_title { width: 100%; position: absolute; left: 0; text-align: left; font-family: Georgia; font-size: 16px; color:#2b1e1e;}',
    // title
    'span._embed_board span._embed_board_hd a._embed_board_name { position: absolute; left: 0; text-align: left; font-family: Georgia; font-size: 16px; color:#2b1e1e;}',
    // author
    'span._embed_board span._embed_board_hd a._embed_board_author { position: absolute; right: 0; text-align: right; font-family: Helvetica; font-size: 11px; color: #746d6a; font-weight: bold;}',
    'span._embed_board span._embed_board_hd a._embed_board_author span { font-weight: normal; }',
    // image container
    'span._embed_board span._embed_board_bd { display:block; margin: 0 10px; overflow: hidden; border-radius: 2px; position: relative; }',
    // each thumbnail
    'span._embed_board span._embed_board_bd a._embed_board_th { cursor: pointer; display: inline-block; position: absolute; overflow: hidden; }',
    // inset shadow mask
    'span._embed_board span._embed_board_bd a._embed_board_th::before { position: absolute; content:""; z-index: 2; top: 0; left: 0; right: 0; bottom: 0; box-shadow: inset 0 0 2px #888; }',
    // thumbnail image
    'span._embed_board span._embed_board_bd a._embed_board_th img._embed_board_img { border: none; position: absolute; top: 50%; left: 0; }',
    // footer button
    'a._embed_board_ft { text-shadow: 0 1px #fff; display: block; text-align: center; border: 1px solid #ccc; margin: 10px 10px 0; height: 31px; line-height: 30px;border-radius: 2px; text-decoration: none; font-family: Helvetica; font-weight: bold; font-size: 13px; color: #746d6a; background: #f4f4f4 url(_cdn/images/pidgets/board_button_link.png) 0 0 repeat-x}',
    'a._embed_board_ft:hover { text-decoration: none; background: #fefefe url(_cdn/images/pidgets/board_button_hover.png) 0 0 repeat-x}',
    'a._embed_board_ft:active { text-decoration: none; background: #e4e4e4 url(_cdn/images/pidgets/board_button_active.png) 0 0 repeat-x}',
    'a._embed_board_ft span._embed_board_ft_logo { vertical-align: top; display: inline-block; margin-left: 2px; height: 30px; width: 66px; background: transparent url(_cdn/images/pidgets/board_button_logo.png) 50% 48% no-repeat; }',

    // leave this at the bottom, to avoid trailing commas
    '._hidden { display:none; }'
  ]
}));

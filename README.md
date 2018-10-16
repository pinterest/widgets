widgets
=======

JavaScript widgets, including the Pin It (now "Save") button.

10/16/2018: we are testing "sticky" buttons for mobile browsers on pages that have `data-pin-hover="true"`.  Currently out for Korean and Japanese only. If you don't want these, you can turn them off by setting `data-pin-sticky="false"` in your initial call to pinit.js.

Breaking change, 10/9/2017: pin create buttons default to Save in the user's language (or English, if we don't support the user's language) instead of "Pin It."  If you need Pin It buttons back, please set data-pin-save="false" in your initial call to pinit.js.

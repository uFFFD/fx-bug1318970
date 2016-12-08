# [Bug 1318970] related stuffs

* dump.py: `dump.py content-prefs.sqlite` will print all content preferences stored in content-prefs.sqlite
* update.py: `update.py content-prefs.sqlite /foo/bar` will set all `browser.upload.lastDir` values to /foo/bar
* observer: an observer for [nsIContentPrefService] and [nsIContentPrefService2] that will log all preference value changes and deletions to browser console
* proxy: a proxy of [nsIContentPrefService] and [nsIContentPrefService2] that will log all content preference operations to browser console

## License

MPL 2.0

[Bug 1318970]: https://bugzilla.mozilla.org/show_bug.cgi?id=1318970
[nsIContentPrefService]: https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPrefService
[nsIContentPrefService2]: https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPrefService2

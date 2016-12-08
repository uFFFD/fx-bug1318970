"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function log(msg) {
  Services.console.logStringMessage("CPS Proxy: " + msg);
}

function MyCallback(name, cb) {
  this.name = "Callback(" + name + ")";
  this.cb = cb;
}

MyCallback.prototype = {
  onResult: function(aResult) {
    log(this.name + ".onResult: " + aResult);
    if (this.cb) {
      this.cb.onResult(aResult);
    }
  },

  handleResult: function(pref) {
    log(this.name + ".handleResult: " + pref.value);
    if (this.cb) {
      this.cb.handleResult(pref);
    }
  },

  handleError: function(error) {
    log(this.name + ".handleError: 0x" + error.toString(16));
    if (this.cb) {
      this.cb.handleError(error);
    }
  },

  handleCompletion: function(reason) {
    var reason_str;
    switch (reason) {
      case 0:
        reason_str = "COMPLETE_OK";
        break;
      case 1:
        reason_str = "COMPLETE_ERROR";
        break;
      default:
        reason_str = "reason: " + reason.toString();
        break;
    }
    log(this.name + ".handleCompletion: " + reason_str);
    if (this.cb) {
      this.cb.handleCompletion(reason);
    }
  },
};

var myContentPrefService = {
  contractId: "@mozilla.org/content-pref/service;1",
  classId: Components.classes["@mozilla.org/uuid-generator;1"].getService(Components.interfaces.nsIUUIDGenerator).generateUUID(),

  _wrapped_cps: null,
  _wrapped_cps2: null,

  _originalClassId: "",
  _originalFactory: null,

  register: function() {
    this._wrapped_cps = Components.classes["@mozilla.org/content-pref/service;1"].getService(Components.interfaces.nsIContentPrefService);
    if (Services.vc.compare(Services.appinfo.platformVersion, "19.*") > 0) {
      this._wrapped_cps2 = Components.classes["@mozilla.org/content-pref/service;1"].getService(Components.interfaces.nsIContentPrefService2);
    }
    var registrar = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    if (!registrar.isCIDRegistered(this.classId)) {
      this._originalClassId = registrar.contractIDToCID(this.contractId);
      this._originalFactory = Components.manager.getClassObject(Components.classes[this.contractId], Components.interfaces.nsIFactory);
      registrar.unregisterFactory(this._originalClassId, this._originalFactory);
      registrar.registerFactory(this.classId, "", this.contractId, this);
    }
  },

  unregister: function() {
    var registrar = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    registrar.unregisterFactory(this.classId, this);
    registrar.registerFactory(this._originalClassId, "", this.contractId, this._originalFactory);
    this._wrapped_cps = null;
    this._wrapped_cps2 = null;
  },

  _parseGroupParam: function ContentPrefService__parseGroupParam(aGroup) {
    if (aGroup == null) {
      return null;
    }
    if (aGroup.constructor.name == "String") {
      return aGroup.toString();
    }
    if (aGroup instanceof Components.interfaces.nsIURI) {
      return this.grouper.group(aGroup);
    }

    throw Components.Exception("aGroup is not a string, nsIURI or null", Components.results.NS_ERROR_ILLEGAL_VALUE);
  },

  // nsISupports
  QueryInterface: function(iid) {
    if (iid.equals(Components.interfaces.nsISupports)) {
      log("QueryInterface: nsISupports");
    } else if (iid.equals(Components.interfaces.nsIFactory)) {
      log("QueryInterface: nsIFactory");
    } else if (iid.equals(Components.interfaces.nsIObserver)) {
      log("QueryInterface: nsIObserver");
    } else if (iid.equals(Components.interfaces.nsIContentPrefService)) {
      log("QueryInterface: nsIContentPrefService");
    } else if (iid.equals(Components.interfaces.nsIContentPrefService2)) {
      log("QueryInterface: nsIContentPrefService2");
    } else {
      log("QueryInterface: " + iid.number);
    }
    if (iid.equals(Components.interfaces.nsISupports) ||
      iid.equals(Components.interfaces.nsIFactory) ||
      iid.equals(Components.interfaces.nsIObserver) ||
      iid.equals(Components.interfaces.nsIContentPrefService) ||
      iid.equals(Components.interfaces.nsIContentPrefService2)) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  // nsIFactory
  createInstance: function(outer, iid) {
    log("createInstance: " + iid.number);
    return this.QueryInterface(iid);
  },

  // nsIFactory
  lockFactory: function(lock) {
    log("lockFactory: " + lock);
  },

  // nsIObserver
  observe: function CPS2_observe(subj, topic, data) {
    this._wrapped_cps2.observe(subj, topic, data);
  },

  // nsIContentPrefService starts
  // https://dxr.mozilla.org/mozilla-central/source/dom/interfaces/base/nsIContentPrefService.idl
  getPref: function ContentPrefService_getPref(aGroup, aName, aContext, aCallback) {
    var fname = "ContentPrefService.getPref(" + this._parseGroupParam(aGroup) + ", " + aName + ")";
    var cb = aCallback;
    if (cb) {
      cb = new MyCallback(fname, aCallback);
    }
    var res = this._wrapped_cps.getPref(aGroup, aName, aContext, cb);
    log(fname + " => " + res);
    return res;
  },

  setPref: function ContentPrefService_setPref(aGroup, aName, aValue, aContext) {
    log("ContentPrefService.setPref(" + this._parseGroupParam(aGroup) + ", " + aName + ", " + aValue + ")");
    this._wrapped_cps.setPref(aGroup, aName, aValue, aContext);
  },

  hasPref: function ContentPrefService_hasPref(aGroup, aName, aContext) {
    var res = this._wrapped_cps.hasPref(aGroup, aName, aContext);
    log("ContentPrefService.hasPref(" + this._parseGroupParam(aGroup) + ", " + aName + ") => " + res);
    return res;
  },

  hasCachedPref: function ContentPrefService_hasCachedPref(aGroup, aName, aContext) {
    var res = this._wrapped_cps.hasCachedPref(aGroup, aName, aContext);
    log("ContentPrefService.hasCachedPref(" + this._parseGroupParam(aGroup) + ", " + aName + ") => " + res);
    return res;
  },

  removePref: function ContentPrefService_removePref(aGroup, aName, aContext) {
    log("ContentPrefService.removePref(" + this._parseGroupParam(aGroup) + ", " + aName + ")");
    this._wrapped_cps.removePref(aGroup, aName, aContext);
  },

  removeGroupedPrefs: function ContentPrefService_removeGroupedPrefs(aContext) {
    log("ContentPrefService.removeGroupedPrefs()");
    this._wrapped_cps.removeGroupedPrefs(aContext);
  },

  removePrefsByName: function ContentPrefService_removePrefsByName(aName, aContext) {
    log("ContentPrefService.removePrefsByName(" + aName + ")");
    this._wrapped_cps.removePrefsByName(aName, aContext);
  },

  getPrefs: function ContentPrefService_getPrefs(aGroup, aContext) {
    var res = this._wrapped_cps.getPrefs(aGroup, aContext);
    log("ContentPrefService.getPrefs(" + this._parseGroupParam(aGroup) + ") => " + res);
    return res;
  },

  getPrefsByName: function ContentPrefService_getPrefsByName(aName, aContext) {
    var res = this._wrapped_cps.getPrefsByName(aName, aContext);
    log("ContentPrefService.getPrefsByName(" + aName + ") => " + res);
    return res;
  },

  addObserver: function ContentPrefService_addObserver(aName, aObserver) {
    log("ContentPrefService.addObserver(" + aName + ")");
    this._wrapped_cps.addObserver(aName, aObserver);
  },

  removeObserver: function ContentPrefService_removeObserver(aName, aObserver) {
    log("ContentPrefService.removeObserver(" + aName + ")");
    this._wrapped_cps.removeObserver(aName, aObserver);
  },

  get grouper() {
    return this._wrapped_cps.grouper;
  },

  get DBConnection() {
    return this._wrapped_cps.DBConnection;
  },
  // nsIContentPrefService ends

  // nsIContentPrefService2 starts
  // https://dxr.mozilla.org/mozilla-central/source/dom/interfaces/base/nsIContentPrefService2.idl
  getByName: function CPS2_getByName(name, context, callback) {
    callback = new MyCallback("ContentPrefService2.getByName(" + name + ")", callback);
    this._wrapped_cps2.getByName(name, context, callback);
  },

  getByDomainAndName: function CPS2_getByDomainAndName(group, name, context, callback) {
    callback = new MyCallback("ContentPrefService2.getByDomainAndName(" + group + ", " + name + ")", callback);
    this._wrapped_cps2.getByDomainAndName(group, name, context, callback);
  },

  getBySubdomainAndName: function CPS2_getBySubdomainAndName(group, name, context, callback) {
    callback = new MyCallback("ContentPrefService2.getBySubdomainAndName(" + group + ", " + name + ")", callback);
    this._wrapped_cps2.getBySubdomainAndName(group, name, context, callback);
  },

  getGlobal: function CPS2_getGlobal(name, context, callback) {
    callback = new MyCallback("ContentPrefService2.getGlobal(" + name + ")", callback);
    this._wrapped_cps2.getGlobal(name, context, callback);
  },

  getCachedByDomainAndName: function CPS2_getCachedByDomainAndName(group, name, context) {
    var res = this._wrapped_cps2.getCachedByDomainAndName(group, name, context);
    var v = res;
    if (v) {
      v = v.value;
    }
    log("ContentPrefService2.getCachedByDomainAndName(" + group + ", " + name + ") => " + v);
    return res;
  },

  getCachedBySubdomainAndName: function CPS2_getCachedBySubdomainAndName(group, name, context, len) {
    var res = this._wrapped_cps2.getCachedBySubdomainAndName(group, name, context, len);
    var v = res;
    if (v) {
      v = v.value;
    }
    log("ContentPrefService2.getCachedBySubdomainAndName(" + group + ", " + name + ", " + len + ") => " + v);
    return res;
  },

  getCachedGlobal: function CPS2_getCachedGlobal(name, context) {
    var res = this._wrapped_cps2.getCachedGlobal(name, context);
    var v = res;
    if (v) {
      v = v.value;
    }
    log("ContentPrefService2.getCachedGlobal(" + name + ") => " + v);
    return res;
  },

  set: function CPS2_set(group, name, value, context, callback) {
    callback = new MyCallback("ContentPrefService2.set(" + group + ", " + name + ", " + value + ")", callback);
    this._wrapped_cps2.set(group, name, value, context, callback);
  },

  setGlobal: function CPS2_setGlobal(name, value, context, callback) {
    callback = new MyCallback("ContentPrefService2.setGlobal(" + name + ", " + value + ")", callback);
    this._wrapped_cps2.setGlobal(name, value, context, callback);
  },

  removeByDomainAndName: function CPS2_removeByDomainAndName(group, name, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeByDomainAndName(" + group + ", " + name + ")", callback);
    this._wrapped_cps2.removeByDomainAndName(group, name, context, callback);
  },

  removeBySubdomainAndName: function CPS2_removeBySubdomainAndName(group, name, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeBySubdomainAndName(" + group + ", " + name + ")", callback);
    this._wrapped_cps2.removeBySubdomainAndName(group, name, context, callback);
  },

  removeGlobal: function CPS2_removeGlobal(name, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeGlobal(" + name + ")", callback);
    this._wrapped_cps2.removeGlobal(name, context, callback);
  },

  removeByDomain: function CPS2_removeByDomain(group, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeByDomain(" + group + ")", callback);
    this._wrapped_cps2.removeByDomain(group, context, callback);
  },

  removeBySubdomain: function CPS2_removeBySubdomain(group, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeBySubdomain(" + group + ")", callback);
    this._wrapped_cps2.removeBySubdomain(group, context, callback);
  },

  removeByName: function CPS2_removeByName(name, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeByName(" + name + ")", callback);
    this._wrapped_cps2.removeByName(name, context, callback);
  },

  removeAllDomains: function CPS2_removeAllDomains(context, callback) {
    callback = new MyCallback("ContentPrefService2.removeAllDomains()", callback);
    this._wrapped_cps2.removeAllDomains(context, callback);
  },

  removeAllDomainsSince: function CPS2_removeAllDomainsSince(since, context, callback) {
    callback = new MyCallback("ContentPrefService2.removeAllDomainsSince(" + since + ")", callback);
    this._wrapped_cps2.removeAllDomainsSince(since, context, callback);
  },

  removeAllGlobals: function CPS2_removeAllGlobals(context, callback) {
    callback = new MyCallback("ContentPrefService2.removeAllGlobals()", callback);
    this._wrapped_cps2.removeAllGlobals(context, callback);
  },

  addObserverForName: function CPS2_addObserverForName(name, observer) {
    log("ContentPrefService2.addObserverForName(" + name + ")");
    this._wrapped_cps2.addObserverForName(name, observer);
  },

  removeObserverForName: function CPS2_removeObserverForName(name, observer) {
    log("ContentPrefService2.removeObserverForName(" + name + ")");
    this._wrapped_cps2.removeObserverForName(name, observer);
  },

  extractDomain: function CPS2_extractDomain(str) {
    return this._wrapped_cps2.extractDomain(str);
  },
  // nsIContentPrefService2 ends
};

function startup(data, reason) {
  myContentPrefService.register();
}

function shutdown(data, reason) {
  myContentPrefService.unregister();
}

function install(data, reason) {}

function uninstall(data, reason) {}

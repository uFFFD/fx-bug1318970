"use strict";

var { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");

function log(msg) {
  Services.console.logStringMessage(msg);
}

var cpsObs = {
  onContentPrefRemoved: function(group, name) {
    log("ContentPrefObserver.onContentPrefRemoved: " + group + ", " + name);
  },
  onContentPrefSet: function(group, name, val) {
    log("ContentPrefObserver.onContentPrefSet: " + group + ", " + name + ", " + val);
  },
};

function startup(data, reason) {
  log("ContentPrefObserver startup");
  if ("nsIContentPrefService2" in Ci) {
    var cps2 = Cc["@mozilla.org/content-pref/service;1"].getService(Ci.nsIContentPrefService2);
    cps2.addObserverForName(null, cpsObs);
  } else {
    var cps = Cc["@mozilla.org/content-pref/service;1"].getService(Ci.nsIContentPrefService);
    cps.addObserver(null, cpsObs);
  }
}

function shutdown(data, reason) {
  log("ContentPrefObserver shutdown");
  if ("nsIContentPrefService2" in Ci) {
    var cps2 = Cc["@mozilla.org/content-pref/service;1"].getService(Ci.nsIContentPrefService2);
    cps2.removeObserverForName(null, cpsObs);
  } else {
    var cps = Cc["@mozilla.org/content-pref/service;1"].getService(Ci.nsIContentPrefService);
    cps.removeObserver(null, cpsObs);
  }
}

function install(data, reason) {}

function uninstall(data, reason) {}

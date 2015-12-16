/**
 * API prefix JS for AMD exposition
 * Created on 16/12/2015.
 * @author Tony Georges - Smart/Origin
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals
    root.OSMBuildings = factory(root);
  }
}(this, function (global) {

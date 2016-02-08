/**
 * Created by tony on 16/12/2015.
 */
var profile = (function () {
  return {
    resourceTags: {
      amd: function (filename, mid) {
        return /\.js$/.test(filename);
      }
    }
  };
})();

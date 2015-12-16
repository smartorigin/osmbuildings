/**
 * ExternalInterface API
 * Created on 16/12/2015.
 * @author Tony Georges - Smart/Origin
 * @copyright (c)2015, Smart Origin SARL
 * @license
 * Copyright (c) 2015 Smart Origin SARL
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice, this list of
 *  conditions and the following disclaimer.

 *  2. Redistributions in binary form must reproduce the above copyright notice, this list
 *  of conditions and the following disclaimer in the documentation and/or other materials
 *  provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


var osmb = function() {


};

var proto = osmb.prototype =  {};

proto.setMinZoom = function(zoom)
{
  MIN_ZOOM = zoom;
};

proto.getAttribution = function()
{
  return ATTRIBUTION;
};

proto.appendTo = function(element)
{
  Layers.appendTo(element);
  return Layers.container;

};

proto.moveCam = function(offset) {
  CAM_X = CENTER_X + offset.x;
  CAM_Y = HEIGHT   + offset.y;
  Layers.render(true);
};

proto.setTileSize = function(size)
{
  MAP_TILE_SIZE = size;
};

proto.setOrigin = function(origin)
{
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
};

proto.setSize = function(size)
{
  WIDTH  = size.width;
  HEIGHT = size.height;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;

  CAM_X = CENTER_X;
  CAM_Y = HEIGHT;

  Layers.setSize(WIDTH, HEIGHT);
  MAX_HEIGHT = CAM_Z-50;
};

proto.setZoom = function(z) {
  ZOOM = z;
  MAP_SIZE = MAP_TILE_SIZE <<ZOOM;

  var center = pixelToGeo(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  var a = geoToPixel(center.latitude, 0);
  var b = geoToPixel(center.latitude, 1);
  PIXEL_PER_DEG = b.x-a.x;

  ZOOM_FACTOR = pow(0.95, ZOOM-MIN_ZOOM);

  WALL_COLOR_STR = ''+ WALL_COLOR.alpha(ZOOM_FACTOR);
  ALT_COLOR_STR  = ''+ ALT_COLOR.alpha( ZOOM_FACTOR);
  ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
};

/*DONE in public proto.load = function(src, key)
{
  return Data.load(src,key);
};*/

proto.render = function()
{
  Layers.render();
};

proto.onZoomEnd = function(event)
{
  isZooming = false;
  setZoom(event.zoom);
  Data.update(); // => fadeIn()
  Layers.render();
};

proto.onZoomStart = function()
{
  isZooming = true;
// effectively clears because of isZooming flag
// TODO: introduce explicit clear()
  Layers.render();
};

proto.onMoveEnd = function(e) {
  Layers.render();
  Data.update(); // => fadeIn() => Layers.render()
};

proto.addRenderItems = function(geojson, allAreNew)
{
  return Data.addRenderItems(geojson, allAreNew);
};

proto.clear = function()
{
  return Data.addRenderItems({features: []});
};

proto.setStyle = function(wallColor, altColor, roofColor, shadowColor, shadowBlurColor)
{
  Shadows.color     = shadowColor;
  Shadows.blurColor = shadowBlurColor;
  WALL_COLOR        = new Color(wallColor);
  ALT_COLOR         = new Color(altColor);
  ROOF_COLOR        = new Color(roofColor);
};



//Override Color alpha function

Color.prototype.alpha = function(a) {
  this.A = a;
  return this;
};
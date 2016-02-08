/**
 * OSMBuildingsLayerForArcGIS dojo module
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
define(['dojo/_base/declare', "dojo/_base/lang", 'dojo/_base/array', 'dojo/dom-construct', 'dojo/dom-style',
        'esri/request', 'esri/config', 'esri/tasks/QueryTask', 'dojo/has!esri-3x?esri/tasks/query:esri/tasks/support/Query', 'dojo/has!esri-3x?esri/layers/layer:esri/layers/Layer',
        'esri/geometry/Point', './OSMBuildings-ExternalInterface'],
       function (declare, lang, array, domConstruct, domStyle,
                 esriRequest, esriConfig, QueryTask, Query, Layer, Point, ExternalInterface)
       {

         /**
          * ArcGIS for JavaScript OSMBuildings custom layer.
          * Encapsulate access to OSMBuildings "canvas" implementation through a simple ExternalInterface version of the OSMBuildings canvas api.
          *
          * This layer was originally provided in OSMBuildings engines, but was not compatible with dojo AMD loader.
          * All the capabilities provided in first version were kept in place and will be fully tested and validated soon (especially the connection with a backend FeatureLayer for attributes)
          *
          * Feel free to contact me for details and informations (usage, bugs, etc)
          *
          * @class so.arcgis.layers.BuildingsLayer
          * @extends esri.layer.Layer
          */
         var BuildingsLayer           = declare('so.arcgis.layers.BuildingsLayer', [Layer], {/** @lends so.arcgis.layers.BuildingsLayer.prototype */
           _externalInterface           : null,
           _container: null,
           _tileInfo : null,
           _mode     : 0,// ON_DEMAND|SNAPSHOT
           _heightAttribute: '',
           _oidField       : null,  // will be overridden from meta query
           _query          : null,
           _task           : null,
           _oids           : null, //track current objectids to mark new/old for animation fade in
           _featureExt     : null,//current feature extent, 1.5 map extent
           _suspendOnPan   : false,//whether to suspend drawing during map panning. default is false.
           // set to true if performance is not optimal (non-Chrome browsers);

           /**
            * @name BuildingsLayerOptions
            * @class This is an object literal that specify the options for each BuildingsLayer.
            * @property {string} heightAttribute required. name of the attribute for height;
            * @property {number} [defaultHeight] optional. default Height to use if the height value is 0. default=0;
            * @property {number} [heightScaleRatio] optional. number used to multiple the value from service. default=1;
            * @property {number} [extentScaleRatio] optional. extra buffer on map extent to load features to reduce server traffic. default=1.5;
            * @property {esri.tasks.Query} [query] optional. query set on the feature layer for retrieving data.
            * @property {int} [mode] optional. so.arcgis.layers.BuildingsLayer.MODE_ONDEMAND | MODE_SNAPSHOT. default=ON_DEMAND
            * @property {Object} [style] object with wallColor, roofColor, altColor, shadowColor, shadowBlurColor (#ffcc00' 'rgb(255,200,200)' 'rgba(255,200,200,0.9))
            */
           /**
            * Create an BuildingsLayer
            * @name BuildingsLayer
            * @constructor
            * @class This class is a BuildingsLayer, such as a polygon feature layer with a height attribute.
            * @param {string||FeatureCollection} url
            * @param {BuildingsLayerOptions} opts
            */
           constructor: function (url, opts)
           {
             // Manually call superclass constructor with required arguments
             if (!(!!document.createElement('canvas').getContext))
             {
               throw new Error('Canvas unsupported. Try different browser');
             }
             this.inherited(arguments);
             opts                   = opts || {};
             this._heightAttribute = opts.heightAttribute;
             this._mode            = opts.mode || BuildingsLayer.MODE_ONDEMAND;
             this._heightScaleRatio = opts.heightScaleRatio || 1;
             this._extentScaleRatio = opts.extentScaleRatio || 1.5;
             this._defaultHeight    = opts.defaultHeight || 0;

             //Create external interface
             this._externalInterface = new ExternalInterface();

             /* Apply MIN ZOOM */
             this._externalInterface.setMinZoom(18);
             /* Apply default style */
             this._applyStyle(opts.style);

             // Deal with feature collection
             if (url)
             {
               if (lang.isObject(url) && url.featureSet)
               {
                 this._mode = BuildingsLayer.MODE_SNAPSHOT;
                 this._setFeatures(url.featureSet.features);
                 this.loaded = true;
                 this.onLoad(this);
               }
               else
               {
                 this._url = url;
                 // get meta data for layer
                 new esriRequest({
                   url              : this._url,
                   content: {
                     f: 'json'
                   },
                   callbackParamName: 'callback'
                 }).then(lang.hitch(this, this._initLayer));
                 this._query = new Query();
                 lang.mixin(this._query, opts.query);
                 lang.mixin(this._query, {
                   returnGeometry     : true,
                   outSpatialReference: {wkid: 4326}
                 });
                 this._task = new QueryTask(url);
                 this._task.on('complete', lang.hitch(this, this._onQueryComplete));
                 this._task.on('error', esriConfig.defaults.io.errorHandler);
               }
             }
             else
             {
               this._mode = BuildingsLayer.MODE_SNAPSHOT;
               this._setFeatures([]);
               this.loaded = true;
               this.onLoad(this);
             }
           },

           /**********************
            * @see http://help.arcgis.com/en/webapi/javascript/arcgis/samples/exp_rasterlayer/javascript/RasterLayer.js
            * Internal Properties
            *
            * _map
            * _element
            * _context
            * _mapWidth
            * _mapHeight
            * _connects
            **********************/
           _setMap         : function (map, container, ind, lod)
           {
             this._map = map;
             this.inherited(arguments);

             var element = domConstruct.create('div', {

               style: 'position: absolute; left: 0px; top: 0px;width : ' + map.width + 'px;height: ' + map.height + 'px'
             }, container);

             // allow attribution widget to add copyright text
             this.suspended = false;
             /* Attribution */
             this.copyright = this._externalInterface.getAttribution() + (this.copyright?(',' + this.copyrightText):'');

             this._element = element;

             /* Append OSMBuildings surface to layer div*/
             this._container = this._externalInterface.appendTo(element);

             /* TODO : setSize */
             this._externalInterface.setSize(map);
             // calculate origins
             if (map.layerIds.length == 0 || !map.getLayer(map.layerIds[0]).tileInfo)
             {
               throw new Error('must have at least one tiled layer added before this layer');
             }
             this._tileInfo = map.getLayer(map.layerIds[0]).tileInfo;
             this._externalInterface.setTileSize(this._tileInfo.width);
             //TODO : setZOOM
             this._externalInterface.setZoom(map.getLevel());
             this._setOrigin();
             // TODO : LOAD
             this._externalInterface.load();
             this._loadData();
             // Event connections
             this._connects = [];
             this._connects.push(map.on('resize', lang.hitch(this, this._onResize)));
             this._connects.push(map.on('pan', lang.hitch(this, this._onPan)));
             this._connects.push(map.on('extent-change', lang.hitch(this, this._onExtentChange)));
             this._connects.push(map.on('zoom-start', lang.hitch(this, this._onZoomStart)));
             return element;
           },
           /**
            * Unset map
            * @param map
            * @param container
            * @private
            */
           _unsetMap: function (map, container)
           {
             if (this._externalInterface)
             {
               this._container.parentNode.removeChild(this._container);
               this._externalInterface = null;
             }
             array.forEach(this._connects, function (handle)
             {
               handle.remove();
             });
             if (this._element)
             {
               container.removeChild(this._element);
             }
             this._map     = null;
             this._element = null;
           },
           /**
            * Init the layer draw metadata
            * @param json
            * @private
            */
           _initLayer: function (json)
           {
             //dojo.mixin(this, json);
             this.setMinScale(json.minScale || 0);
             this.setMaxScale (json.maxScale || 0);
             this.copyrightText = json.copyrightText;
             array.some(json.fields, function (field, i)
             {
               if (field.type == 'esriFieldTypeOID')
               {
                 this._oidField = field.name;
                 return true;
               }
               return false;
             }, this);
             this._query.outFields = [this._oidField, this._heightAttribute];
             this.loaded           = true;
             this.onLoad(this);
           },
           _setOrigin: function (dx, dy)
           {
             var resolution = this._tileInfo.lods[this._map.getLevel()].resolution;
             var topLeft = this._map.toMap(new Point(0, 0));
             var x       = Math.round((topLeft.x - this._tileInfo.origin.x) / resolution);
             var y       = Math.round((this._tileInfo.origin.y - topLeft.y) / resolution);
             //setOrigin
             this._externalInterface.setOrigin({x: x + (dx || 0), y: y + (dy || 0)});
             //setSize
             this._externalInterface.setSize({width: this._map.width, height: this._map.height});

           },
           _onResize : function (extent, width, height)
           {
             if (this._externalInterface)
             {
               //setSize
               this._externalInterface.setSize({width: width, height: height});
               //render
               this._externalInterface.render();
             }
           },
           _onPan    : function (event)//)extent, delta)
           {
             if (this._suspendOnPan)
             {
               domStyle.set(this._container, {
                 left: event.delta.x + 'px',
                 top : event.delta.y + 'px'
               });
               //moveCam(-delta.x, -delta.y);
             }
             else
             {
               this._setOrigin(-event.delta.x, -event.delta.y);
               //render
               this._externalInterface.render();
             }
           },

           _onExtentChange: function (event)
           {
             domStyle.set(this._container, {
               left: 0,
               top : 0
             });
             this._setOrigin();
             //moveCam
             this._externalInterface.moveCam({x: 0, y: 0});
             if (event.levelChange)
             {
               //Execute onZoomEnd
               this._externalInterface.onZoomEnd({
                           zoom: this._map.getLevel()
                         });

               if (this.isVisibleAtScale(this._map.getScale()))
               {
                 this._loadData();
               }
               else
               {
                 // clear canvas.
                 this._externalInterface.clear();
               }
             }
             else
             {
               //Call onMoveEnd
               this._externalInterface.onMoveEnd();
               if (this._featureExt && !this._featureExt.contains(extent))
               {
                 this._loadData();
               }
             }
           },
           _onZoomStart   : function (extent, zoomFactor, anchor, level)
           {
             //CallonZoomStart
             this._externalInterface.onZoomStart();
           },
           _setFeatures   : function (features)
           {
             var oids   = {};
             var jfs  = [];
             this._oids = this._oids || {};
             for (var i = 0; i < features.length; i++)
             {
               var f = features[i];

               var oid = f.attributes[this._oidField];
               var gj  = {
                 type      : 'Feature',
                 geometry: {
                   type       : 'Polygon',
                   coordinates: f.geometry.rings
                 },
                 properties: {
                   height: (f.attributes[this._heightAttribute] || this._defaultHeight) * this._heightScaleRatio,
                   isNew : !this._oids[oid]
                 }
               };
               // find out the y coords range for sorting
               var minY = maxY = f.geometry.rings[0][0][1];
               for (var j = 0; j < f.geometry.rings.length; j++)
               {
                 for (var k = 0; k < f.geometry.rings[j].length; k++)
                 {
                   minY = Math.min(minY, f.geometry.rings[j][k][1]);
                   maxY = Math.max(maxY, f.geometry.rings[j][k][1]);
                 }
               }
               gj.minY   = minY;
               gj.maxY = maxY;
               jfs[i]  = gj;
               oids[oid] = f;
             }
             // sort features by height and y coord desc for potential drawing improvement
             jfs.sort(function (a, b)
                      {
                        // if polygon a is completely north of b then put a first.
                        // otherwise put the taller one first.
                        // this ensures north/taller poly draw first
                        if (a.maxY < b.minY)
                        {
                          return 1;
                        }
                        else if (a.minY > b.maxY)
                        {
                          return -1;
                        }
                        else
                        {
                          return b.properties.height - a.properties.height
                        }
                      });
             this._oids = oids;

             //TODO : test
             this._externalInterface.addRenderItems({
                                                      type: 'FeatureCollection',
                                                      features: jfs
                                                    });

             if (this._style)
             {
               //style
               this._externalInterface.style(this._style);
             }
           },
           _loadData      : function ()
           {
             if (this._mode == BuildingsLayer.MODE_SNAPSHOT)
             {
               if (this._oids)
               {
                 return;
               }
               else
               {
                 this._query.geometry = null;
                 this._query.where    = this._query.where || '1=1';

               }
             }
             else
             {
               this._featureExt     = this._map.extent.expand(this._extentScaleRatio);
               this._query.geometry = this._featureExt;
             }
             this._task.execute(this._query);


           },
           _onQueryComplete: function (featureSet)
           {
             this._setFeatures(featureSet.features);
           },

           _applyStyle : function(style)
           {
             style = style || {}
             var wallColor = style.wallColor || 'rgba(219, 217, 213)',
                 altColor  = style.altColor || 'rgba(194, 192, 188)',
                 roofColor = style.roofColor || 'rgba(252, 252, 252,1)',
                 shadowColor = style.shadowColor || '#444444',
                 shadowBlurColor = style.shadowBlurColor || '#111111';
             this._externalInterface.setStyle(wallColor, altColor, roofColor, shadowColor, shadowBlurColor);

           }
         });
         BuildingsLayer.MODE_ONDEMAND = 0;
         BuildingsLayer.MODE_SNAPSHOT = 1;

         return BuildingsLayer;
       });
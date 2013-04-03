(function(p){function M(n,q){var w=n[0]-q[0],g=n[1]-q[1];return w*w+g*g}function R(n){for(var q=0,w=0,g=0,i=n.length-3;g<i;g+=2){q+=n[g];w+=n[g+1]}n=(n.length-2)*2;return[q/n<<0,w/n<<0]}function ya(n){var q=n.length/2,w=new Ma(q),g=0,i=q-1,k,v,r,E,H=[],N=[],J=[];for(w[g]=w[i]=1;i;){v=0;for(k=g+1;k<i;k++){r=n[k*2];var Z=n[k*2+1],V=n[g*2],K=n[g*2+1],ia=n[i*2],$=n[i*2+1],s=ia-V,o=$-K,C=void 0;if(s!==0||o!==0){C=((r-V)*s+(Z-K)*o)/(s*s+o*o);if(C>1){V=ia;K=$}else if(C>0){V+=s*C;K+=o*C}}s=r-V;o=Z-K;r=s*
s+o*o;if(r>v){E=k;v=r}}if(v>2){w[E]=1;H.push(g);N.push(E);H.push(E);N.push(i)}g=H.pop();i=N.pop()}for(k=0;k<q;k++)w[k]&&J.push(n[k*2],n[k*2+1]);return J}var Na=Na||Array,Ma=Ma||Array,da=Math,Qa=da.exp,Ra=da.log,Sa=da.sin,Ta=da.cos,Ga=da.tan,Ua=da.atan,ma=da.min,za=da.max,Aa=p.document,U=function(){function n(g,i,k){if(k<0)k+=1;if(k>1)k-=1;if(k<1/6)return g+(i-g)*6*k;if(k<0.5)return i;if(k<2/3)return g+(i-g)*(2/3-k)*6;return g}function q(g,i,k,v){this.r=g;this.g=i;this.b=k;this.a=arguments.length<
4?1:v}var w=q.prototype;w.toString=function(){return"rgba("+[this.r<<0,this.g<<0,this.b<<0,this.a.toFixed(2)].join(",")+")"};w.adjustLightness=function(g){var i=U.toHSLA(this);i.l*=g;i.l=Math.min(1,Math.max(0,i.l));var k,v;if(i.s===0)g=k=v=i.l;else{v=i.l<0.5?i.l*(1+i.s):i.l+i.s-i.l*i.s;var r=2*i.l-v;g=n(r,v,i.h+1/3);k=n(r,v,i.h);v=n(r,v,i.h-1/3)}return new U(g*255<<0,k*255<<0,v*255<<0,i.a)};w.adjustAlpha=function(g){return new U(this.r,this.g,this.b,this.a*g)};q.parse=function(g){g+="";if(~g.indexOf("#")){g=
g.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new U(parseInt(g[1],16),parseInt(g[2],16),parseInt(g[3],16),g[4]?parseInt(g[4],16)/255:1)}if(g=g.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new U(parseInt(g[1],10),parseInt(g[2],10),parseInt(g[3],10),g[4]?parseFloat(g[5],10):1)};q.toHSLA=function(g){var i=g.r/255,k=g.g/255,v=g.b/255,r=Math.max(i,k,v),E=Math.min(i,k,v),H,N=(r+E)/2,J;if(r===E)H=E=0;else{J=r-E;E=N>0.5?J/(2-r-E):J/(r+E);switch(r){case i:H=(k-v)/J+(k<v?6:0);break;case k:H=
(v-i)/J+2;break;case v:H=(i-k)/J+4;break}H/=6}return{h:H,s:E,l:N,a:g.a}};return q}(),Va=function(){var n=Math,q=n.sin,w=n.cos,g=n.tan,i=n.asin,k=n.atan2,v=n.PI,r=180/v,E=357.5291/r,H=0.98560028/r,N=1.9148/r,J=0.02/r,Z=3.0E-4/r,V=102.9372/r,K=23.45/r,ia=280.16/r,$=360.9856235/r;return function(s,o,C){C=-C/r;o=o/r;s=s.valueOf()/864E5-0.5+2440588;var O=E+H*(s-2451545),F=N*q(O)+J*q(2*O)+Z*q(3*O);F=O+V+F+v;O=i(q(F)*q(K));F=k(q(F)*w(K),w(F));C=ia+$*(s-2451545)-C-F;return{altitude:i(q(o)*q(O)+w(o)*w(O)*
w(C)),azimuth:k(q(C),w(C)*q(o)-g(O)*w(o))-v/2}}}(),na=Math.PI,Oa=na/2,Wa=na/4,Xa=180/na,Ya=256,Ha=14,oa="latitude",pa="longitude",S=0,P=1,T=2,ea=3,Ba=4,ja=5,aa=6;p.OSMBuildings=function(n){function q(a,d){var c={};a/=qa;d/=qa;c[oa]=d<=0?90:d>=1?-90:Xa*(2*Ua(Qa(na*(1-2*d)))-Oa);c[pa]=(a===1?1:(a%1+1)%1)*360-180;return c}function w(a,d){return a.replace(/\{ *([\w_]+) *\}/g,function(c,b){return d[b]})}function g(a,d){var c=new XMLHttpRequest;c.onreadystatechange=function(){if(c.readyState===4)!c.status||
c.status<200||c.status>299||c.responseText&&d(JSON.parse(c.responseText))};c.open("GET",a);c.send(null);return c}function i(){if(!(!Ia||Q<Ha)){var a=q(F-C,ba-O),d=q(F+s+C,ba+o+O);Ca&&Ca.abort();Ca=g(w(Ia,{w:a[pa],n:a[oa],e:d[pa],s:d[oa],z:Q}),k)}}function k(a){var d,c,b,e=[],f,h=f=0;ka=Ha;N(Q);Ca=null;if(!(!a||a.meta.z!==Q)){b=a.meta;c=a.data;if(D&&y&&D.z===b.z){f=D.x-b.x;h=D.y-b.y;a=0;for(d=y.length;a<d;a++)e[a]=y[a][T][0]+f+","+(y[a][T][1]+h)}D=b;y=[];a=0;for(d=c.length;a<d;a++){b=[];if(!(c[a][P]>
ra)){f=ya(c[a][T]);if(!(f.length<8)){b[T]=f;b[Ba]=R(f);b[S]=ma(c[a][S],ra);b[P]=c[a][P];f=b[T][0]+","+b[T][1];b[ja]=!(e&&~e.indexOf(f));b[ea]=[];b[aa]=[];y.push(b)}}}J()}}function v(a,d){var c=[],b,e,f,h,j,l,m,A,x,G=Ja-Q;b=0;for(e=a.length;b<e;b++){j=a[b];A=j[P]>>G;if(!(A>ra)){l=j[T];x=new Na(l.length);f=0;for(h=l.length-1;f<h;f+=2){m=l[f+1];var z=ma(1,za(0,0.5-Ra(Ga(Wa+Oa*l[f]/180))/na/2));m={x:(m/360+0.5)*qa<<0,y:z*qa<<0};x[f]=m.x;x[f+1]=m.y}x=ya(x);if(!(x.length<8)){h=[];h[T]=x;h[Ba]=R(x);h[S]=
ma(j[S]>>G,ra);h[P]=A;h[ja]=d;h[ea]=j[ea];h[aa]=[];for(f=0;f<3;f++)if(h[ea][f])h[aa][f]=h[ea][f].adjustAlpha(W)+"";c.push(h)}}}return c}function r(a,d){if(typeof a==="object")H(a,!d);else{var c=Aa.documentElement,b=Aa.createElement("script");p.jsonpCallback=function(e){delete p.jsonpCallback;c.removeChild(b);H(e,!d)};c.insertBefore(b,c.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function E(a,d,c){if(c===undefined)c=[];var b,e,f,h=a[0]?a:a.features,j,l,m,A,x,G=d?1:0,z=d?0:1;if(h){b=0;
for(a=h.length;b<a;b++)E(h[b],d,c);return c}if(a.type==="Feature"){j=a.geometry;b=a.properties}if(j.type==="Polygon")l=[j.coordinates];if(j.type==="MultiPolygon")l=j.coordinates;if(l){d=b.height;if(b.color||b.wallColor)A=U.parse(b.color||b.wallColor);if(b.roofColor)x=U.parse(b.roofColor);b=0;for(a=l.length;b<a;b++){h=l[b][0];m=[];e=j=0;for(f=h.length;e<f;e++){m.push(h[e][G],h[e][z]);j+=d||h[e][2]||0}if(j){e=[];f=T;var t=void 0,u=void 0,B=void 0,L=void 0,X=0,Y=void 0,sa=void 0;Y=0;for(sa=m.length-
3;Y<sa;Y+=2){t=m[Y];u=m[Y+1];B=m[Y+2];L=m[Y+3];X+=t*L-B*u}if((X/2>0?"CW":"CCW")==="CW")m=m;else{t=[];for(u=m.length-2;u>=0;u-=2)t.push(m[u],m[u+1]);m=t}e[f]=m;e[S]=j/h.length<<0;e[ea]=[A||null,A?A.adjustLightness(0.8):null,x?x:A?A.adjustLightness(1.2):ca];c.push(e)}}}return c}function H(a,d){if(a){ta=E(a,d);ka=0;N(Q);D={n:90,w:-180,s:-90,e:180,x:0,y:0,z:Q};y=v(ta,true);J()}else{ta=null;K()}}function N(a){var d,c,b;Q=a;qa=Ya<<Q;a=Q;d=ka;c=Ja;a=ma(za(a,d),c);W=1-ma(za(0+(a-d)/(c-d)*0.4,0),0.4);Ka=fa.adjustAlpha(W)+
"";ua=Da.adjustAlpha(W)+"";va=ca.adjustAlpha(W)+"";if(y){a=0;for(d=y.length;a<d;a++){b=y[a];b[aa]=[];for(c=0;c<3;c++)if(b[ea][c])b[aa][c]=b[ea][c].adjustAlpha(W)+""}}}function J(){clearInterval(La);ga=0;Ea.render();La=setInterval(function(){ga+=0.1;if(ga>1){clearInterval(La);ga=1;for(var a=0,d=y.length;a<d;a++)y[a][ja]=0}Fa.render();K()},33)}function Z(){Fa.render();Ea.render();K()}function V(){I.clearRect(0,0,s,o);if(!(!D||!y||Q<ka||wa)){var a,d,c,b,e,f,h,j,l,m=F-D.x,A=ba-D.y,x=Ea.getMaxHeight(),
G=[ha+m,xa+A],z,t,u,B,L,X;y.sort(function(Y,sa){return M(sa[Ba],G)/sa[S]-M(Y[Ba],G)/Y[S]});a=0;for(d=y.length;a<d;a++){e=y[a];if(!(e[S]<=x)){t=false;f=e[T];z=[];c=0;for(b=f.length-1;c<b;c+=2){z[c]=j=f[c]-m;z[c+1]=l=f[c+1]-A;t||(t=j>0&&j<s&&l>0&&l<o)}if(t){c=e[ja]?e[S]*ga:e[S];f=la/(la-c);if(e[P]){c=e[ja]?e[P]*ga:e[P];h=la/(la-c)}j=[];c=0;for(b=z.length-3;c<b;c+=2){l=z[c];u=z[c+1];t=z[c+2];B=z[c+3];L=$(l,u,f);X=$(t,B,f);if(e[P]){u=$(l,u,h);B=$(t,B,h);l=u.x;u=u.y;t=B.x;B=B.y}if((t-l)*(L.y-u)>(L.x-l)*
(B-u)){I.fillStyle=l<t&&u<B||l>t&&u>B?e[aa][1]||ua:e[aa][0]||Ka;ia([t,B,l,u,L.x,L.y,X.x,X.y])}j[c]=L.x;j[c+1]=L.y}I.fillStyle=e[aa][2]||va;I.strokeStyle=e[aa][1]||ua;ia(j,true)}}}}}function K(){var a=s/(window.devicePixelRatio||1)/30;ha-=a;V();var d=I.getImageData(0,0,s,o);ha+=2*a;V();var c=I.getImageData(0,0,s,o);ha-=a;a=d.data;c=c.data;for(var b,e,f,h,j=0,l=a.length;j<l;j+=4){b=j;e=j+1;f=j+2;h=j+3;if(a[h]||c[h]){a[b]=0.7*(a[e]||235)+0.3*(a[f]||230);a[e]=c[e]||ca.g;a[f]=c[f]||ca.b;a[h]=za(a[h],c[h])}}I.clearRect(0,
0,s,o);I.putImageData(d,0,0)}function ia(a,d){if(a.length){I.beginPath();I.moveTo(a[0],a[1]);for(var c=2,b=a.length;c<b;c+=2)I.lineTo(a[c],a[c+1]);I.closePath();d&&I.stroke();I.fill()}}function $(a,d,c){return{x:(a-ha)*c+ha<<0,y:(d-xa)*c+xa<<0}}var s=0,o=0,C=0,O=0,F=0,ba=0,Q,qa,Ca,I,Ia,fa=new U(200,190,180),Da=fa.adjustLightness(0.8),ca=fa.adjustLightness(1.2),Ka=fa+"",ua=Da+"",va=ca+"",ta,D,y,ga=1,La,W=1,ka=Ha,Ja=20,ra,ha,xa,la,wa,Pa={container:null,items:[],init:function(a){var d=this.container=
Aa.createElement("DIV");d.style.pointerEvents="none";d.style.position="absolute";d.style.left=0;d.style.top=0;Fa.init(this.create());Ea.init(this.create());I=this.create();a.appendChild(d);return d},create:function(){var a=Aa.createElement("CANVAS");a.style.webkitTransform="translate3d(0,0,0)";a.style.imageRendering="optimizeSpeed";a.style.position="absolute";a.style.left=0;a.style.top=0;var d=a.getContext("2d");d.lineCap="round";d.lineJoin="round";d.lineWidth=1;try{d.mozImageSmoothingEnabled=false}catch(c){}this.items.push(a);
this.container.appendChild(a);return d},setSize:function(a,d){for(var c=this.items,b=0,e=c.length;b<e;b++){c[b].width=a;c[b].height=d}}},Fa={context:null,color:new U(0,0,0),colorStr:this.color+"",date:null,alpha:1,length:0,directionX:0,directionY:0,init:function(a){this.context=a;this.setDate((new Date).setHours(10))},render:function(){var a=this.context,d,c,b,e;a.clearRect(0,0,s,o);if(!(!D||!y||Q<ka||wa)){d=q(F+C,ba+O);d=Va(this.date,d.latitude,d.longitude);if(!(d.altitude<=0)){c=1/Ga(d.altitude);
b=0.4/c;this.directionX=Ta(d.azimuth)*c;this.directionY=Sa(d.azimuth)*c;this.color.a=b;e=this.color+"";var f,h,j,l,m,A=F-D.x,x=ba-D.y,G,z,t,u,B,L,X=[];a.beginPath();d=0;for(c=y.length;d<c;d++){h=y[d];z=false;j=h[T];G=[];b=0;for(f=j.length-1;b<f;b+=2){G[b]=l=j[b]-A;G[b+1]=m=j[b+1]-x;z||(z=l>0&&l<s&&m>0&&m<o)}if(z){j=h[ja]?h[S]*ga:h[S];if(h[P])j=h[ja]?h[P]*ga:h[P];l=null;b=0;for(f=G.length-3;b<f;b+=2){m=G[b];t=G[b+1];z=G[b+2];u=G[b+3];B=this.project(m,t,j);L=this.project(z,u,j);if(h[P]){t=this.project(m,
t,j);u=this.project(z,u,j);m=t.x;t=t.y;z=u.x;u=u.y}if((z-m)*(B.y-t)>(B.x-m)*(u-t)){l===1&&a.lineTo(m,t);l=0;b||a.moveTo(m,t);a.lineTo(z,u)}else{l===0&&a.lineTo(B.x,B.y);l=1;b||a.moveTo(B.x,B.y);a.lineTo(L.x,L.y)}}a.closePath();X.push(G)}}a.fillStyle=e;a.fill();a.globalCompositeOperation="destination-out";a.beginPath();d=0;for(c=X.length;d<c;d++){e=X[d];a.moveTo(e[0],e[1]);b=2;for(f=e.length;b<f;b+=2)a.lineTo(e[b],e[b+1]);a.lineTo(e[0],e[1]);a.closePath()}a.fillStyle="#00ff00";a.fill();a.globalCompositeOperation=
"source-over"}}},project:function(a,d,c){return{x:a+this.directionX*c,y:d+this.directionY*c}},setDate:function(a){this.date=a;this.render()}},Ea={context:null,maxHeight:8,init:function(a){this.context=a},render:function(){var a=this.context;a.clearRect(0,0,s,o);if(!(!D||!y||Q<ka||wa)){var d,c,b,e,f,h,j,l=F-D.x,m=ba-D.y,A,x;a.beginPath();d=0;for(c=y.length;d<c;d++){b=y[d];x=false;f=b[T];A=[];b=0;for(e=f.length-1;b<e;b+=2){A[b]=h=f[b]-l;A[b+1]=j=f[b+1]-m;x||(x=h>0&&h<s&&j>0&&j<o)}if(x){b=0;for(e=A.length-
3;b<e;b+=2){x=A[b];f=A[b+1];b?a.lineTo(x,f):a.moveTo(x,f)}a.closePath()}}a.fillStyle=va;a.strokeStyle=ua;a.stroke();a.fill()}},getMaxHeight:function(){return this.maxHeight}};this.setStyle=function(a){a=(a=a)||{};if(a.color||a.wallColor){fa=U.parse(a.color||a.wallColor);Ka=fa.adjustAlpha(W)+"";Da=fa.adjustLightness(0.8);ua=Da.adjustAlpha(W)+"";ca=fa.adjustLightness(1.2);va=ca.adjustAlpha(W)+""}if(a.roofColor){ca=U.parse(a.roofColor);va=ca.adjustAlpha(W)+""}Z();return this};this.geoJSON=function(a,
d){r(a,d);return this};this.setCamOffset=function(a,d){ha=C+a;xa=o+d};this.setMaxZoom=function(a){Ja=a};this.setDate=function(a){Fa.setDate(a);return this};this.appendTo=function(a){return Pa.init(a)};this.loadData=i;this.onMoveEnd=function(){var a=q(F,ba),d=q(F+s,ba+o);Z();if(D&&(a[oa]>D.n||a[pa]<D.w||d[oa]<D.s||d[pa]>D.e))i()};this.onZoomEnd=function(a){wa=false;N(a.zoom);if(ta){y=v(ta);Z()}else{K();i()}};this.onZoomStart=function(){wa=true;Z()};this.setOrigin=function(a,d){F=a;ba=d};this.setSize=
function(a,d){s=a;o=d;C=s/2<<0;O=o/2<<0;ha=C;xa=o;la=s/((window.devicePixelRatio||1)*1.5)/Ga(45)<<0;Pa.setSize(s,o);ra=la-50};this.setZoom=N;this.render=K;Ia=n};p.OSMBuildings.VERSION="0.1.8a";p.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
OpenLayers.Layer.Buildings=OpenLayers.Class(OpenLayers.Layer,{CLASS_NAME:"OpenLayers.Layer.Buildings",name:"OSM Buildings",attribution:OSMBuildings.ATTRIBUTION,isBaseLayer:false,alwaysInRange:true,dxSum:0,dySum:0,initialize:function(p){p=p||{};p.projection="EPSG:900913";OpenLayers.Layer.prototype.initialize(this.name,p)},setOrigin:function(){var p=this.map.getLonLatFromPixel(new OpenLayers.Pixel(0,0)),M=this.map.resolution,R=this.maxExtent;this.osmb.setOrigin(Math.round((p.lon-R.left)/M),Math.round((R.top-
p.lat)/M))},setMap:function(p){this.map||OpenLayers.Layer.prototype.setMap(p);if(!this.osmb){this.osmb=new OSMBuildings(this.options.url);this.container=this.osmb.appendTo(this.div)}this.osmb.setSize(this.map.size.w,this.map.size.h);this.osmb.setZoom(this.map.zoom);this.setOrigin();this.osmb.loadData()},removeMap:function(p){this.container.parentNode.removeChild(this.container);OpenLayers.Layer.prototype.removeMap(p)},onMapResize:function(){OpenLayers.Layer.prototype.onMapResize();this.osmb.onResize({width:this.map.size.w,
height:this.map.size.h})},moveTo:function(p,M,R){p=OpenLayers.Layer.prototype.moveTo(p,M,R);if(!R){R=parseInt(this.map.layerContainerDiv.style.left,10);var ya=parseInt(this.map.layerContainerDiv.style.top,10);this.div.style.left=-R+"px";this.div.style.top=-ya+"px"}this.setOrigin();this.dySum=this.dxSum=0;this.osmb.setCamOffset(this.dxSum,this.dySum);M?this.osmb.onZoomEnd({zoom:this.map.zoom}):this.osmb.onMoveEnd();return p},moveByPx:function(p,M){this.dxSum+=p;this.dySum+=M;var R=OpenLayers.Layer.prototype.moveByPx(p,
M);this.osmb.setCamOffset(this.dxSum,this.dySum);this.osmb.render();return R},geoJSON:function(p,M){return this.osmb.geoJSON(p,M)},setStyle:function(p){return this.osmb.setStyle(p)},setDate:function(p){return this.osmb.setDate(p)}});

/**
 * jquery.mangafilter
 *
 * Copyright (c) 2013 nariyu <nariyu@gmail.com>
 * Released under the MIT license
 * http://github.com/nariyu/jquery.mangafilter
 */

(function($) {

  var mangaFilter = function(sourceImage, options) {

  // オプション
  var defaultOptions = {
    'maxWidth': 500,
    'maxHeight': 500,
    'lowLimitter': 80,
    'highLimitter': 110,
    'edgeLimitter': 127
  };

  var tmpOptions = options || {};
  options = {};
  for (var key in defaultOptions)
    options[key] = defaultOptions[key];
  for (var key in tmpOptions)
    options[key] = tmpOptions[key];

  var width = sourceImage.width;
  var height = sourceImage.height;

  // オプション
  var maxWidth = options.maxWidth;
  var maxHeight = options.maxHeight;
  var lowLimitter = options.lowLimitter;
  var highLimitter = options.highLimitter;
  var edgeLimitter = options.edgeLimitter;

  var scale = Math.min(1, maxWidth / width, maxHeight / height);
  var distWidth = Math.floor(width * scale);
  var distHeight = Math.floor(height * scale);

  // canvas を用意
  var canvas = document.createElement('canvas');
  var canvasEdge = document.createElement('canvas');
  var canvasManga = document.createElement('canvas');

  // canvas要素の存在チェックとCanvas未対応ブラウザの対処
  if (!canvas || !canvas.getContext) return false;

  canvas.width = canvasEdge.width = canvasManga.width = distWidth;
  canvas.height = canvasEdge.height = canvasManga.height = distHeight;

  // console.log("size: width=" + width + ", height=" + height + ", distWidth=" + distWidth + ", distHeight=" + distHeight);

  // 2Dコンテキストの取得
  var canvasContext = canvas.getContext('2d');
  var canvasEdgeContext = canvasEdge.getContext('2d');
  var canvasMangaContext = canvasManga.getContext('2d');

  // いったん縮小して描画
  if (window.MegaPixImage) {
    var mpImage = new MegaPixImage(sourceImage);
    mpImage.render(canvas, {maxWidth: distWidth, maxHeight: distHeight});
  } else {
    canvasContext.drawImage(sourceImage, 0, 0, distWidth, distHeight);
  }

  // レイヤー生成
  var sourceImageData  = canvasContext.getImageData(0, 0, distWidth, distHeight);
  var shadowImageData  = canvasContext.createImageData(distWidth, distHeight);
  var grayscaleImageData = canvasContext.createImageData(distWidth, distHeight);
  var edgeImageData    = canvasContext.createImageData(distWidth, distHeight);

  var sourcePixels  = sourceImageData.data;
  var shadowPixels  = shadowImageData.data;
  var grayscalePixels = grayscaleImageData.data;
  var edgePixels    = edgeImageData.data;

  // スミの生成とグレースケール化
  for (var y = 0; y < distHeight; y++) {
    for (var x = 0; x < distWidth; x++) {

      var index = (distWidth * y * 4) + (x * 4);
      if(index < 0 || index + 3 > sourcePixels.length) break;
      var r = sourcePixels[index + 0],
        g = sourcePixels[index + 1],
        b = sourcePixels[index + 2],
        a = sourcePixels[index + 3];


        // スミ生成
      var brightness = (r + g + b) / 3; // 明度
      var gray = 0x0;
      if (brightness < lowLimitter) {
        gray = 0x0;
      } else if (brightness < highLimitter) {
        gray = 0x0;
        a = 0x0; // あとで斜線を入れるために透明にする
      } else {
        gray = 0xFF;
      }
      shadowPixels[index + 0] = gray;
      shadowPixels[index + 1] = gray;
      shadowPixels[index + 2] = gray;
      shadowPixels[index + 3] = a;

      // グレースケール生成
      gray = Math.floor(r * 0.299) + Math.floor(g * 0.587) + Math.floor(b * 0.114);
      grayscalePixels[index + 0] = gray;
      grayscalePixels[index + 1] = gray;
      grayscalePixels[index + 2] = gray;
      grayscalePixels[index + 3] = 0xFF;
    }
  }

  // スミを描画
  canvasContext.putImageData(shadowImageData, 0, 0);


  // エッジ抽出
  var sobelFilter = [
    1, 2, 1,
    0, 0, 0,
    -1, -2, -1
  ];
    var size_f = 3;
  var eInit = Math.floor(size_f / 2);
  var eFrom = - eInit;
  var eTo = eInit;
  for (var i = 0; i < grayscalePixels.length; i++) edgePixels[i] = grayscalePixels[i];
  function getPixel(x, y) { return grayscalePixels[(y * distWidth + x) * 4]; }
  for (var y = 0; y < distHeight; y++) {
    for (var x = 0; x < distWidth; x++) {
    var sum = 0;
    var total = 0;
    for (var n = eFrom; n <= eTo; n++) {
      for (var m = eFrom; m <= eTo; m++) {
      sum += getPixel(x + m, y + n) * sobelFilter[(n + eInit) * size_f + m + eInit];
      }
    }
    var index = (distWidth * y * 4) + (x * 4);
    var absSum = 0xFF - Math.min(0xFF, Math.floor(Math.abs(sum)));
    var alpha = 0xFF;
    if (absSum < edgeLimitter) {
      absSum = 0x0;
    } else {
      absSum = 0xFF;
      alpha = 0x0;
    }
    if(index < 0 || index + 3 > edgePixels.length) break;
    edgePixels[index + 0] = absSum;
    edgePixels[index + 1] = absSum;
    edgePixels[index + 2] = absSum;
    edgePixels[index + 3] = alpha;
    }
  }
  canvasEdgeContext.putImageData(edgeImageData, 0, 0);


  // スクリーントーンの斜線
  var background = new Image();
  background.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHklEQVQIW2NkQAX/GZH4/4FsRpgAmAOSBBFwDkgAAIKuBATRTAAZAAAAAElFTkSuQmCC';
  canvasMangaContext.beginPath();
  canvasMangaContext.fillStyle = '#F5F5F5';
  canvasMangaContext.fillRect(0, 0, distWidth, distHeight);
  var pattern = canvasMangaContext.createPattern(background, '');
  canvasMangaContext.fillStyle = pattern;
  canvasMangaContext.fillRect(0, 0, distWidth, distHeight);


  // レイヤーを結合
  canvasMangaContext.drawImage(canvas, 0, 0);
  canvasMangaContext.drawImage(canvasEdge, 0, 0);

  return canvasManga.toDataURL();
  };

  $.fn.extend({
    mangafilter: function(options) {
      this.each(function() {
        var self = $(this);
        self.hide();
        self.one('load', function() {

          function processImage(url) {
            var sourceImage = new Image();
            sourceImage.onload = function() {
              sourceImage.onload = null;
              var dataURL = mangaFilter(sourceImage, options);
              self.attr('src', dataURL);
              self.show();

              if (options.complete) {
                options.complete();
              }
            };
            sourceImage.src = url;
          }

          var imageURL = self.attr('src');
          if (imageURL.match(/^data:image\//)) {
            processImage(imageURL)
          } else {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', imageURL, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
              var bytes = new Uint8Array(this.response);
              var binaryData = "";
              for (var i = 0, len = bytes.byteLength; i < len; i++) {
                binaryData += String.fromCharCode(bytes[i]);
              }

              var dataURLHeader;
            if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.byteLength-2] === 0xff && bytes[bytes.byteLength-1] === 0xd9) {
              dataURLHeader = "data:image/jpeg;base64,";
            }
            else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
              dataURLHeader = "data:image/png;base64,";
            }
            else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
              dataURLHeader = "data:image/gif;base64,";
            }
            else if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
              dataURLHeader = "data:image/bmp;base64,";
            }
            else {
              dataURLHeader = "data:image/unknown;base64,";
            }

            var dataURL;
            if (window.btoa) {
                dataURL = dataURLHeader + window.btoa(binaryData);
            } else if (window.base64) {
                dataURL = dataURLHeader + base64.encode(binaryData);
            }

            processImage(dataURL);
            };
            xhr.send();
          }
        });
      });
      return this;
    }
  });
})(jQuery);

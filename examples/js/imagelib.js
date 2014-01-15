/**
 * Image library
 *
 * Copyright (c) 2013 Yusuke Narita <nariyu@gmail.com>
 * Released under the MIT license
 */
(function($) {

var root = this;


/*
 * ========================================
 *  ImageFiltering
 * ========================================
 */
/*
 * 画像フィルタリング
 */
function ImageFiltering(image) {
    this.src = image;
}

/**
 * 空間フィルタリング
 * @param[in] filter フィルタ(一次元配列を想定)
 * @param[in] size_f フィルタのサイズ(3 x 3なら3と指定)
 * @return 空間フィルタリングを行った結果
 */
ImageFiltering.prototype.spatialFiltering = function(filter, size_f) {

    switch ( this.src.channels ) {
        case 1: // グレースケール
            return spatialFiltering_Gray(this.src);
            break;

        case 3: // カラー画像
            return spatialFiltering_Color(this.src);
            break;

        case 4: // カラー画像 + αチャンネル
            return spatialFiltering_Color(this.src);
            break;

        default: // その他(カラー画像とみなす)
            return spatialFiltering_Color(this.src);
            break;
    }

    /*
     * 空間フィルタリング(グレースケール)
     */
    function spatialFiltering_Gray(src) {
        var init = Math.floor(size_f / 2);
        var from = - init;
        var to = init;

        var result = src.copy();

        var sum, absSum;
        var total; // 正規化用フィルタ合計値
        var n, m;

        for (var y = 0; y < src.height; y++) {
            for (var x = 0; x < src.width; x++) {
                sum = 0;
                total = 0;

                // 端か?
                if ( x - init < 0 || x + init >= src.width
                        || y - init < 0 || y + init >= src.height ) { // yes

                    /* フィルタリング */
                    for (n = from ; n <= to; n++) {
                        for (m = from; m <= to; m++) {
                            if ( x + m < 0 || x + m >= src.width
                                    || y + n < 0 || y + n >= src.height ) {
                                continue;
                            }

                            total += filter[(n + init) * size_f + m + init];
                            sum += src.getPixel(x + m, y + n) * filter[(n + init) * size_f + m + init];

                        }
                    }

                    if (total > 0) sum /= total;

                } else { // no
                    /* フィルタリング */
                    for (n = from; n <= to; n++) {
                        for (m = from; m <= to; m++) {
                            sum += src.getPixel(x + m, y + n) * filter[(n + init) * size_f + m + init];
                        }
                    }

                }

                absSum = Math.floor(Math.abs(sum));
                if (absSum > 255) absSum = 255;
        absSum = 255 - absSum;
        if ( absSum < 40 ) {
            absSum = 0;
        } else if ( absSum > 200 ) {
            absSum = 255;
        }
                result.setPixel(x, y, absSum);
            }
        }

        return result;

    }

    /*
     * 空間フィルタリング(カラー画像)
     */
    function spatialFiltering_Color(src) {
        var init = Math.floor(size_f / 2);
        var from = - init;
        var to = init;

        var result = src.copy();

        // 畳み込み結果
        var sumR, sumG, sumB;
        var absSumR, absSumG, absSumB;

        var total; // 正規化用フィルタ合計値
        var n, m;
        var pixel;

        for (var y = 0; y < src.height; y++) {
            for (var x = 0; x < src.width; x++) {
                sumR = sumG = sumB = 0.0;
                total = 0.0;

                // 端か?
                if ( x - init < 0 || x + init >= src.width
                        || y - init < 0 || y + init >= src.height ) { // yes

                    /* フィルタリング */
                    for (n = from ; n <= to; n++) {
                        for (m = from; m <= to; m++) {
                            if ( x + m < 0 || x + m >= src.width
                                    || y + n < 0 || y + n >= src.height ) {
                                continue;
                            }

                            total += filter[(n + init) * size_f + m + init];

                            pixel = src.getPixel(x + m, y + n);
                            sumR += pixel.R * filter[(n + init) * size_f + m + init];
                            sumG += pixel.G * filter[(n + init) * size_f + m + init];
                            sumB += pixel.B * filter[(n + init) * size_f + m + init];
                        }
                    }

                    // 正規化
                    if (total > 0) sumR /= total;
                    if (total > 0) sumG /= total;
                    if (total > 0) sumB /= total;

                } else { // no
                    /* フィルタリング */
                    for (n = from; n <= to; n++) {
                        for (m = from; m <= to; m++) {
                            pixel = src.getPixel(x + m, y + n);
                            sumR += pixel.R * filter[(n + init) * size_f + m + init];
                            sumG += pixel.G * filter[(n + init) * size_f + m + init];
                            sumB += pixel.B * filter[(n + init) * size_f + m + init];

                        }
                    }

                }

                absSumR = Math.floor(Math.abs(sumR));
                absSumG = Math.floor(Math.abs(sumG));
                absSumB = Math.floor(Math.abs(sumB));

                if (absSumR > 255) absSumR = 255;
                if (absSumG > 255) absSumG = 255;
                if (absSumB > 255) absSumB = 255;

                result.setPixel(x, y, absSumR, absSumG, absSumB);
            }
        }

        return result;
    }
}


/*
 * ========================================
 *  EdgeDetector
 * ========================================
 */
/*
 * エッジ検出クラス
 */
function EdgeDetector(grayImage) {
    // コンストラクタチェーン
    ImageFiltering.call(this, grayImage);
}

EdgeDetector.prototype = new ImageFiltering();

/**
 * 3x3のプリューウィットフィルタ(横方向)を返す
 * @return プリューウィットフィルタ
 */
EdgeDetector.prototype.createPrewittFilterH = function() {
    /* Sobelフィルタ */
    var filter = new Array(
        -1, 0, 1,
        -1, 0, 1,
        -1, 0, 1
    );
    return filter;
}

/**
 * 3x3のプリューウィットフィルタ(縦方向)を返す
 * @return プリューウィットフィルタ
 */
EdgeDetector.prototype.createPrewittFilterV = function() {
    /* Sobelフィルタ */
    var filter = new Array(
        1, 1, 1,
        0, 0, 0,
        -1, -1, -1
    );
    return filter;
}

/**
 * 3x3のソーベルフィルタ(横方向)を返す
 * @return ソーベルフィルタ
 */
EdgeDetector.prototype.createSobelFilterH = function() {
    /* Sobelフィルタ */
    var filter = new Array(
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1
    );
    return filter;
}

/**
 * 3x3のソーベルフィルタ(縦方向)を返す
 * @return ソーベルフィルタ
 */
EdgeDetector.prototype.createSobelFilterV = function() {
    /* Sobelフィルタ */
    var filter = new Array(
        1, 2, 1,
        0, 0, 0,
        -1, -2, -1
    );
    return filter;
}

/**
 * 3x3のラプラシアンフィルタを返す
 * @return ラプラシアンフィルタ
 */
EdgeDetector.prototype.createLaplacianFilter = function() {
    /* Sobelフィルタ */
    var filter = new Array(
        0, 1, 0,
        1, -4, 1,
        0, 1, 0
    );
    return filter;
}


/*
 *
 */
function MangaFilter() {
}
MangaFilter.apply = function(sourceImage, options) {
    var s = +new Date;

    var mangafilterOptions = $.fn.extend(
        {
            'maxWidth': 1000,
            'maxHeight': 1000,
            'lowLimitter' : 80,
            'highLimitter' : 127,
            'edgeLimitter' : 127
        },
        options
    );

    var width = sourceImage.width;
    var height = sourceImage.height;

    var scale = Math.min(Math.min(1, mangafilterOptions.maxWidth / width), Math.min(1, mangafilterOptions.maxHeight / height));

    var distWidth = Math.floor(width * scale);
    var distHeight = Math.floor(height * scale);

    var canvas = $('<canvas></canvas>').attr({'width': distWidth, 'height': distHeight}).get(0);
    var canvasTemp = $('<canvas></canvas>').attr({'width': distWidth, 'height': distHeight}).get(0);
    var canvasManga = $('<canvas></canvas>').attr({'width': distWidth, 'height': distHeight}).get(0);

    // canvas要素の存在チェックとCanvas未対応ブラウザの対処
    if (!canvas || !canvas.getContext) {
        return false;
    }

    canvas.width = canvasTemp.width = canvasManga.width = distWidth;
    canvas.height = canvasTemp.height = canvasManga.height = distHeight;

    // $('.beforeafter').append(canvasManga);
    // $('.beforeafter').append(canvasTemp);
    // $('.beforeafter').append(canvas);
    // alert("size: width=" + width + ", height=" + height + ", distWidth=" + distWidth + ", distHeight=" + distHeight);

    // 2Dコンテキストの取得
    var canvasContext = canvas.getContext('2d');
    var canvasTempContext = canvasTemp.getContext("2d");
    var canvasMangaContext = canvasManga.getContext('2d');



    //
    // var workCanvas = $('<canvas></canvas>').attr({'width': width, 'height': height}).get(0);
    // workCanvas.width = distWidth;
    // workCanvas.height = distHeight;
    // var workCanvasContext = workCanvas.getContext('2d');
    // workCanvasContext.scale(scale, scale);
    // workCanvasContext.fillStyle = '#DDD';
    // workCanvasContext.fillRect(0, 0, width, height);
    // var step = 200;
    // for (var x = 0; x < width; x += step) {
    //     for (var y = 0; y < height; y += step) {
    //         workCanvasContext.drawImage(sourceImage, x, y, step, step, x, y, step, step);
    //     }
    // }
    // $('.beforeafter').empty().append('<p>OK1 ' + distWidth + ', ' + (+new Date) + '</p>').append(workCanvas); return;

    // var work2Canvas = $('<canvas></canvas>').attr({'width': distWidth, 'height': distHeight}).get(0);
    // workCanvasContext.scale(1, 1)
    // var work2CanvasContext = work2Canvas.getContext('2d');
    // work2CanvasContext.fillStyle = '#F00';
    // work2CanvasContext.fillRect(0, 0, distWidth, distHeight);
    // work2CanvasContext.drawImage(workCanvas, 0, 0, distWidth, distHeight, 0, 0, distWidth, distHeight);
    // $('.beforeafter').empty().append('<p>OK2 ' + (+new Date) + '</p>').append(work2Canvas);
    // return;



    // いったん描画
    var mpImage = new MegaPixImage(sourceImage);
    mpImage.render(canvas, {maxWidth: distWidth, maxHeight: distHeight});
    canvasTempContext.drawImage(canvas, 0, 0);

    // console.log('process 1: ' + ((+new Date) - s) + 'ms');

    // キャンバスからImageDataを取得
    var source = canvasContext.getImageData(0, 0, distWidth, distHeight);

    // グレイスケール変換
    convertGrayscale(source, canvasContext, mangafilterOptions);

    // console.log('process 2: ' + ((+new Date) - s) + 'ms');
    // self.attr('src', canvas.toDataURL()); self.show(); console.log('end: ' + ((+new Date) - s) + 'ms'); return;

    // sobel
    var sampledSourceImage = new Image();
    sampledSourceImage.src = canvasTemp.toDataURL();
    sampledSourceImage.onload = function() {
        sampledSourceImage.onload = function() {};

        var inputImageData = canvasTempContext.getImageData(0, 0, distWidth, distHeight);
        var tempImageData = canvasTempContext.createImageData(distWidth, distHeight);
        var imageData = loadGrayscale(canvasTempContext, sampledSourceImage, inputImageData, tempImageData);
        var edgeDetector = new EdgeDetector(imageData);
        var sobelFilter = edgeDetector.createSobelFilterV();
        var sobelImageData = edgeDetector.spatialFiltering(sobelFilter, 3);
        canvasTempContext.putImageData(sobelImageData.imageData, 0, 0);

        // console.log('process 3: ' + ((+new Date) - s) + 'ms');

        canvasContext2Edge(canvasTempContext, 0, 0, distWidth, distHeight, mangafilterOptions);
        canvasContext.drawImage(canvasTemp, 0, 0);

        var background = new Image();
        background.src = 'data:image/png;base64,'+
                'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHklEQVQIW2NkQAX/GZH4/4FsRpgA'+
                'mAOSBBFwDkgAAIKuBATRTAAZAAAAAElFTkSuQmCC';
        background.onload = function() {
            canvasMangaContext.beginPath();
            canvasMangaContext.fillStyle = '#F5F5F5';
            canvasMangaContext.fillRect(0, 0, distWidth, distHeight);
            var pattern = canvasMangaContext.createPattern(background, '');
            canvasMangaContext.fillStyle = pattern;
            canvasMangaContext.fillRect(0, 0, distWidth, distHeight);
            canvasMangaContext.drawImage(canvas, 0, 0);

            var resultImage = new Image();
            resultImage.src = canvasManga.toDataURL();
            resultImage.onload = function() {
                resultImage.onload = function() {};
                // console.log('end: ' + ((+new Date) - s) + 'ms');

                if (mangafilterOptions.callback) {
                    mangafilterOptions.callback(resultImage);
                }
            };
        };
    };
}

/**
 * sourceの画像をグレースケール加工します。
 * @param source 入力画像
 */
function convertGrayscale(source, canvasContext, mangafilterOptions) {
    // データを入れる空のImageDataを作成
    var resultImageData = canvasContext.createImageData(source.width, source.height);
    
    // フィルタ処理
    for (var y = 0; y < source.height; y++) {
        for (var x = 0; x < source.width; x++) {
            var pixels = source.data;
            var index = (source.width * y * 4) + (x * 4);
            if(index < 0 || index + 3 > pixels.length) return undefined;
            var rgb = { R:pixels[index + 0], G:pixels[index + 1], B:pixels[index + 2], A:pixels[index + 3] };

            var alpha = rgb.A;
            var gray = ( rgb.R + rgb.G + rgb.B ) / 3;
            if ( gray < mangafilterOptions.lowLimitter ) {
                gray = 0;
            } else if ( gray < mangafilterOptions.highLimitter ) {
                gray = mangafilterOptions.highLimitter;
                alpha = 0;
            } else {
                gray = 255;
            }
            var r = gray;
            var g = gray;
            var b = gray;

            var pixels = resultImageData.data;
            var index = (resultImageData.width * y * 4) + (x * 4);
            if(index < 0 || index + 3 > pixels.length) return false;
            pixels[index + 0] = r;
            pixels[index + 1] = g;
            pixels[index + 2] = b;
            pixels[index + 3] = alpha;
        }
    }
    canvasContext.putImageData(resultImageData, 0, 0);
};

/**
 * 画像をグレースケール化して取得する
 */
function loadGrayscale(context, image, input, temp) {
    // 編集用の画像を作成
    var iplResult = new IplImage(context, image, temp, 1);

    var width = image.width;
    var height = image.height;

    for(var y = 0; y < height; y++){
        for(var x = 0; x < width; x++){
            var R = input.data[(y * width + x) * 4];
            var G = input.data[(y * width + x) * 4 + 1];
            var B = input.data[(y * width + x) * 4 + 2];
            var A = input.data[(y * width + x) * 4 + 3];

            R = Math.floor(R * 0.299);
            G = Math.floor(G * 0.587);
            B = Math.floor(B * 0.114);

            iplResult.data[(y * width + x) * 4] = R + G + B;
            iplResult.data[(y * width + x) * 4 + 1] = R + G + B;
            iplResult.data[(y * width + x) * 4 + 2] = R + G + B;
            iplResult.data[(y * width + x) * 4 + 3] = A;
        }
    }
    return iplResult;
}

function canvasContext2Edge(canvasContext, x, y, width, height, mangafilterOptions) {
    var source = canvasContext.getImageData(x, y, width, height);
    for ( var y = 0; y < source.height; y++ ) {
        for ( var x = 0; x < source.width; x++ ) {
            var pixels = source.data;
            var index = (source.width * y * 4) + (x * 4);
            if(index < 0 || index + 3 > pixels.length) return undefined;
            var rgb = { R:pixels[index + 0], G:pixels[index + 1], B:pixels[index + 2], A:pixels[index + 3] };
            var alpha = rgb.A;
            var gray = ( rgb.R + rgb.G + rgb.B ) / 3;
            if ( gray < mangafilterOptions.edgeLimitter ) {
                gray = 0;
            } else {
                gray = 255;
                alpha = 0;
            }

            if(index < 0 || index + 3 > pixels.length) return false;
            pixels[index + 0] = gray;
            pixels[index + 1] = gray;
            pixels[index + 2] = gray;
            pixels[index + 3] = alpha;
        }
    }
    canvasContext.putImageData(source, 0, 0);
}


/*
 * ========================================
 *  IplImage
 * ========================================
 */
/*
 * コンストラクタ
 */
function IplImage(_context, _image, _imageData, _channels) {
    this.width = _image.width;
    this.height = _image.height;
    this.imageLength = _image.width * _image.height;
    this.channels = _channels;

    this.context = _context;
    this.image = _image;
    this.imageData = _imageData;
    this.data = _imageData.data;
    this.length = _imageData.data.length;
}

/*
 * 初期化
 */
IplImage.prototype.initialize = function(val) {
    for (var i = 0; i < this.length; i += 4) {
        this.data[i] = val;
        this.data[i + 1] = val;
        this.data[i + 2] = val;
    }
}

/*
 * 輝度値を取得する
 */
IplImage.prototype.getPixel = function(x, y) {
    var pixelArray = new Array(this.channels);

    for ( i = 0; i < this.channels; i++ ) {
        pixelArray[i] = this.data[(y * this.width + x) * 4 + i];
    }

    switch ( this.channels ) {
        case 1: //グレースケール
            return pixelArray[0];
            break;

        case 3: //カラー画像
            return {R:pixelArray[0], G:pixelArray[1], B:pixelArray[2]};
            break;

        case 4: //カラー画像 + αチャンネル
            return {R:pixelArray[0], G:pixelArray[1], B:pixelArray[2], A:pixelArray[3]};
            break;

        default:
            return 0;
            break;
    }
}

/*
 * 輝度値を取得する
 */
IplImage.prototype.getArrayPixel = function(index) {
    var pixelArray = new Array(this.channels);
    var newIndex = Math.floor(index * this.channels);

    for ( i = 0; i < this.channels; i++ ) {
        pixelArray[i] = this.data[newIndex + i];
    }

    switch ( this.channels ) {
        case 1: //グレースケール
            return pixelArray[0];
            break;

        case 3: //カラー画像
            return {R:pixelArray[0], G:pixelArray[1], B:pixelArray[2]};
            break;

        case 4: //カラー画像 + αチャンネル
            return {R:pixelArray[0], G:pixelArray[1], B:pixelArray[2], A:pixelArray[3]};
            break;

        default:
            return 0;
            break;
    }
}

/*
 * 輝度値を設定する
 */
IplImage.prototype.setPixel = function() {
    if ( arguments.length <= 2 ) {
        return;
    }

    var x = arguments[0];
    var y = arguments[1];

    switch ( this.channels ) {
        case 1:
            this.data[(y * this.width + x) * 4] = arguments[2];
            this.data[(y * this.width + x) * 4 + 1] = arguments[2];
            this.data[(y * this.width + x) * 4 + 2] = arguments[2];
            break;

        case 3:
            this.data[(y * this.width + x) * 4] = arguments[2];
            this.data[(y * this.width + x) * 4 + 1] = arguments[3];
            this.data[(y * this.width + x) * 4 + 2] = arguments[4];
            break;

        case 4:
            this.data[(y * this.width + x) * 4] = arguments[2];
            this.data[(y * this.width + x) * 4 + 1] = arguments[3];
            this.data[(y * this.width + x) * 4 + 2] = arguments[4];
            this.data[(y * this.width + x) * 4 + 3] = arguments[5];
            break;
    }

}

/*
 * 輝度値を設定する
 */
IplImage.prototype.setArrayPixel = function() {
    if (arguments.length <= 1) {
        return;
    }

    var index = arguments[0] * 4;

    switch (this.channels) {
        case 1:
            this.data[i] = arguments[1];
            this.data[i + 1] = arguments[1];
            this.data[i + 2] = arguments[1];
            break;

        case 3:
            this.data[i] = arguments[1];
            this.data[i + 1] = arguments[2];
            this.data[i + 2] = arguments[3];
            break;

        case 4:
            this.data[i] = arguments[1];
            this.data[i + 1] = arguments[2];
            this.data[i + 2] = arguments[3];
            this.data[i + 3] = arguments[4];
            break;
    }

}

/*
 * コピー
 */
IplImage.prototype.copy = function() {

    var temp = this.context.createImageData(this.width, this.height);

    // 編集用の画像を作成
    var dst = new IplImage(this.context, this.image, temp, this.channels);

    for ( var i = 0; i < this.length; i++ ) {
        dst.data[i] = this.data[i];
    }

    return dst;

}



/*
 * ========================================
 *  EXPORT
 * ========================================
 */
 if (typeof exports !== 'undefined') {
    exports.ImageFiltering = ImageFiltering;
    exports.EdgeDetector = EdgeDetector;
    exports.IplImage = IplImage;
    exports.MangaFilter = MangaFilter;
 } else {
    root.ImageFiltering = ImageFiltering;
    root.EdgeDetector = EdgeDetector;
    root.IplImage = IplImage;
    root.MangaFilter = MangaFilter;
 }



}).call(this, jQuery);

var async = require('async');
var Promise = require('es6-promise').Promise;

/**
 * An image comparator class
 */
function ImageComparator() {
	this._canvas;
	this._canvasContext;
	this.images;
	this.queue;
	this.threshold;

	this.init();
}

ImageComparator.prototype.init = function(threshold) {
	var instance = this;

	instance._canvas = document.createElement('canvas');
	instance._canvasContext = instance._canvas.getContext('2d');
	instance.images = [];
	instance.threshold = threshold || 0.95;

	instance.queue = async.queue(
		function(task, callback) {
			instance.isDuplicate(task.src, task.dir).then(
				function resolved() {
					callback();
				},
				function rejected(error) {
					console.log(error);
					callback();
				}
			);
		},
		1
	);
};

/**
 * Adds image to the list
 */
ImageComparator.prototype.addImage = function(image) {
	var filename = decodeURIComponent(image.src).replace(/^.*(\\|\/|\:)/, '');

	this.images.push(image);
	console.log('[ImageComparator_' + this.name + '] ' + 'ADD IMAGE ' + filename);
};

/**
 * Checks if the specified image is a duplicate. If duplicate, move it to
 * junkFolder. Otherwise, add it to the library and store the pixel data.
 *
 * @imgSrc: image path
 * @junkFolder: path to the folder to store duplicate files
 */
ImageComparator.prototype.isDuplicate = function(imgSrc, junkFolder) {
	var instance = this,
		test = 'test',
		image = new Image();

	return new Promise(function(resolve, reject) {
		if (!fs.isFile(imgSrc)) {
			reject(Error(imgSrc + ' is not a valid image file path'));
		}

		image.onload = function() {
			var found = false,
				i = 0,
				data = instance._loadImageData(image),
				data2;

			while (!found && i < instance.images.length) {
				if (image.height == instance.images[i].height && image.width == instance.images[i].width) {
					data2 = instance._loadImageData(instance.images[i]);
					found = instance._compare(data, data2);
				}

				i++;
			}

			if (found) {
				instance._moveImage(imgSrc, junkFolder);
			}
			else {
				instance.addImage(image);
			}

			resolve();
		};

		image.onerror = function() {
			reject(Error('Image Load Error'));
		};

		image.src = 'file:/' + encodeURIComponent(imgSrc);
	});
};

/**
 * Adds a new task to the queue. Tasks is queued until the previous execution
 * has completed.
 */
ImageComparator.prototype.processImage = function(imgSrc, junkFolder) {
	this.queue.push(
		{
			src: imgSrc,
			dir: junkFolder
		}
	);
};

/**
 * Compares two images. Returns true if two images are similar within threshold
 */
ImageComparator.prototype._compare = function(data1, data2) {
	var diffCount = 0,
		ts = Math.round(data1.length * (1 - this.threshold) * 0.25);

	for (var i = 0; i < data1.length; i += 4) {
		// each pixel has a RGBA value. Skip the alpha(opacity) bit for comparison.
		if (data1[i] !== data2[i] || data1[i+1] !== data2[i+1] || data1[i+2] !== data2[i+2]) {
			diffCount++;

			if (diffCount >= ts) {
				return false;
			}
		}
	}

	return true;
};

/**
 * Returns the pixel data of the given image
 */
ImageComparator.prototype._loadImageData = function(image) {
	var instance = this;

	instance._canvas.width = image.width;
	instance._canvas.height = image.height;

	instance._canvasContext.drawImage(image, 0, 0);

	return instance._canvasContext.getImageData(0, 0, image.width, image.height).data;
};

/**
 * Moves given image to the specified path
 */
ImageComparator.prototype._moveImage = function(img, path) {
	var filename = img.replace(/^.*(\\|\/|\:)/, '');

	if (!fs.isDirectory(path)) {
		fs.makeDirectory(path);
	}

	try {
		fs.move(img, path + '/' + filename);
	}
	catch(error) {
		fs.remove(img);
	}

	console.log('[ImageComparator_' + this.name + '] ' + 'MOVE IMAGE ' + filename + ' to ./junk');
};

module.exports.ImageComparator = ImageComparator;
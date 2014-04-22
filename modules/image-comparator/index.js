/**
 * An image comparator class
 */
function ImageComparator() {
	this._canvas;
	this._canvasContext;
	this.images;
	this.threshold;
}

ImageComparator.prototype.init = function(threshold) {
	var instance = this;

	return new Promise(function(resolve, reject) {
		instance._canvas = document.createElement('canvas');
		instance._canvasContext = instance._canvas.getContext('2d');
		instance.images = [];
		instance.threshold = threshold || 0.9;

		resolve();
	});
};

/**
 * Adds image data to the list
 */
ImageComparator.prototype.addImageData = function(data) {
	this.images.push(data);
};

/**
 * Checks if the specified image is a duplicate. If dulicate, move it to
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
		image.onload = function() {
			var found = false,
				i = 0,
				data = instance._loadImageData(image);

			while (!found && i < instance.images.length) {
				found = instance._compare(data, instance.images[i]);
				i++;
			}

			if (found) {
				instance._moveImage(imgSrc, junkFolder);
			}
			else {
				instance.addImageData(data);
			}

			resolve();
		};

		image.onerror = function() {
			reject(Error('Image Load Error'));
		};

		image.src = imgSrc;
	});
};

/**
 * Compares two images. Returns true if two images are similar within threshold
 */
ImageComparator.prototype._compare = function(data1, data2) {
	if (data1.length != data2.length) {
		return false;
	}

	var diffCount = 0,
		ts = Math.round(data1.length * (1 - this.threshold) * 0.25);

	for (var i = 0; i < data1.length; i += 4) {
		// each pixel has a RGBA value. Skip the 4th bit for comparison.
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
};

module.exports.ImageComparator = ImageComparator;
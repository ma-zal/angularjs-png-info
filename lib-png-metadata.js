'use strict';

angular.module('pngMedatada', []);


/**
 * Methods can get metadata from PNG images.
 * 
 * @ngdoc service
 * @name pngMedatada.service:pngMedatada
 */
angular.module('pngMedatada').factory('pngMedatada', function($q) {

    return {
        getContentFromFile: getContentFromFile,
        getPngMetadata: getPngMetadata,
        extractChunks: extractChunks,
        isInCgBIformat: isInCgBIformat
    };


    /**
     * Get metadata of PNG image
     *
     * Code is edited version of http://jsbin.com/saxudoro/1
     * @see https://social.msdn.microsoft.com/Forums/en-US/bb30d088-d21f-4a9c-bf84-79c58f042a10/access-image-metadata-description?forum=iewebdevelopment
     * @see http://www.w3.org/TR/PNG-Chunks.html
     *
     * @param {Uint8Array} bytes
     * @returns {PngMetadata}
     */
	function getPngMetadata(bytes) {
		var PNG_CONST = {
			PNG_HEADER: ['89', '50', '4e', '47', 'd', 'a', '1a', 'a']
		};

        var chunkLength = '';
        var chunkType = '';
        var chunkData = [];

        for (var i = 0; i < 8; i++) {
            if (bytes[i].toString(16) !== PNG_CONST.PNG_HEADER[i]) {
                throw new Error('Invalid PNG file.');
            }
        }
        for (i = 8; i < 12; i++) {
            chunkLength += bytes[i];
        }
        chunkLength = parseInt(chunkLength);
        if (chunkLength === 13) {
            var pngMedatada = {
                width: '',
                height: ''
            };
            for (i = 12; i < 16; i++) {
                chunkType += String.fromCharCode(bytes[i]);
            }
            for (i = 16; i < 16 + chunkLength; i++) {
                chunkData.push(bytes[i].toString(16));
            }
            for (i = 0; i < 4; i++) {
                pngMedatada.width += fillZero(chunkData[i]);
            }
            for (i = 4; i < 8; i++) {
                pngMedatada.height += fillZero(chunkData[i]);
            }
            var colorTypes = {
                3: 'pallete',
                2: '24bit',
                6: '32bit'
            };
            pngMedatada.width = parseInt(pngMedatada.width, 16);
            pngMedatada.height = parseInt(pngMedatada.height, 16);
            pngMedatada.colorType = colorTypes[parseInt(chunkData[9])];
            switch (pngMedatada.colorType) {
                case 'pallete': pngMedatada.bitDepth = parseInt(chunkData[8]); break;
                case '24bit': pngMedatada.bitDepth = 24; break;
                case '32bit': pngMedatada.bitDepth = 32; break;
                default: pngMedatada.bitDepth = undefined;
            }
            pngMedatada.compressionMethod = parseInt(chunkData[10]);
            pngMedatada.filterMethod = parseInt(chunkData[11]);
            pngMedatada.interlaceMethod = parseInt(chunkData[12]);
            return pngMedatada;
        } else {
            throw new Error('Unknown chunk type.');
        }
	}


    /**
     * Library for getingt list of chunks of PNG image file
     * Based on {@link https://github.com/hughsk/png-chunks-extract/blob/master/index.js}
     *
     * @returns {Promise.<Uint8Array>}
     */
    function getContentFromFile(file) {
        var deferred = $q.defer();

        var fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function () {
            deferred.resolve(new Uint8Array(fileReader.result));
        };
        fileReader.onerror = function (error) {
            throw new Error(error);
        };

        return deferred.promise;
    }



    /**
     * @param {Uint8Array} bytes
     * @returns {{name:string, data}[]}
     */
    function extractChunks(bytes) {
        var uint8 = new Uint8Array(4);
        var uint32 = new Uint32Array(uint8.buffer);

        if (bytes[0] !== 0x89) throw new Error('Invalid .png file header');
        if (bytes[1] !== 0x50) throw new Error('Invalid .png file header');
        if (bytes[2] !== 0x4E) throw new Error('Invalid .png file header');
        if (bytes[3] !== 0x47) throw new Error('Invalid .png file header');
        if (bytes[4] !== 0x0D) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');
        if (bytes[5] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');
        if (bytes[6] !== 0x1A) throw new Error('Invalid .png file header');
        if (bytes[7] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');

        var ended = false;
        var chunks = [];
        var idx = 8;

        while (idx < bytes.length) {
            // Read the length of the current chunk,
            // which is stored as a Uint32.
            uint8[3] = bytes[idx++];
            uint8[2] = bytes[idx++];
            uint8[1] = bytes[idx++];
            uint8[0] = bytes[idx++];

            // Chunk includes name/type for CRC check (see below).
            var length = uint32[0] + 4;
            var chunk = new Uint8Array(length);
            chunk[0] = bytes[idx++];
            chunk[1] = bytes[idx++];
            chunk[2] = bytes[idx++];
            chunk[3] = bytes[idx++];

            // Get the name in ASCII for identification.
            var name = (
                String.fromCharCode(chunk[0]) +
                String.fromCharCode(chunk[1]) +
                String.fromCharCode(chunk[2]) +
                String.fromCharCode(chunk[3])
            );

            // The IHDR header MUST come first.
            if (!chunks.length && name !== 'IHDR') {
                throw new Error('IHDR header missing');
            }

            // The IEND header marks the end of the file,
            // so on discovering it break out of the loop.
            if (name === 'IEND') {
                ended = true;
                chunks.push({
                    name: name,
                    data: new Uint8Array(0)
                });

                break;
            }

            // Read the contents of the chunk out of the main buffer.
            for (var i = 4; i < length; i++) {
                chunk[i] = bytes[idx++];
            }

            // Read out the CRC value for comparison.
            // It's stored as an Int32.
            uint8[3] = bytes[idx++];
            uint8[2] = bytes[idx++];
            uint8[1] = bytes[idx++];
            uint8[0] = bytes[idx++];

            // The chunk data is now copied to remove the 4 preceding
            // bytes used for the chunk name/type.
            var chunkData = new Uint8Array(chunk.buffer.slice(4));

            chunks.push({
                name: name,
                data: chunkData
            })
        }

        if (!ended) {
            throw new Error('.png file ended prematurely: no IEND header was found');
        }

        return chunks;
    }


    /**
     * Checks, if PNG file is in CgBI file format.
     *
     * Its extra header, the Apple's proprietary extension to the PNG image format.
     * These modifications cause the generated images to be invalid as per the current version of the PNG standard.
     *
     * @see {@link http://iphonedevwiki.net/index.php/CgBI_file_format}
     *
     * @param {Uint8Array} bytes
     * @returns {boolean}
     */
    function isInCgBIformat(bytes) {
        var chunks = extractChunks(bytes);
        return chunks.some(function(/*{name:string,data}*/ chunk) {
            return chunk.name === 'CgBI';
        });
    }


    function fillZero(string) {
   		return string.length === 1 ? '0' + string : string;
   	}

});


/**
 * @typedef {Object} PngMetadata
 * @global
 * @property {number} width
 * @property {number} height
 * @property {string} colorType - 'pallete' | '24bit' | '32bit'
 * @property {number} bitDepth
 * @property {number} compressionMethod
 * @property {number} filterMethod
 * @property {number} interlaceMethod
 */

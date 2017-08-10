Javascript PNG Medadata Library
===============================

**This library parses the content of PNG file added by `<input type="file">`
and returns metadata of this file.** All on client side (in browser by Javascript).
 
Note: See [Stack Owerflow: ng-model for input type=“file”](https://stackoverflow.com/questions/17063000/ng-model-for-input-type-file)
to bind a `file` object.

Usage
-----

Load module `pngMetadata` in AngularJS. Now you can inject `pngMetadata` service in your AngularJS controllers.


### Snippet from usage in controller

```javascript

// Do not forget to inject `pngMetadata` service in controller function.

// Gets file object from input somehow (depends on your app).
var files = ... ;

// Get PNG medatada of `files`.
files.map(function(file) {
    pngMetadata.getContentFromFile(e.file).then(function(bytes) {
        
        // Get file size, color depth, ...
        var fileInfo = pngMetadata.getPngMetadata(bytes);
        console.info("PNG details:", fileInfo);
        
        // Checks for CgBI Apple proprietary format
        var isInCgBIformat = pngMetadata.isInCgBIformat(bytes);
        if (isInCgBIformat) {
            console.warn('PNG image is in CgBI Apple proprietary format. Web browsers do not support this file type.');
        } else {
            console.warn('PNG image has common format, which is supported by web browsers.');
        }
    });
});
```


Usage in pure Javascript
------------------------

Except usage the `$q` promises, all other code is pure Javascript. So you can easily remove the AngularJS and use it in
pure JS application.

Licence MIT
===========

**Copyright (c) 2017 Martin Zaloudek**

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

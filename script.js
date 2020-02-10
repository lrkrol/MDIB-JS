/*

Multi-Dimensional Image Browser JS
v1.1.0


MIT License

Copyright (c) 2019 Laurens R Krol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/


var numimages = 0;           // total number of images selected by user
var numimagesloaded = 0;     // number of images loaded (for progress bar)
var numimagesparsed = 0;     // number of images parsed (using pattern)
var imgdata = {};            // data of loaded image files
var pattern = '';            // image filename pattern
var ndims = 0;               // number of dimensions in image filenames
var dimvalues = [];          // values of the dimensions
var ndimvalues = [];         // number of values per dimension
var currentpos = [];         // current image position
var currenttab = '';         // currently active tab
var savedpositions = [];     // container for saved positions

var $ = function(id) { return document.getElementById(id); };


function switchTab(tab) {

    // switching off everything
    $('configcontainer').style.display = 'none';
    $('browsercontainer').style.display = 'none';

    $('configtab').className = 'tab';
    $('browsertab').className = 'tab';

    // switching the requested tab back on
    $(tab + 'container').style.display = 'block';
    $(tab + 'tab').className = 'tab active';

    currenttab = tab;

}


function processFiles(event) {

    if (window.File && window.FileList && window.FileReader) {
        // resetting variables
        numimages = event.target.files.length;
        numimagesloaded = 0;
        imgdata = {};
        $('progress').style.width = '0%';

        log('Got ' + event.target.files.length + ' files.');

        function loadImage(file) {
            if (!file.type.match('image/jpeg|image/png|image/gif|image/bmp')) {
                numimages--;
            } else {
                // discarding extension
                let filename = file.name;
                if (filename.lastIndexOf('.') >= 1) {
                    filename = filename.substr(0, filename.lastIndexOf('.'));
                }

                // reading image data
                let reader = new FileReader();
                reader.onload = function(event){
                    imgdata[filename] = event.target.result;
                    advanceProgress();
                };

                reader.readAsDataURL(file);
            }
        }

        [].forEach.call(event.target.files, loadImage);

        log('Kept ' + numimages + ' compatible images.');

        if (numimages == 0) {
            // turns out none of the selected files were images
            $('progress').style.width = '0%';
        }
    } else {
        alert('Your browser does not support the file API.');
    }

}


function advanceProgress() {

    // updating progress bar
    numimagesloaded++;
    $('progress').style.width = 100 / numimages * numimagesloaded + '%';

    // removing progress bar when finished
    if (numimagesloaded == numimages) {
        window.setTimeout(function() {
            $('progress').style.width = '0%';
        }, 1000);
    }

}


function applyPattern() {

    pattern = $('patterninput').value;

    // getting number of dimensions, initialising values array
    ndims = (pattern.match(/\*/g) || []).length;
    dimvalues = [...Array(ndims)].map(x=>[]);
    ndimvalues = [];

    // getting dimension values
    numimagesparsed = 0;
    regexpattern = pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
    regexpattern = regexpattern.replace(/\*/g, '(.*)');
    Object.keys(imgdata).forEach(function(filename) {
        regex = new RegExp(regexpattern);
        let result = filename.match(regex);
        try {
            for (let d = 1; d < result.length; d++) {
                dimvalues[d-1].push(result[d]);
            }
            numimagesparsed++;
        } catch (err) {
            log('Pattern error for file ' + filename);
        }
    });

    // keeping only unique values, sorted
    for (let d = 0; d < ndims; d++) {
        if (isNumeric(dimvalues[d][0])) {
            dimvalues[d] = dimvalues[d].filter((v, i, a) => a.indexOf(v) === i).sort(sortNumeric);
        } else {
            dimvalues[d] = dimvalues[d].filter((v, i, a) => a.indexOf(v) === i).sort();
        }
        ndimvalues.push(dimvalues[d].length);
    }

    if (numimagesparsed > 0) {
        log('Parsed ' + numimagesparsed + ' images in ' + ndims + ' (' + ndimvalues.join('x') + ') dimensions.');

        renderBrowser();

        // removing instructions
        $('image').innerHTML = '';
        $('image').style.backgroundColor = 'initial';

        // setting initial position
        log('Showing first image and switching to browser.');
        currentpos = file2pos(Object.keys(imgdata)[0]);
        changeDim(0, 0);
        switchTab('browser');
    } else {
        log('No images parsed. None selected?');
    }

}

function isNumeric(n) {
    
    return !isNaN(parseFloat(n)) && isFinite(n);
    
}

function sortNumeric(a, b) {
    
    return a - b;
    
}


function pos2file(pos) {

    // getting the filename belonging to a given coordinate
    parts = pattern.split('*');
    file = parts[0];
    for (i = 0; i < ndims; i++) {
        file = file + dimvalues[i][pos[i]];
        file = file + parts[i+1];
    }

    // returning filename, or -1 if that file does not exist
    if (Object.keys(imgdata).indexOf(file) > -1) {
        return file;
    } else {
        return -1;
    }

}


function file2pos(file) {

    // getting the coordinate belonging to a given filename
    let pos = [...Array(ndims)].map(x=>0);
    regexpattern = pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
    regexpattern = regexpattern.replace(/\*/g, '(.*)');
    regex = new RegExp(regexpattern);

    let result = file.match(regex);
    for (let d = 1; d < result.length; d++) {
        pos[d-1] = dimvalues[d-1].indexOf(result[d]);
    }

    return pos
}


function renderBrowser() {

    // rendering the browser panel
    let browserhtml = 'Current position: <div id="currentinfo"><span>(<span id="currentpos"></span>) = <span id="currentfile"></span></span></div>';
    browserhtml += '<div id="generalinfo">from ' + numimagesparsed + ' images in ' + ndims + ' (' + ndimvalues.join('x') + ') dimensions.</div>'
    browserhtml += '<p></p>Dimensions:';

    let dimshortcutorder = 'qwertyuiop';
    for (i = 0; i < ndims; i++) {
        browserhtml += '<div class="dimbrowser">';
        browserhtml += '<span class="button" onclick="changeDim(' + i + ', -1);"><span class="shortcut">' + dimshortcutorder[i] + '</span> &ndash;</span>';
        browserhtml += '<span id="dimvalue' + i + '" class="dimvalue"></span>';
        browserhtml += '<span class="button" onclick="changeDim(' + i + ', 1);">+ <span class="shortcut">' + (i+1) + '</span></span>'
        browserhtml += '</div>';
    }

    browserhtml += '<p>Zoom: <span class="button" onclick="$(\'image\').style.backgroundSize = \'auto\';">original</span> <span class="button" onclick="$(\'image\').style.backgroundSize = \'contain\';">contain</span> <span class="button" onclick="$(\'image\').style.backgroundSize = \'cover\';">cover</span></p>';
    
    browserhtml += '<div id="savedpositions"></div>';

    $('browsercontainer').innerHTML = browserhtml;

    // filling in current values
    updateBrowser();
}


function updateBrowser() {

    // updating browser panel with current values
    $('currentpos').innerHTML = currentpos;
    $('currentfile').innerHTML = pos2file(currentpos);

    for (i = 0; i < ndims; i++) {
        $('dimvalue' + i).innerHTML = dimvalues[i][currentpos[i]]
    }
    
    if (savedpositions.length > 0) {
        let savedposhtml = 'Saved postions:';
        let savedposorder = 'sdfghjklxcvbnm';
        for (let s = 0; s < savedpositions.length; s++) {
            if (typeof savedpositions[s] !== 'undefined') {
                savedposhtml += '<div class="savedposition"><span class="button" onclick="gotoSavedPosition(' + s + ');"><span class="shortcut">' + savedposorder[s] + '</span> &rarr;</span> <span class="savedposfile">' + pos2file(savedpositions[s]) + '</span></div>';
            }
        }
        $('savedpositions').innerHTML = savedposhtml;
    }

}


function changeDim(dim, change) {

    // walking along the requested dimension if possible
    if (dim >= 0 && dim < ndims) {
        if (currentpos[dim] + change < 0 || currentpos[dim] + change >= ndimvalues[dim]) {
            log('Reached dimension ' + (dim+1) + ' boundary.');
        } else {
            currentpos[dim] = currentpos[dim] + change;

            if (pos2file(currentpos) != -1) {
                // file exists at this coordinate: showing image
                $('image').style.backgroundImage = 'url(' + imgdata[file] + ')';
                updateBrowser();
            } else {
                log('(' + currentpos + ') ' + file + ' does not exist.');
                currentpos[dim] -= change;
            }
        }
    } else {
        log('There is no dimension ' + dim + '.');
    }

}


function savePosition(s) {
    
    // saving current position
    savedpositions[s] = [...currentpos];
    updateBrowser();
    
}


function gotoSavedPosition(s) {
    
    // moving to saved position
    if (typeof savedpositions[s] !== 'undefined') {
        currentpos = [...savedpositions[s]];
        if (pos2file(currentpos) != -1) {
            $('image').style.backgroundImage = 'url(' + imgdata[file] + ')';
            updateBrowser(); 
        }
    }    
}


function log(msg) {

    $('log').innerHTML = $('log').innerHTML + msg + '<br />';
    $('log').scrollTop = $('log').scrollHeight;

}


document.addEventListener("DOMContentLoaded", function() {
    // processing files when user has selected them
    $('fileinput').addEventListener('change', processFiles, false);
});

document.onkeydown = function(e){
    // binding shortcut keys
    if (currenttab == 'browser') {
        switch (e.keyCode) {
            
            // dimension shortcuts //
            
            case 37: // arrow left
                changeDim(0, -1);
                break;
            case 39: // arrow right
                changeDim(0, 1);
                break;
            case 38: // arrow up
                changeDim(1, 1);
                break;
            case 40: // arrow down
                changeDim(1, -1);
                break;
            case 49: // 1
                changeDim(0, 1);
                break;
            case 50: // 2
                changeDim(1, 1);
                break;
            case 51: // 3
                changeDim(2, 1);
                break;
            case 52: // 4
                changeDim(3, 1);
                break;
            case 53: // 5
                changeDim(4, 1);
                break;
            case 54: // 6
                changeDim(5, 1);
                break;
            case 55: // 7
                changeDim(6, 1);
                break;
            case 56: // 8
                changeDim(7, 1);
                break;
            case 57: // 9
                changeDim(8, 1);
                break;
            case 48: // 0
                changeDim(9, 1);
                break;
            case 81: // q
                changeDim(0, -1);
                break;
            case 65: // a -- AZERTY keyboards
                changeDim(0, -1);
                break;
            case 87: // w
                changeDim(1, -1);
                break;
            case 69: // e
                changeDim(2, -1);
                break;
            case 82: // r
                changeDim(3, -1);
                break;
            case 84: // t
                changeDim(4, -1);
                break;
            case 89: // y
                changeDim(5, -1);
                break;
            case 90: // z -- QWERTZ keyboards
                changeDim(5, -1);
                break;
            case 85: // u
                changeDim(6, -1);
                break;
            case 73: // i
                changeDim(7, -1);
                break;
            case 79: // o
                changeDim(8, -1);
                break;
            case 80: // p
                changeDim(9, -1);
                break;
                
            // position shortcuts //
                
            case 83: // s
                if (event.shiftKey) { savePosition(0); }
                else { gotoSavedPosition(0); }
                break;
            case 68: // d
                if (event.shiftKey) { savePosition(1); }
                else { gotoSavedPosition(1); }
                break;
            case 70: // f
                if (event.shiftKey) { savePosition(2); }
                else { gotoSavedPosition(2); }
                break;
            case 71: // g
                if (event.shiftKey) { savePosition(3); }
                else { gotoSavedPosition(3); }
                break;
            case 72: // h
                if (event.shiftKey) { savePosition(4); }
                else { gotoSavedPosition(4); }
                break;
            case 74: // j
                if (event.shiftKey) { savePosition(5); }
                else { gotoSavedPosition(5); }
                break;
            case 75: // k
                if (event.shiftKey) { savePosition(6); }
                else { gotoSavedPosition(6); }
                break;
            case 76: // l
                if (event.shiftKey) { savePosition(7); }
                else { gotoSavedPosition(7); }
                break;
            case 88: // x
                if (event.shiftKey) { savePosition(8); }
                else { gotoSavedPosition(8); }
                break;
            case 67: // c
                if (event.shiftKey) { savePosition(9); }
                else { gotoSavedPosition(9); }
                break;
            case 86: // v
                if (event.shiftKey) { savePosition(10); }
                else { gotoSavedPosition(10); }
                break;
            case 66: // b
                if (event.shiftKey) { savePosition(11); }
                else { gotoSavedPosition(11); }
                break;
            case 78: // n
                if (event.shiftKey) { savePosition(12); }
                else { gotoSavedPosition(12); }
                break;
            case 77: // m
                if (event.shiftKey) { savePosition(13); }
                else { gotoSavedPosition(13); }
                break;
        }
    }
};


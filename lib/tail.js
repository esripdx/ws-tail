/**
From https://github.com/mthenw/frontail/blob/master/lib/tail.js

The MIT License (MIT)

Copyright (c) 2013 Maciej Winnicki

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict';

var EventEmitter = require('events').EventEmitter;
var spawn        = require('child_process').spawn;
var util         = require('util');

var Tail = function (path, options) {
    EventEmitter.call(this);

    this.buffer = [];
    this.options = options || {buffer: 0};

    var self = this;
    var tail = spawn('tail', ['-F'].concat(path));
    tail.stdout.on('data', function (data) {

        var lines = data.toString('utf-8');
        lines = lines.split('\n');
        lines.pop();
        lines.forEach(function (line) {
            if (self.options.buffer) {
                if (self.buffer.length === self.options.buffer) {
                    self.buffer.shift();
                }
                self.buffer.push(line);
            }
            self.emit('line', line);
        });
    });

    process.on('exit', function () {
        tail.kill();
    });
};
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
    return this.buffer;
};

module.exports = function (path, options) {
    return new Tail(path, options);
};

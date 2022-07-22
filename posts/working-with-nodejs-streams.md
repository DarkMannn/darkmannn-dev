---
title: Working With Node.js Streams
description: An article that tries to summarize all of the stream API's and explain how to use them.
info: This article was first published on https://medium.com/florence-development/working-with-node-js-stream-api-60c12437a1be. It was moved here when I started the 'Balanced Coder' blog.
thumbnail: assets/images/stream.jpg
date: 19/11/2019
tags:
  - node.js
keywords: Node.js, Streams, Backpressure, Readable, Writable, Transform, Streaming, Tutorial
published: true
---

## Introduction

The word `Stream` is used in computer science to describe chunked data collection, which is not available
all at once but across time. A stream is basically a collection of values, similar to an array, but
inverted from a spatial to a temporal axis.

In Node.js, `Stream` is name of a module that implements an API for working with streaming data.

The Node.js stream API has evolved significantly since it was first introduced in 2009. The constantly
evolving API creates confusion around the various ways to implement and availability to mix different
interfaces.
We are going to focus on the latest `Stream 3` implementation, along with new useful APIs that
come along with Node v10+.

## Stream Basics

All streams are instances of EventEmitter — which means that they emit events that can be used to
read and write data.

### Stream types

There are four fundamental stream types within Node.js.

Readable:

- abstraction for a source which can be read and consumed
- examples: HTTP responses on the client, HTTP requests on the server, fs read streams, process.stdin etc.

Writable:

- abstraction for a destination to which data can be written
- examples: HTTP responses on the server, HTTP requests on the client, fs write streams, process.stout, process.stderr etc.

Duplex:

- streams that implement both a readable and a writable interface
  example: TCP socket (net.Socket)

Transform:

- streams similar to Duplex streams, with the ability to modify or transform data as it is read and written
- example: compress stream (zlib.createGzip)

### Stream modes

There are two modes that Node.js stream operate in:

- Standard mode:
  - this mode is set by default
  - operating on `STRING` and `BUFFER` (or `UInt8Array`) types
  - only type used in Node’s internal stream implementations
- Object mode:
  - set by `objectMode` flag while creating a Stream
  - internal buffering algorithm counts objects rather than bytes

### Buffering

Every stream has an internal buffer that will be used for storing data. Readable and writable streams
have one each, and it can be retrieved using `readable.readableBuffer` and `writable.writableBuffer`.

Duplex and Transform streams have two separate buffers, allowing each side to operate independently.

Size of the buffer is set by `highWatermarkOption`. For streams operating in standard mode, it specifies
buffer size and for streams in object mode, it specifies number of objects.

### Backpressure

Backpressure is a concept that is difficult to grasp for people who start working with the Stream API, which
makes it a common source of bugs. Without backpressure, streams would not be as efficient as it is one of the
most important properties of streams.

Backpressure is the signal that a writable stream sends back to a readable stream. The signal is sent when
the readable stream is reading data too fast, and the writable stream’s internal buffer (which is set by
`highWatermarkOption`) gets filled faster than it can be processed.

The signal alerts the readable stream to pause before sending more data. Backpressure is allowing reliable,
pull-based transfer of data between readable and writable streams.

A few things may happen if a backpressure system isn’t taken into consideration while transferring data:

- system’s memory gets used up
- current processes are slowed down
- garbage collector gets overworked

Backpressure handles reliable, lossless and memory efficient transfer of data, which is the primary purpose
of Node.js Stream API.

## API for Stream Consumers

Many Node.js applications use streams. Having familiarity with the API for Stream Consumers allows you to use
and consume streams properly.

### Consuming Writable Streams

Every writable stream instance has these methods:

- `writable.write(chunk[, encoding][, callback])`
  - Writes some data to the stream
  - Returns `false` if internal buffer has been filled, otherwise `true`
- `writable.end([chunk][, encoding][, callback])`
  - Signals that no more data will be written to the writable. An optional final chunk of data can be written before closing
- `writable.cork()`
  - Forces all written data to be buffered in memory
- `writable.uncork()`
  - Flushes all data buffered since `stream.cork()` was called
- `writable.destroy()`
  - Destroys the stream

The next snippet of code represents a simple use of a writable stream instance, without handling
backpressure, which is most likely NOT what you want to do:

```js
const myFile = fs.createWriteStream('./file.txt');
myFile.write('Title\n');
myFile.write('Some very important stuff...\n');
myFile.end('Final sentence.');
```

These are events that can be emitted by a writable instance:

- `drain`
  - After `writable.write()` returns `false` because of the backpressure and that pressure has been relieved, this event will be emmitted when it is appropriate to resume writing data to the stream
- `error`
  - Emitted if an error occurred while writing or piping data (stream is not closed when this event is emitted)
- `finish`
  - Emitted after the `writable.end()` method has been called, and all data has been flushed
- `close`
  - Emitted when the stream and any of its underlying resources have been closed
- `pipe`
  - Emitted when the `.pipe()` method is called on a readable stream
- `unpipe`
  - Emitted when the `.unpipe()` method is called on a readable stream

A simple example to appropriately write to a writable stream manually (without `readable.pipe()` ), and
taking backpressure into consideration is:

```js
const Path = require('path');
const Fs = require('fs');

const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);
const drainProcess = () => new Promise((res) => myWritable.once('drain', res));

(async function safeWrite(dataArray) {
  for (let i = 0; i <= 1e3; i++) {
    const shouldContinue = myWritable.write('Very large text.');
    if (!shouldContinue) {
      await drainProcess();
    }
  }
  myWritable.end('Last sentence.');
})();
```

This is a simple example, since it only writes the same sentence in a loop. The most important aspect is
managing backpressure.

Backpressure, among other things, is conveniently handled by the `readable.pipe()` method, which looks
something like this:

```js
const Path = require('path');
const Fs = require('fs');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);

myReadable.pipe(myWritable);
```

We will go into more detail on the `readable.pipe()` method further in the article.

In addition to focusing on backpressure when creating manual writes to a writable stream instance, listening
for errors while you write is also important.

Here is a complete example for manually writing to a writable stream, taking into consideration backpressure,
proper error handling and post write operations (logging in this case):

```js
const Path = require('path');
const Fs = require('fs');

const drainProcess = (writable) =>
  new Promise((res) => writable.once('drain', res));
const errorDetectionProcess = (writable) =>
  new Promise((res, rej) => {
    writable.on('error', rej);
    writable.on('end', res);
  });
const writeProcess = async (writable) => {
  for (let i = 0; i <= 1e3; i++) {
    const shouldContinue = writable.write('Very large text.');
    if (!shouldContinue) {
      await drainProcess(writable);
    }
  }
  writable.end('Last sentence.');
};

(async function safeWrite() {
  try {
    const myWritable = Fs.createWriteStream(
      Path.join(__dirname, './destination.txt')
    ).once('finish', () => console.log('Writing finished'));

    await Promise.all([
      errorDetectionProcess(myWritable),
      writeProcess(myWritable),
    ]);
  } catch (err) {
    myWritable.end();
    console.log(`Writing to a writable failed with error: ${err}`);
  }
})();
```

### Consuming Readable Streams

Readable streams can operate in two modes:

- flowing — data is read from the underlying system automatically and provided to an application as quickly as possible
- paused — the `readable.read()` method must be called explicitly to read chunks of data

(Object mode is also mentioned in the docs, but it is a separate feature, both flowing and paused readable
streams can be in object mode or not)

All readable streams start in paused mode. To switch from paused to flowing mode you must do one of the
following, which will be covered extensively in the next section:

- Add a `data` event listener
- Call the `readable.resume()` method
- Attach a readable to a writable with `readable.pipe()`

To switch back to paused mode you must do one of the following:

- if there are no `pipe()` destinations, call `readable.pause()`
- if there are `pipe()` destinations, remove all of them (`readable.unpipe()` can help with that)

There are four ways of consuming readable streams. Developers should choose one of the methods of consuming
data. Mixing API’s can lead to unexpected behavior and should never be done while consuming data from a
single stream.

1. Using `readable.pause()`, `readable.resume()` and `data` event:
   - `data` event
     - emitted whenever the stream is passing chunk of data (automatically switches stream to flowing mode when listener attached)
   - `readable.pause()`
     - pauses stream, switching it to paused mode
   - `readable.resume()`
     - switches stream to flowing mode

An example of a readable stream that is consumed and data is written to stdout. Nothing very useful but it
will serve well as a demonstration:

```js
const Path = require('path');
const Fs = require('fs');

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const myReadable = Fs.createReadStream(
  Path.join(__dirname, './readable.txt')
).setEncoding('utf8');

myReadable.on('data', async (chunk) => {
  console.log(chunk);

  // Throttle the stream with 1s interval
  myReadable.pause();
  await timer(1000);

  // Now data will start flowing again
  myReadable.resume();
});
```

2. Using `readable.read()` and `readable` event:
   - `readable` event
     - fired when there is some underlying data to be read (attaching a listener to `readable` switches stream to paused mode)
   - `readable.read([size])`
     - pulls some data out of the internal buffer and returns it. Returns `null` if there is no data left to read. By default, data will be returned as `Buffer` if no encoding is specified.

This is a similar example to the one above, but uses the second way of consuming a readable stream:

```js
const Path = require('path');
const Fs = require('fs');

const myReadable = Fs.createReadStream(
  Path.join(__dirname, './readable.txt')
).setEncoding('utf8');

myReadable.on('readable', function readAvailableData() {
  let data;
  (function readChunk() {
    data = myReadable.read();
    if (data) {
      console.log(data);
      readChunk();
    }
  })();
});
```

3. Using `readable.pipe()`:
   - `readable.pipe(writable[, options])` - attaches a writable stream to a readable stream switching it to flowing mode and causing readable to pass all its data to the attached writable stream. Flow of data (i.e. backpressure) will be automatically handled.

This is the most convenient for consuming a readable stream, since it is not verbose, and backpressure and
closing the streams is automatically handled when finished.

A simple example copied from one of previous code snippets:

```js
const Path = require('path');
const Fs = require('fs');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);

myReadable.pipe(myWritable);
```

One thing that is not automatically managed is error handling and propagation. For example, if we want to
close each stream when an error occurs, we have to attach error event listeners.

An example of a complete version of consuming readable streams with pipe with proper error handling:

```js
const Path = require('path');
const Fs = require('fs');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);

const handleError = () => {
  console.log('Error occurred while piping. Closing all streams.');
  myReadable.destroy();
  myWritable.end();
};

myReadable.on('error', handleError).pipe(myWritable).on('error', handleError);
```

4. Using Async Iteration / Async Generators:
   - readable streams implement the [Symbol.asyncIterator] method, so they can be iterated over with `for await of`

Async Generators are officially available in Node v10+. The async generators are a mix of async functions and
generator functions. They implement [Symbol.asyncIterator] method, and can be used for async iteration.
Generally streams are a chunked collection of data across time, therefore Async Generators fit perfectly.
Here’s an example:

```js
const Path = require('path');
const Fs = require('fs');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));

(async function printToStdout(inputFilePath) {
  try {
    for await (const chunk of myReadable) {
      console.log(chunk.toString());
    }
    console.log('Done');
  } catch (err) {
    console.log('Error:' + err);
  }
})();
```

### Consuming Duplex and Transform Streams

Duplex streams implement both the readable and writable interface. One kind of duplex stream is a
`PassThrough` stream. This type of stream is used when some API expects readable stream as a parameter, and
you also want to manually write some data.

To accomplish both needs:

- Create an instance of a `PassThrough` stream
- Send the stream to the API (the API will use the readable interface of the stream)
- Add some data to the stream (using the writable interface of the stream)

This process is shown below:

```js
const { PassThrough } = require('stream');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({ apiVersion: 'latest' });

// we create one instance of PassThrough stream
// which is effectively a Duplex stream
const uploadStream = new PassThrough();

// we pass the created stream to aws-sdk S3.upload()
// 'Body' param needs to be readable stream according to aws-sdk docs
// the stream is going to be consumed by the sdk
S3.upload({
  Bucket: 'some bucket name',
  Key: 'some key',
  ACL: 'private',
  Body: bufferStream,
});

// now we manually write some data
uploadStream.write('This will get uploaded to a bucket.');
uploadStream.write('This too!');
uploadStream.end('But this is more than enough. Let us finish!');
```

Transform streams are Duplex streams. These streams have both readable and writable interface but their main
purpose is to transform passing data.

The most common example is compressing data with built-in transform stream from `zlib` module:

```js
const Fs = require('fs');
const Path = require('path');
const Zlib = require('zlib');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.gz')
);
const compressStream = Zlib.createGzip();

myReadable.pipe(compressStream).pipe(myWritable);
```

### Useful class methods (Node v10+)

- `Stream.finished(stream, callback)`
  - allows you to get notified when a stream is no longer readable, writable or has experienced an error or a premature close.

This method is useful for error handling or performing further actions after the stream is consumed.
An example:

```js
const Fs = require('fs');
const Path = require('path');
const { finished } = require('stream');
const { promisify } = require('util');

const finishedAsync = promisify(finished);

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);

(async function run() {
  try {
    myReadable.pipe(myWritable);

    await finishedAsync(myReadable);
    console.log('Readable has been consumed');
  } catch (err) {
    console.error(err);
  }
})();
```

- `Stream.pipeline(…streams[, callback])`
  - method to pipe between streams forwarding errors and properly cleaning up and provide a callback when the pipeline is complete.

This method is the cleanest and least verbose way of building stream pipelines. In contrast to
`readable.pipe()`, everything is handled automatically, including error propagation and cleaning up of
resources after the process has ended. An example:

```js
const Fs = require('fs');
const Path = require('path');
const Zlib = require('zlib');
const Crypto = require('crypto');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(Path.join(__dirname, './destination'));
const compressStream = Zlib.createGzip();
const encryptionStream = Crypto.createCipheriv(
  'aes192',
  'valid-secret',
  'valid-iv'
);

(async function run() {
  try {
    await pipelineAsync(
      myReadable,
      compressStream,
      encryptionStream,
      myWritable
    );

    console.log('Pipeline succeeded.');
  } catch (err) {
    console.log(`Pipeline crashed with error: ${err}`);
  }
})();
```

---

## API for Stream Implementers

Stream API is extendable and provides an interface for developers to create their own stream extensions.
There are two ways to implement your own stream.

1. Extend the appropriate parent class:

```js
const { Writable } = require('stream');

class myWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }

  _write(chunk, encoding, callback) {
    // ...
  }
}
```

The new stream class must implement one or more specific methods, depending on the type of stream being
created (they will be listed as we go through an implementation of each type of stream).

Those methods are prefixed with an underscore, and they are only meant for use while implementing new
streams. If they are invoked while consuming they will cause unexpected behavior.

2. Extending streams in a simplified way by directly create instances and providing appropriate methods as constructor options:

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
});
```

A good thing to remember is that in this case, the required methods are not prefixed with underscore.

### Implementing Writable Streams

In order for us to implement a writable stream, we need to provide a `writable._write()` method to send data
to the underlying resource:

- `writable._write(chunk, encoding, callback)`
  - chunk — chunk to be written
  - encoding — needed if chunk is of type `String`
  - callback — must be called to signal that the write either completed or failed

One simple writable stream implementation:

```js
const { Writable } = require('stream');

const outStream = new Writable({
  write(chunk, encoding, callback) {
    const string = chunk.toString();

    if (string.includes('/')) {
      callback(Error('Forbidden character'));
    } else {
      console.log(string);
      callback();
    }
  },
});

process.stdin.pipe(outStream).on('error', console.log);
```

This stream is piping standard input to standard output, except when you enter forward dash, then the stream
throws. This example servers the purpose of demonstration.

### Implementing a Readable Stream

To implement a custom readable stream, we must call the readable constructor and implement the
`readable._read()` method (other methods are optional), and inside of it we must call `readable.push()`:

- `readable._read(size)`
  - when this method is called, if data is available from the source, the implementation should begin pushing that data into the read queue using the `this.push(dataChunk)` method
  - size — number of bytes to be read asynchronously
- `readable.push()`
  - method intended to be called only by readable implementers, and only from within the `readable._read()` method. When called the chunk of data will be added to the internal queue for users of the stream to consume (`null` is a terminating character).

This implementation of a readable stream below will generate random integers from 1 to 10 every second for a minute, then the stream will finish generating data and close itself.

```js
const { Readable } = require('stream');

class RandomNumberStream extends Readable {
  constructor(options) {
    super(options);

    this.isTimeToEndIt = false;
    setTimeout(() => {
      this.isTimeToEndIt = true;
    }, 1000 * 60);
  }

  _read() {
    setTimeout(() => {
      if (this.isTimeToEndIt) {
        this.push(null);
        return;
      }

      const randomNumberString = String(Math.floor(Math.random() * 10 + 1));
      this.push(`${randomNumberString}\n`);
    }, 1000);
  }
}

const randomNumbers = new RandomNumberStream();
randomNumbers.pipe(process.stdout);
```

### Implementing a Duplex Stream

A duplex stream implements both the readable and writable interfaces independent from one another. The duplex
class prototypically inherits from stream.Readable and parasitically from stream.Writable (JavaScript does
not have support for multiple inheritance).

To create a custom implementation of a duplex stream you have to implement every required method for writable
and readable streams, which are `readable._read()` and `writable._write()`.

This stream below logs everything from stdin (writable side), and pipes random smileys to stdout (readable
side) until sad smiley comes up, then we terminate the readable stream.

```js
const { Duplex } = require('stream');

const inOutStream = new Duplex({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  },

  read(size) {
    const smileys = [':)', ':P', ':D', 'xD', '^_^', ':('];
    const randomSmiley = smileys[Math.floor(Math.random() * smileys.length)];
    const isSadSmiley = randomSmiley === ':(';

    if (isSadSmiley) {
      this.push(null);
      return;
    }
    this.push(randomSmiley.toString());
  },
});

process.stdin.pipe(inOutStream).pipe(process.stdout);
```

### Implementing a Transform Stream

A transform stream is similar to a duplex stream (it is a type of duplex stream), but with a simpler
interface. The output is computed from the input. There is no requirement that the output is the same size as
the input, the same number of chunks, or arrive at the same time.

Only one method is required for implementing transform stream, and that is `transform._transform()` method
(`transform._flush()` is optional).

- `transform._transform(chunk, encoding, callback)`
  - handles the bytes being written, computes the output, then passes that output off to the readable portion using the `readable.push()` method. May be called multiple times to generate output for one received chunk, or not generate output at all:
  - chunk — piece of data to be written
  - encoding — needed for chunks of type `String`
  - callback(err, transformedChunk)
- `transform._flush(callback)` — optional.
  - In some cases, a transform operation may need to emit an additional bit of data at the end of the stream, when some computation has been completed. Before the stream ends this method flushes the data.

```js
const Path = require('path');
const Fs = require('fs');
const { Transform } = require('stream');

const myReadable = Fs.createReadStream(Path.join(__dirname, './source.txt'));
const myWritable = Fs.createWriteStream(
  Path.join(__dirname, './destination.txt')
);

let size = 0;
const fileSizeStream = new Transform({
  transform: (data, encoding, callback) => {
    size += data.length;
    callback(null, data);
  },
  flush: (callback) => {
    callback();
  },
});

myReadable
  .pipe(fileSizeStream)
  .pipe(myWritable)
  .on('finish', () => {
    console.log(`Document size: ${size}`);
  });
```

---

## Summary

In this article we learned how to consume all of the Node.js Stream types. We also learned how to implement
our own streams, and use their powerful features.

Node.js Streams have a reputation for being hard to work with, but with an understanding of their distinct
APIs they become invaluable tool.

---
title: Testing Node.js Serverless Applications - AWS Lambda Functions
description: Elaborating on how to properly test your code in a serverless environment.
info: This article was first published on https://blog.logrocket.com/testing-node-serverless-applications-aws-lambda-functions. It was moved here when I started the 'Balanced Coder' blog.
thumbnail: assets/images/serverless-testing.jpg
date: '2020-01-28'
tags:
  - serverless
  - node.js
keywords: Node.js, Serverless, Testing, Microservices, Tutorial
published: true
---

We are all aware of the importance of tests when trying to write maintainable and high quality code. It’s never easy to implement them, but it must be done nevertheless. With the rise of serverless architecture new challenges arrive. We now have functions that run in an environment we don’t have control of. There are ways to simulate that cloud environment, but is that reliable enough?

In this article I’m going to show you several ways to make testing serverless applications a little bit easier and manageable. I’m going to focus on AWS, as it is one of the most popular cloud providers at this moment, and I’m going to write the code in Node.js since it is one of the most commonly used languages for serverless apps. Having said that, everything I mention here can be applied to other cloud providers and other programming languages as well.

## Let’s dive into the problem

As we all know, there are, generally speaking, three types of tests:

- **unit** - testing single, isolated pieces of logic
- **integration** - testing contracts between two or more units
- **end-to-end** - complete test, covering everything

They differ in terms of how easy or hard it is to write them, how much resources do they require (time and/or money) and how much confidence they provide in reducing possible bugs in our code. Unit tests being the cheapest but providing the smallest amount of confidence, and end-to-end being the most expensive ones but also giving a great amount of confidence.

In theory, you should have lots and lots of unit tests, several integration ones and a few end-to-end tests. At least that’s the accepted opinion for standard applications. For serverless apps though, duo to the execution environment not being in our control, there’s a tendency that people like to write more end-to-end tests than usual. There are extreme cases when some write only end-to-end tests, without the unit tests and the integration ones.

I think that with the right code structure and design, we can achieve solid code quality and confidence and still maintain proper test type proportion.
I’m going to show you how, and I’ll do that with a small but handy Lambda function example.
\*\*
**Let’s get into the code!** 🤗

Imagine we have an assignment to implement Lambda function that has to:

- receive certain parameters, let it be from an SQS queue (Amazon’s simple queue service)
- according to those parameters fetch an image from an S3 bucket (Amazon’s file storage service)
- reduce the size of the image and change it to a different format if desired
- upload new resulting image to the same S3 bucket

This is a fairly common use case for a Lambda function. I know this article is about writing good tests, but as I mentioned earlier, in order to write good tests you have to first write testable code/functions. That’s why I’m going to show you both the implementation and tests.

The trick when writing serverless functions is to detect all the places where the function communicates with the rest of the world and abstract that away so that with can test those occurrences in isolation with some cheap unit tests. We’ll call those abstractions adapters.

Let’s see what adapters are we going to need in our case:

- the function receives data/event in form of a function parameter - let’s call it the `EventParser`
- the function needs to fetch and upload files to S3 - let’s call that adapter `FileService`

Adapters are, in a way, for I/O. Now other than receiving/sending data from/to the outer world, we have some logic to implement in our function. The core logic (reducing and reformatting of images) is going to be inside `image-reducer.js` .

Adapters and `image-reducer.js` are logically isolated and suitable for unit tests. When we’re done with that we’ll need to connect them according to our business needs. We are going to that inside `main.js` file. This file is suitable for integration testing, which we’ll see a little bit later. Here’s how the folder structure would look:

```bash
    image-reducer-service/
      adapters/          - abstractions for sockets/file system etc.
        event-parser.js
        file-service.js
      utils/             - regular utils functions based on our needs
      tests/             - all of the tests
      image-reducer.js   - core lambda logic
      main.js            - connects adapters and core logic, good for integration test
      index.js           - entry file for serverless app
      serverless.yml
      package.json
```

The `main.js` file will export a wrapper function that will receive, by dependency injection, every adapter and core-logic function needed. This way integration test are easy to implement. Here’s how that looks at the beginning:

```js
// main.js
exports.imageReducerService = async (event, FileService, ImageReducer) => {
  const executionId = generateRandomId();
  try {
    console.log(`Started imageReducerService id: ${executionId}`);
    /*----------------
            Connect everything here
            -----------------*/
    console.log(`Finished imageReducerService id: ${executionId}`);
  } catch (error) {
    console.error(`Thrown imageReducerService id: ${executionId}`);
    throw error;
  }
};
```

This main function will be required in the `index.js` file, which contains the actual Lambda function that will be run on AWS and injects everything into our main function:

```js
// index.js
const { EventParser, FileService } = require('./adapters');
const ImageReducer = require('./image-reducer.js');
const ImageReducerService = require('./main.js');

exports.handler = (sqsMessage) =>
  ImageReducerService(EventParser.parse(sqsMessage), FileService, ImageReducer);
```

## Implementing smaller pieces of code and unit tests

Let’s write code and tests for the first adapter `EventParser`. The purpose of this adapter is to receive an event and to sanitize it so that our main function always gets a standard set of properties. This can be particularly interesting on AWS, because Lambda functions can be connected to lots of sources (SQS, SNS, S3 etc.), and every source has its own event schema. So `EventParser` can be used to process every one of these and output a standardized event. For now we only receive events via SQS queue, so this is how it would look:

```js
// adapters/event-parser.js
const Joi = require('@hapi/joi');

const eventSchema = Joi.object({
  bucket: Joi.string().required(),
  key: Joi.string().required(),
  format: Joi.string().valid('png', 'webp', 'jpeg').default('png'),
});
const extractEvent = (sqsMessage) => sqsMessage.Records[0].body;

exports.parse = (sqsMessage) => {
  const eventObject = extractEvent(sqsMessage);
  const { value: payload, error } = eventSchema.validate(eventObject);
  if (error) {
    throw Error(`Payload error => ${error}.`);
  }
  return payload;
};
```

This function just extracts nested event from the SQS payload, and ensures that the required event has every required property via `Joi` validation library. Since for the SQS, payload (or at least the outer structure) is always the same - unit tests are more than enough to ensure everything here works properly. In this article, I will write tests using the `Jest` library. Here are the tests for the `EventParser`:

```js
const EventParser = require('../../adapters/event-parser.js');
const createStubbedSqsMessage = (payload) => ({ Records: [{ body: payload }] });

describe('EventParser.parse() ', () => {
  test('returns parsed params if event has required params', async () => {
    const payload = {
      bucket: 'bucket',
      key: 'key',
      format: 'jpeg',
    };
    const stubbedSqsMessage = createStubbedSqsMessage(payload);
    const result = EventParser.parse(stubbedSqsMessage);
    expect(result).toBeDefined();
    expect(result.bucket).toBe(payload.bucket);
    expect(result.key).toBe(payload.key);
    expect(result.format).toBe(payload.format);
  });
  test('throws when event object has missing required params', async () => {
    const payload = {
      bucket: 'bucket',
    };
    const stubbedSqsMessage = createStubbedSqsMessage(payload);
    expect(() => EventParser.parse(stubbedSqsMessage)).toThrow();
  });
  test('throws when event has required params with incorrect type', async () => {
    const payload = {
      bucket: ['bucket'],
      key: 'key',
    };
    const stubbedSqsMessage = createStubbedSqsMessage(payload);
    expect(() => EventParser.parse(stubbedSqsMessage)).toThrow();
  });
});
```

The second adapter, `FileService`, should have the functionality to fetch an image and to upload an image. We are going to implement that with streams, using Amazon’s sdk:

```js
// adapters/file-service.js
const Assert = require('assert');
const { Writable } = require('stream');
const Aws = require('aws-sdk');

exports.S3 = new Aws.S3();
exports.fetchFileAsReadable = (bucket, key) => {
  Assert(bucket && key, '"bucket" and "key" parameters must be defined');
  return exports.S3.getObject({
    Bucket: bucket,
    Key: key,
  }).createReadStream();
};
exports.uploadFileAsWritable = (bucket, key, writable) => {
  Assert(bucket && key, '"bucket" and "key" parameters must be defined');
  Assert(
    writable instanceof Writable,
    '"writable" must be an instance of stream.Writable class'
  );
  return exports.S3.upload({
    Bucket: bucket,
    Key: key,
    Body: writable,
    ACL: 'private',
  }).promise();
};
```

There aren’t any benefits in testing the `Aws.S3` lib, since it is well meintained. Only thing that can go wrong there is if Lambda doesn’t have internet access, which will be covered in the end-to-end test. Things that we can potentially test here are detection of invalid parameters and/or proper passing of function parameters to the sdk. Since the functions are very small in this case, I’m going to only test the first case. Here it is:

```js
const FileService = require('../../adapters/file-service.js');

describe('FileService', () => {
  describe('fetchFileAsReadable()', () => {
    test('throws if parameters is are undefined', async () => {
      expect(() => FileService.fetchFileAsReadable()).toThrow(
        '"bucket" and "key" parameters must be defined'
      );
    });
  });
  describe('uploadFileAsWritable()', () => {
    it('throws if last argument is not a writable stream', async () => {
      expect(() =>
        FileService.uploadFileAsWritable('bucket', 'key', {})
      ).toThrow('"writable" must be an instance of stream.Writable class');
    });
  });
});
```

Next thing to implement and test is the core Lambda logic, i.e reducing and reformatting of images. We’re going to keep it short and simple, using `Sharp` library for Node.js:

```js
// image-reducer.js
const Sharp = require('sharp');
const WIDTH = 320;
const HEIGHT = 240;

exports.createTransformable = (
  format = 'png',
  width = WIDTH,
  height = HEIGHT
) =>
  format === 'jpeg'
    ? Sharp().resize(width, height).jpeg()
    : format === 'webp'
    ? Sharp().resize(width, height).webp()
    : Sharp().resize(width, height).png();
```

This functions takes certain parameters, and creates a transform stream that can receive readable stream of image binary data and transform it into smaller image with a different format. Using a little bit of Node’s stream magic, we can test all of this pretty easily, by creating readable and writable stream stubs:

```js
const Path = require('path');
const Fs = require('fs');
const Sharp = require('sharp');
const ImageReducer = require('../image-reducer.js');

const BIG_IMAGE_PATH = Path.join(__dirname, '/big-lambda.png');
const SMALL_IMAGE_PATH_PNG = Path.join(__dirname, '/small-lambda.png');
const SMALL_IMAGE_PATH_WEBP = Path.join(__dirname, '/small-lambda.webp');
const SMALL_IMAGE_PATH_JPEF = Path.join(__dirname, '/small-lambda.jpeg');

describe('ImageReducer.createTransformable()', () => {
  describe('reducing size and transforming image in .png format', () => {
    test('reducing image', async () => {
      const readable = Fs.createReadStream(BIG_IMAGE_PATH);
      const imageReductionTransformable = ImageReducer.createTransformable();
      const writable = Fs.createWriteStream(SMALL_IMAGE_PATH_PNG);

      readable.pipe(imageReductionTransformable).pipe(writable);
      await new Promise((resolve) => writable.on('finish', resolve));

      const newImageMetadata = await Sharp(SMALL_IMAGE_PATH_PNG).metadata();
      expect(newImageMetadata.format).toBe('png');
      expect(newImageMetadata.width).toBe(320);
      expect(newImageMetadata.height).toBe(240);
    });
  });
  describe('reducing size and transforming image in .webp format', () => {
    test('reducing image', async () => {
      const readable = Fs.createReadStream(BIG_IMAGE_PATH);
      const imageReductionTransformable = ImageReducer.createTransformable(
        'webp',
        200,
        100
      );
      const writable = Fs.createWriteStream(SMALL_IMAGE_PATH_WEBP);

      readable.pipe(imageReductionTransformable).pipe(writable);
      await new Promise((resolve) => writable.on('finish', resolve));

      const newImageMetadata = await Sharp(SMALL_IMAGE_PATH_WEBP).metadata();
      expect(newImageMetadata.format).toBe('webp');
      expect(newImageMetadata.width).toBe(200);
      expect(newImageMetadata.height).toBe(100);
    });
  });
  describe('reducing size and transforming image in .jpeg format', () => {
    test('reducing image', async () => {
      const readable = Fs.createReadStream(BIG_IMAGE_PATH);
      const imageReductionTransformable = ImageReducer.createTransformable(
        'jpeg',
        200,
        200
      );
      const writable = Fs.createWriteStream(SMALL_IMAGE_PATH_JPEF);

      readable.pipe(imageReductionTransformable).pipe(writable);
      await new Promise((resolve) => writable.on('finish', resolve));

      const newImageMetadata = await Sharp(SMALL_IMAGE_PATH_JPEF).metadata();
      expect(newImageMetadata.format).toBe('jpeg');
      expect(newImageMetadata.width).toBe(200);
      expect(newImageMetadata.height).toBe(200);
    });
  });
});
```

## Connecting everything and writing integration tests

The purpose of integration tests is to test contracts/integration between two or more code components that are already well tested with unit tests. Since we didn’t integrate all of the above written code, we will do that now:

```js
// main.js
const { promisify } = require('util');
const { PassThrough, pipeline } = require('stream');
const { generateRandomId, appendSuffix } = require('./utils');
const pipelineAsync = promisify(pipeline);

exports.imageReducerService = async (event, FileService, ImageReducer) => {
  const executionId = generateRandomId();
  try {
    console.log(`Started imageReducerService id: ${executionId}`);

    const { bucket, key, format } = event;
    const readable = FileService.fetchFileAsReadable(bucket, key);
    const imageReductionTransformable =
      ImageReducer.createTransformable(format);
    const writable = new PassThrough();

    const newKey = appendSuffix(key, format);
    const pipelineProcess = pipelineAsync(
      readable,
      imageReductionTransformable,
      writable
    );
    const uploadProcess = FileService.uploadFileAsWritable(
      bucket,
      newKey,
      writable
    );
    await Promise.all([pipelineProcess, uploadProcess]);

    console.log(`Finished imageReducerService id: ${executionId}`);
  } catch (error) {
    console.error(`Thrown imageReducerService id: ${executionId}`);
    throw error;
  }
};
```

This code takes the parsed event, after it has been sanitized by our `EventParser`, based on it it fetches an image from the S3 in form of a readable stream on line 13, creates image reduction transform stream on line 14, and creates a writable stream on line 15. Pipe chain is then created between the readable, transform and writable stream on line 18. Next the writable stream begins uploading on the S3 bucket on line 23. In other words, all this code does is fetching, resizing and uploading of images in a stream form.

Since this example Lambda function we are writing is not so big, all of the wiring was done in a single file, and we can cover it with a single test. In other situations splitting it into several tests might be a good idea. Here’s our test:

```js
require('dotenv').config();
const { EventParser, FileService, ImageReducer } = require('../adapters');
const { imageReducerService } = require('../main.js');
const { appendSuffix } = require('../utils');
const createFakeSqsMessage = (payload) => ({ Records: [{ body: payload }] });

describe('ImageReducerService', () => {
  test('integration', async () => {
    const realBucket = process.env.BUCKET;
    const existingFileKey = process.env.KEY;
    const sqsMessage = createFakeSqsMessage({
      bucket: realBucket,
      key: existingFileKey,
    });
    await imageReducerService(
      EventParser.parse(sqsMessage),
      FileService,
      ImageReducer
    );
    // check if the new reduced image exists on the S3 bucket
    const reducedImageMetadata = await FileService.S3.headObject({
      bucket: realBucket,
      key: appendSuffix(existingFileKey, 'png'),
    }).promise();
    expect(reducedImageMetadata).toBeDefined();
  });
});
```

This test here is actually targeting a real S3 bucket, using environment variables. There are upsides and downsides to this approach. Upside is that it is more realistic, almost like an end-to-end test (if we don’t count that the payload actually doesn’t originate from a real SQS queue). Downside is that it is fragile, and can actually be a flaky test since sometimes connection might be down.

Alternative to this is using several plugins that can simulate a Lambda environment, and actually almost all of the AWS services, using docker images. One of them is [serverless-offline](https://github.com/dherault/serverless-offline) with its vast list of extensions. This can be really useful, but it has the opposite trade offs. It is less realistic and provides less confidence, but it is easier to setup and faster to execute.

For this Lambda I would just go with the first path since the complexity is not too big, although for different, more complex code, I would reconsider going with the second one since we are going to test the whole code again on the end-to-end tests, using real cloud infrastructure.

## End-to-end test

If you recall, everything we wrote is integrated into a single line of code (well actually two lines, but only because of the formatting 🙂 ), and it looks like this:

```js
const { EventParser, FileService } = require('./adapters');
const ImageReducer = require('./image-reducer.js');
const ImageReducerService = require('./main.js');

exports.handler = (sqsMessage) =>
  ImageReducerService(EventParser.parse(sqsMessage), FileService, ImageReducer);
```

We finished all of the unit/integration tests we need, it’s time to test our function in real life conditions, using real AWS infrastructure. Since our Lambda function receives events from an SQS queue, we need to insert a message into the queue which is connected to the function, and assert if a new image exist on a given S3 bucket after the function has finished the execution.

```js
require('dotenv').config();
const Aws = require('aws-sdk');
const { appendSuffix } = require('../utils');

Aws.config.update({ region: 'us-east-1' });
const Sqs = new Aws.SQS({ apiVersion: '2012-11-05' });
const S3 = new Aws.S3();

describe('imageReducerService', () => {
  test('end-to-end functionality', async () => {
    const event = { bucket: process.env.BUCKET, key: process.env.KEY };
    const params = {
      MessageBody: JSON.strigify(event),
      QueueUrl: process.env.SQS_QUEUE,
    };
    await Sqs.sendMessage(params).promise();

    const reducedImageMetadata = await S3.headObject({
      bucket: realBucket,
      key: appendSuffix(existingFileKey, 'png'),
    }).promise();
    expect(reducedImageMetadata).toBeDefined();
  });
});
```

This test encompasses every piece of the infrastructure that our lambda is going to use, testing if everything is connected properly. It creates an action flow exactly like it would be in real time, thus it requires that everything is already up and running on AWS.

We can run this test in a staging/QA environment first, and then we can run it again on the actual production environment just to ensure everything is nicely connected. [Lambda aliases](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-alias.html) might help here, if we want to automate the flow. So we would first deploy the new version of the function, then run this end-to-end test, and then switch aliases if everything goes well, between currently active function and the newer version.

## Summary

You can find the entire code from this article on this [github repo](https://github.com/DarkMannn/testing-node-serverless-applications), if you’d like to see everything in one place.

Writing tests for Lambdas is not a simple task. In order for a Lambda function to be testable, we have to be mindful from the very beginning of the implementation, and plan the design accordingly.

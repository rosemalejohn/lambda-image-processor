'use strict';

const Jimp = require('jimp');
const AWS = require('aws-sdk');
const FileType = require('file-type');
const _ = require('lodash');
const S3 = new AWS.S3();

const BUCKET = process.env.BUCKET || 'parkiee-uploads/photos';
const URL = process.env.URL;

// Sizes width
const sizes = { 'small': 100, 'medium': 450, 'large': 900 };

/**
 * AWS Lambda entrypoint
 *
 * @param Object event
 * @param Object context
 * @param Function callback
 */
exports.handler = (event, context, callback) => {
    console.log('Executing lambda handler...');
    console.log('Event object: ', event);

    const key = event.queryStringParameters.key;
    const match = key.match(/(\d+)x(\d+)\/(.*)/);
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    const originalKey = match[3];

    console.log('Getting s3 object...');
    S3.getObject({ Bucket: BUCKET, key: originalKey }).promise()
        .then((data) => {
            const files = {};

            _.each(sizes, (size, key) => {

                console.log(`Creating ${key} image with ${size} in width.`);
                Jimp.read(file, (err, image) => {

                    if (err) {
                        throw err;
                    }
                    image.resize(size, Jimp.AUTO)
                        .quality(60)
                        .getBuffer(Jimp.MIME_JPEG, () => {});

                    files[key] = image.bitmap.data;
                });
            });

            return files;
        })
        .then((files) => {
            _.each(files, (file, key) => {
                const fileinfo = FileType(file);
                const fileName = `${uuid}.${fileinfo.ext}`;
                const Bucket = `${bucket}${key === 'original' ? '' : ('/' + key)}`;
                console.log(`Uploading ${filename} to s3 ${BUCKET} bucket.`);
                S3.putObject({
                    Bucket,
                    Key: fileName,
                    ACL: 'public-read',
                    Body: file
                }, (err, data) => {

                    if (err) {
                        throw err;
                    }
                    console.log(data);
                });
            });
        })
        .then(() => context.succeed({
            statusCode: '301'
        }))
        .catch((err) => context.fail(err));
};

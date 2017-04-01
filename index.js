'use strict';

const Jimp = require('jimp');
const AWS = require('aws-sdk');
const Config = require('./config');
const EventParser = require('./src/EventParser');

const S3 = new AWS.S3();
const BUCKET = process.env.BUCKET || Config.bucket;

/**
 * AWS Lambda entrypoint
 *
 * @param Object event
 * @param Object context
 * @param Function callback
 */
exports.handler = (event, context, callback) => {
    const s3object = EventParser(event).s3;

    S3.getObject({ Bucket: BUCKET, Key: s3object.object.key }).promise()
        .then((data) => generateSizes(data))
        .then((files) => {
            Object.keys(files).forEach((key) => {
                const file = files[key];
                const Bucket = `${BUCKET}/${key}`;

                S3.putObject({
                    Bucket,
                    Key: s3object.object.key,
                    ACL: 'public-read',
                    Body: file
                }, (err, data) => {
                    if (err) {
                        throw err;
                    }
                });
            });
        })
        .then(() => context.succeed({
            statusCode: '301',
            message: 'Images generated successfully.'
        }))
        .catch((err) => context.fail(err));
};

/**
 * Generate different sizes of images based on config
 *
 * @param Object data
 * @return Array
 */
const generateSizes = (data) => {
    const files = {};

    Object.keys(Config.versions).forEach((key) => {
        Jimp.read(data.Body, (err, image) => {

            if (err) {
                throw err;
            }
            image.resize(Config.versions[key], Jimp.AUTO)
                .quality(60)
                .getBuffer(Jimp.MIME_JPEG, () => {});

            files[key] = image.bitmap.data;
        });
    });

    return files;
};

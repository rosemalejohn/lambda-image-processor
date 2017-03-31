'use strict';

const Jimp = require('jimp');
const AWS = require('aws-sdk');
const FileType = require('file-type');
const _ = require('lodash');
const Config = require('./config');
const EventParser = require('./src/EventParser');

const S3 = new AWS.S3();
const BUCKET = process.env.BUCKET || Config.bucket;
const URL = process.env.URL;

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
        .then((data) => {
            const files = {};

            _.each(Config.versions, (size, key) => {

                Jimp.read(data.Body, (err, image) => {

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
            statusCode: '301'
        }))
        .catch((err) => context.fail(err));
};

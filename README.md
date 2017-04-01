# Lambda Image Processor

[![Build Status](https://travis-ci.org/rosemalejohn/lambda-image-processor.svg?branch=master)](https://travis-ci.org/rosemalejohn/lambda-image-processor)

## Description

Resizes images once a photo is uploaded on s3. Using Amazon S3 and AWS Lambda.

## Testing Lambda Function Locally

- Install Lambda-local `npm install -g lambda-local`
- Modify sampledata.json
- Follow instruction [https://github.com/ashiina/lambda-local#api](here) or run `lambda-local -l index.js -h handler -e ./sampledata.json -t 100`
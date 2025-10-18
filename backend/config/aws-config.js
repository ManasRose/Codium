require("dotenv").config({ quiet: true });
const { S3Client } = require("@aws-sdk/client-s3");
const S3_BUCKET = process.env.S3_BUCKET || "manascodiumbucket";
const REGION = process.env.AWS_REGION || "ap-south-1";
const s3 = new S3Client({
  region: REGION,
});
module.exports = { s3, S3_BUCKET };

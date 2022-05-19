import aws from "aws-sdk";

const region = "";
const bucketName = "";
const accessKeyId = "";
const secretAccessKey = "";

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});

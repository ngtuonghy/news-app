import "dotenv/config";

import * as Minio from "minio";

const minioClient = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT || "localhost",
	port: process.env.MINIO_PORT
		? parseInt(process.env.MINIO_PORT)
		: 9000,
	useSSL: false,
	accessKey: process.env.MINIO_ACCESS_KEY,
	secretKey: process.env.MINIO_SECRET_KEY,
});

async function ensureBucketExists(bucketName: string) {
	const policy = `
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "*"
        ]
      },
      "Resource": [
        "arn:aws:s3:::${bucketName}"
      ],
      "Sid": ""
    },
    {
      "Action": [
        "s3:GetObject"
      ],
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "*"
        ]
      },
      "Resource": [
        "arn:aws:s3:::${bucketName}/*"
      ],
      "Sid": ""
    }
  ]
}`;

	try {
		const exists = await minioClient.bucketExists(bucketName);
		if (!exists) {
			await minioClient.makeBucket(bucketName, "us-east-1");
			await minioClient.setBucketPolicy(bucketName, policy);
			console.info(
				`Bucket "${bucketName}" created and policy set successfully.`,
			);
		} else {
			// logger.info(`✅ Bucket "${bucketName}" exists.`);
		}
	} catch (error) {
		console.error(`Error checking or creating bucket "${bucketName}":`, error);
		console.error(`Bucket "${bucketName}" failed to create.`);
	}
}

export async function initBuckets() {
	const buckets = ["users", "articles", "photos"];

	for (const bucket of buckets) {
		await ensureBucketExists(bucket);
	}
}

initBuckets();

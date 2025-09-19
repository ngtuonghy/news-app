
import * as Minio from 'minio'

// Instantiate the MinIO client with the object store service
// endpoint and an authorized user's credentials
// play.min.io is the MinIO public test cluster
const minioClient = new Minio.Client({
  endPoint: import.meta.env.MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.MINIO_PORT ? parseInt(import.meta.env.MINIO_PORT) : 9000,
  useSSL: false,
  accessKey: import.meta.env.MINIO_ACCESS_KEY,
  secretKey: import.meta.env.MINIO_SECRET_KEY,
})

export { minioClient }

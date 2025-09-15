import { minioClient } from "@/lib/s3";

export async function uploadFileFromForm(
  file: File,          
  objectName: string,  
  bucketName = "photos"
): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
      "Content-Type": file.type,
    });

    const protocol = import.meta.env.MINIO_PORT === "443" ? "https" : "http";
    const fileUrl = `${protocol}://${import.meta.env.MINIO_ENDPOINT}:${import.meta.env.MINIO_PORT}/${bucketName}/${objectName}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}




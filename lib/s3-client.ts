import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getS3Client } from "./aws-config"
import { getConfig } from "./config"
import type { DataPoint } from "./types"

/**
 * Uploads dataset to S3 bucket
 * @param data Array of data points to upload
 * @param filename Optional filename, will generate one if not provided
 * @returns S3 URI of the uploaded file
 */
export async function uploadDatasetToS3(data: DataPoint[], filename?: string): Promise<string> {
  try {
    // Get configuration
    const config = await getConfig()

    // Convert data to CSV
    const csvContent = convertToCSV(data)

    // Create S3 client
    const s3Client = getS3Client()

    // Generate a unique key if filename not provided
    const key = filename || `datasets/dataset-${Date.now()}.csv`

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.dataBucket,
        Key: key,
        Body: csvContent,
        ContentType: "text/csv",
      }),
    )

    return `s3://${config.dataBucket}/${key}`
  } catch (error) {
    console.error("Error uploading dataset to S3:", error)
    throw error
  }
}

/**
 * Downloads a dataset from S3
 * @param s3Uri S3 URI of the file to download
 * @returns The file content as a string
 */
export async function downloadFromS3(s3Uri: string): Promise<string> {
  try {
    // Parse S3 URI
    const { bucket, key } = parseS3Uri(s3Uri)

    // Create S3 client
    const s3Client = getS3Client()

    // Download from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )

    // Convert stream to string
    const bodyContents = await streamToString(response.Body)
    return bodyContents
  } catch (error) {
    console.error("Error downloading from S3:", error)
    throw error
  }
}

/**
 * Generates a presigned URL for uploading a file to S3
 * @param filename Filename to use
 * @param contentType MIME type of the file
 * @returns Presigned URL for uploading
 */
export async function getPresignedUploadUrl(filename: string, contentType: string): Promise<string> {
  try {
    // Get configuration
    const config = await getConfig()

    // Create S3 client
    const s3Client = getS3Client()

    // Generate a unique key
    const key = `uploads/${Date.now()}-${filename}`

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: config.dataBucket,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return url
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    throw error
  }
}

/**
 * Deletes a file from S3
 * @param s3Uri S3 URI of the file to delete
 */
export async function deleteFromS3(s3Uri: string): Promise<void> {
  try {
    // Parse S3 URI
    const { bucket, key } = parseS3Uri(s3Uri)

    // Create S3 client
    const s3Client = getS3Client()

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
  } catch (error) {
    console.error("Error deleting from S3:", error)
    throw error
  }
}

/**
 * Converts data points to CSV format
 * @param data Array of data points
 * @returns CSV string
 */
function convertToCSV(data: DataPoint[]): string {
  // Determine if we have category data
  const hasCategory = data.some((point) => point.category)

  // Define headers based on data structure
  const headers = hasCategory ? ["date", "value", "category"] : ["date", "value"]

  // Create rows
  const rows = data.map((point) => {
    const date = new Date(point.date).toISOString().split("T")[0]
    const value = point.actual || 0

    if (hasCategory) {
      return `${date},${value},${point.category || ""}`
    } else {
      return `${date},${value}`
    }
  })

  return [headers.join(","), ...rows].join("\n")
}

/**
 * Parses an S3 URI into bucket and key
 * @param s3Uri S3 URI in the format s3://bucket/key
 * @returns Object with bucket and key
 */
function parseS3Uri(s3Uri: string): { bucket: string; key: string } {
  const url = new URL(s3Uri.replace("s3://", "http://"))
  return {
    bucket: url.hostname,
    key: url.pathname.substring(1), // Remove leading slash
  }
}

/**
 * Converts a readable stream to a string
 * @param stream Readable stream
 * @returns Promise resolving to string content
 */
async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
  })
}

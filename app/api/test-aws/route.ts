import { NextResponse } from "next/server"
import { ListBucketsCommand } from "@aws-sdk/client-s3"
import { getS3Client } from "@/lib/aws-config"
import { getConfig } from "@/lib/config"

/**
 * API route for testing AWS connectivity
 */
export async function GET() {
  try {
    console.log("Testing AWS connectivity...")

    // Log environment variables (without exposing secrets)
    console.log("Environment check:")
    console.log("- AWS_REGION:", process.env.AWS_REGION)
    console.log("- DATA_BUCKET:", process.env.DATA_BUCKET)
    console.log("- Has AWS_ACCESS_KEY_ID:", !!process.env.AWS_ACCESS_KEY_ID)
    console.log("- Has AWS_SECRET_ACCESS_KEY:", !!process.env.AWS_SECRET_ACCESS_KEY)

    // Get configuration
    const config = await getConfig()

    // Test S3 connectivity
    const s3Client = getS3Client()
    console.log("S3 client created, attempting to list buckets...")

    const response = await s3Client.send(new ListBucketsCommand({}))
    console.log("S3 ListBuckets successful!")

    return NextResponse.json({
      success: true,
      message: "AWS connection successful",
      buckets: response.Buckets?.map((bucket) => bucket.Name) || [],
      region: config.region,
      dataBucket: config.dataBucket,
      environment: config.environment,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AWS connectivity test failed:", error)

    // Extract more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
      // Try to extract AWS-specific error details
      code: (error as any)?.Code || (error as any)?.code,
      requestId: (error as any)?.RequestId || (error as any)?.requestId,
      time: (error as any)?.Time || (error as any)?.time,
    }

    return NextResponse.json(
      {
        success: false,
        error: errorDetails.message,
        errorType: errorDetails.name,
        errorDetails,
        region: process.env.AWS_REGION,
        dataBucket: process.env.DATA_BUCKET,
        serverTime: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

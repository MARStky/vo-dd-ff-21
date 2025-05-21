# AWS SDK Implementation for Retail Demand Forecasting

This package provides a complete AWS SDK implementation for connecting a Next.js frontend to AWS SageMaker and related services for retail demand forecasting.

## Features

- SageMaker AutoML job creation and management
- S3 data storage and retrieval
- Endpoint deployment and management
- Secure credential handling
- Error handling and retry logic
- Type definitions for all data structures

## Environment Variables

The following environment variables are required:

\`\`\`env
AWS_REGION=us-east-1
DATA_BUCKET=your-data-bucket-name
SAGEMAKER_ROLE_ARN=arn:aws:iam::123456789012:role/SageMakerExecutionRole
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
ENVIRONMENT=development
\`\`\`

## Usage

### Creating a Forecasting Job

\`\`\`typescript
import { createForecastingJob } from '@/lib/sagemaker-client';

// Historical data points
const historicalData = [
  { date: '2023-01-01', actual: 1250, forecast: null },
  { date: '2023-02-01', actual: 1340, forecast: null },
  // ...more data points
];

// Create a forecasting job
const result = await createForecastingJob(historicalData);
console.log(`Job created: ${result.jobName}`);
\`\`\`

### Getting Job Status

\`\`\`typescript
import { getJobStatus } from '@/lib/sagemaker-client';

const status = await getJobStatus('retail-forecast-1234567890');
console.log(`Job status: ${status.status}`);

if (status.status === 'Completed') {
  console.log('Best candidate:', status.bestCandidate);
}
\`\`\`

### Deploying a Model

\`\`\`typescript
import { deployBestModel } from '@/lib/sagemaker-client';

const deployment = await deployBestModel('retail-forecast-1234567890');
console.log(`Model deployed: ${deployment.modelName}`);
console.log(`Endpoint: ${deployment.endpointName}`);
\`\`\`

### Getting a Forecast

\`\`\`typescript
import { getForecastFromEndpoint } from '@/lib/sagemaker-client';

const forecast = await getForecastFromEndpoint(
  'retail-forecast-1234567890-endpoint',
  historicalData,
  12 // 12-month forecast horizon
);

console.log('Forecast data:', forecast);
\`\`\`

## API Routes

The package includes a complete API route implementation in `app/api/forecast/route.ts` that handles:

- Creating forecasting jobs
- Checking job status
- Deploying models
- Getting endpoint status
- Generating forecasts
- Cleaning up resources

## React Hook

A React hook is provided in `hooks/use-forecast-api.ts` for easy integration with React components:

\`\`\`typescript
import { useForecastApi } from '@/hooks/use-forecast-api';

function MyComponent() {
  const { 
    isLoading, 
    error, 
    createJob, 
    getJobStatus, 
    deployModel, 
    getForecast 
  } = useForecastApi();

  // Use the hook methods in your component
}
\`\`\`

## Security

This implementation follows AWS security best practices:

- Credentials are only used server-side in API routes
- IAM roles with least privilege
- Error handling and logging
- No sensitive information exposed to the client

## License

MIT

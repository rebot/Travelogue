// AWS Services om de gpx'en op te slaan
// --> AWS S3 Bucket
module.exports = {
  aws: {
    // User profile - only for debugging purpose
    accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // Identity pool - to configure unauth and auth requests
    identityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL
  },
  mapbox: {
    // Mapbox Access Token
    accessToken: process.env.MAPBOX_ACCESS_TOKEN
  }
}

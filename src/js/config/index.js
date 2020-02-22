// AWS Services om de gpx'en op te slaan
// --> AWS S3 Bucket
module.exports = {
    aws: {
        accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
    }
}
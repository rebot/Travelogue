import {
    aws as awsConfig
} from './../config'
import S3 from 'aws-sdk/clients/s3'
import AWS from 'aws-sdk'

AWS.config.region = 'eu-central-1'
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: awsConfig.identityPoolId
})

/** Make a S3 Bucket instance */
const s3bucket = new S3({
    params: {
        /**
         * Attach the bucket name to the 
         * S3 object as a default so we 
         * shouldn't repeat it in our calls
         */
        Bucket: 'rebot-travelogue'
    },
    // Huidige api versie
    apiVersion: '2006-03-01'
})

/**
 * Upload a File object to the s3bucket
 *
 * @param {file} f - File object
 */
const s3bucketUpload = async f => {
    const params = {
        Key: f.name,
        ContentType: f.type,
        Body: f,
        ACL: 'public-read'
    }
    /** Upload the file to the S3 Bucket */
    const data = await s3bucket.putObject(params).promise()
}

/**
 * Retrieve a list of Files from the S3 Bucket
 *
 * @param {number} [size=10] - Amount of files to retrieve
 */
const s3bucketList = async (size=10) => {
    const params = {
        MaxKeys: size
    }
    /** Retrieve the last 10 files which the user can view */
    const fileList = await s3bucket.listObjectsV2(params).promise()
}

module.exports = {
  s3bucket,
  s3bucketUpload,
  s3bucketList
}

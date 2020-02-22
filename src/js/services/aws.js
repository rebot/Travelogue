import { aws } from './../config'
import S3 from 'aws-sdk/clients/s3'

const s3bucket = new S3({
    // Authenticatie
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
    params: {
        // Bind de bucket toe aan de klasse
        // Nu moet deze niet meer herhaald worden
        // voor elke api call
        Bucket: 'rebot-travelogue'
    },
    // Huidige api versie
    apiVersion: '2006-03-01'
})

module.exports = {
    s3bucket
}

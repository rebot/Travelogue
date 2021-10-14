const fetch = require('node-fetch')

const username = process.env.WAYLAY_CLIENT
const password = process.env.WAYLAY_SECRET

const handler = async function (event) {
  try {

    const method = event.headers['content-type']

    if (method.includes('multipart/form-data')){
      // Strip last 2 characters
      const binary = event.body.slice(0, event.body.length - 2)
      // Multiple file upload - Parse formdata
      const match = method.match(/boundary=(.*)/) 
      const boundary = match[1]

      const boundaryRegex = new RegExp(`--${boundary}\r?\n(.*?)${boundary}`, 's')
      const binaryFileList = binary.match(boundaryRegex)

      binaryFileList.shift()

      for (const bin of binaryFileList){
        // Splits de multipart in een header en de binary
        console.log(bin.slice(0, 1000))
        const { header, file } = bin.split()
      }

      console.log(binaryFileList.length)
      
    } else {
      // Individual file upload
    }

    const body = JSON.parse(event.body)
    const { fileName, fileType } = body

    if (!fileName && !fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing fileName or fileType on body'
        })
      }
    }

    if (fileType === 'application/xml') {
      // upload gpx

    }
    if (fileType === 'photo') {
      // create folder with gpx name

      // upload photos in gpx name folder
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        fileName, fileType
      })
    }
  } catch (error) {
    // output to netlify function log
    console.log(error)
    return {
      statusCode: 500,
      // Could be a custom message or object i.e. JSON.stringify(err)
      body: JSON.stringify({ msg: error.message })
    }
  }
}

module.exports = { handler }

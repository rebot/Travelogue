const fetch = require('node-fetch')

const username = process.env.WAYLAY_CLIENT
const password = process.env.WAYLAY_SECRET

const handler = async function (event) {
  try {
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

const fetch = require('node-fetch')

const username = process.env.WAYLAY_CLIENT
const password = process.env.WAYLAY_SECRET

const handler = async function () {
  try {
    const response = await fetch('https://api-io.waylay.io/storage/v1/bucket/assets/traveloque/GPX/', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      }
    })
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const data = await response.json()
    const files = data.objects.map(file => {
      return {
        name: file.name.replace('traveloque/GPX/',''),
        lastModified: file.last_modified
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify(files)
    }
  } catch (error) {
    // output to netlify function log
    console.log(error)
    return {
      statusCode: 500,
      // Could be a custom message or object i.e. JSON.stringify(err)
      body: JSON.stringify({ msg: error.message }),
    }
  }
}

module.exports = { handler }

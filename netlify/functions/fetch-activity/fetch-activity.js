const fetch = require('node-fetch')

const username = process.env.WAYLAY_CLIENT
const password = process.env.WAYLAY_SECRET

const handler = async function (filename) {
  try {
    const response = await fetch('https://api-io.waylay.io/storage/v1/bucket/assets/traveloque/GPX/' + filename + '?sign=GET', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      }
    })
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const getLink = (await response.json())._links.get_object.href

    const fileResponse = await fetch(getLink)
    const file = await fileResponse.text()
    return {
      statusCode: 200,
      body: file
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

handler('KOM_hunting_w_Mr_Scharnweber.gpx')

module.exports = { handler }

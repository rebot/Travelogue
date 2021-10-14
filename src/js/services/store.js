const uploadActivity = async files => {
    // Prepare formdata
    const data = new FormData();
    // Loop over the files and add to the FormData
    for (const file of files) {
        data.append('files[]', file, file.name);
    }
    // Upload the activity
    const response = await fetch('/netlify/functions/uploadactivity', {
        method: 'POST',
        body: data
    })
    // Read the json result
    const responseData = await response.json()
    console.log(responseData)
}

module.exports = {
    uploadActivity
}
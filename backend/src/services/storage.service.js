const ImageKit = require('imagekit')

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

async function uploadFile(fileBuffer, fileName) {

    const base64File = fileBuffer.toString('base64')

    const result = await imagekit.upload({
        file: base64File,
        fileName: fileName,
    })

    return result
}

module.exports = {
    uploadFile,
}
# sftp-uploader

> `sftp-uploader` is a file upload plug-in based on `ssh2-sftp-client` encapsulation, supporting `webpack` and `vite`. It can upload the packaged project files to the specified sftp server directory with one click. It can be integrated as a `webpack` or `vite` plug-in or used `separately`, and supports automatic creation of upload directories.

## Install
![NPM](https://nodei.co/npm/sftp-uploader-eng.png)
```sh
$ yarn add sftp-uploader
$ npm i sftp-uploader
```

## Note
This version is only available for node "^18.0.0 || >=20.0.0" <br />
For lower node versions, please download [v1.x](https://www.npmjs.com/package/sftp-uploader-eng/v/1.0.3)

## Configuration

```javascript
import { resolve } from 'path'
import SftpUploader from 'sftp-uploader'

const sftp = SftpUploader({
    dir: resolve('./dist'), // Directory to upload files
    url: '******', // Directory to upload
    host: '*****', // sftp address
    port: '*****', // sftp port
    username: '*****', // Account
    password: '*****', // Password
    // Delay upload time (milliseconds) to solve the problem that some projects will trigger multiple packaging completions
    delay: 0,
    // Upload file filter, you can filter out unnecessary files, return false to not upload the file (optional)
    uploadFilter(file) => file.name.endsWith(.gz),
    // Delete file filter, you can filter out files that do not need to be deleted, return false to not delete the file (optional)
    deleteFilter(file) => file.name.endsWith(.gz),
    // Preview link address (optional)
    previewPath: 'https://www.google.com'
})
```

# Use
## Use with the packaging command
```javascript
// Used in webpack
//vue.config.js
module.exports = {
  configureWebpack: config => {
    return {
      plugins: [
        SftpUploader({ ... })
      ]
    }
  }
}

//Used in vite
//vite.config.js
export default defineConfig({
  plugins: [
    SftpUploader({ ... })
  ]
})

// package.json
// 1. Windows environment
"scripts": {
  "build": "vue-cli-service build --mode development",
  "deploy": "set UPLOAD=true && yarn build"
}
// 2. Linux or MacOS environment
"scripts": {
  "build": "vue-cli-service build --mode development",
  "deploy": "export UPLOAD=true && yarn build"
}
// Use yarn deploy or npm run deploy
```

## Upload any project
```javascript
// 1. Create uploader.js in the project
// 2. The configuration is the same as the webpack plugin mode
SftpUploader({ ... }).put()
// Then run the following command in the project root directory terminal
node uploader.js
```


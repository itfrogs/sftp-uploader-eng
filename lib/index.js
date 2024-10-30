import fs from 'fs'
import { resolve } from 'path'
import { glob } from 'glob'
import Client from 'ssh2-sftp-client'
import { pointLog, progressBar } from './util.js'

function sftpUploader(options) {
  const sftp = new Client()
  let trim = null,
      isFirst = true, // Prevent multiple calls
      timer = 0

  if (options.dot === undefined) {
    options.dot = false;
  }

  if (options.serverPath !== undefined) {
    options.url = options.serverPath;
  }

  let url = options.url
  if (!url.endsWith('/')) {
    url = url + '/' // If the upload directory does not end with /, add it automatically, otherwise the file cannot be found
  }

  let config = {
    host: options.host, // Server address
    port: options.port,
    username: options.username,
    password: options.password
  }

  // webpack钩子
  function apply(compiler) {
    if (compiler && compiler.hooks && compiler.hooks.done) {
      compiler.hooks.done.tap('sftp-uploader-eng', () => {
        isPut()
      })
    }
    return 'build'
  }

  // Determine the environment and check whether it can be uploaded
  function isPut() {
    const ARGV_DEPLOY = process.argv.some((_) => _.includes('deploy')) || false // Get deploy from command
    // Lower version npm does not support
    // const IS_DEPLOY = process.env.npm_config_argv?.includes('deploy') || false // Read command judgment

    const UPLOAD = !!process.env.UPLOAD || options.autoupload // Manual Setup UPLOAD

    if (ARGV_DEPLOY || UPLOAD) {
      clearTimeout(trim)
      trim = setTimeout(() => {
        isFirst && put() // Start uploading logic
      }, options.delay || 0)
    }
  }

  function put() {
    isFirst = false
    // Automatic upload to FTP server
    if (!options.dir) {
      pointLog('> Unable to upload SFTP, please check the parameters', 'error')
      return
    }

    timer = Date.now()

    pointLog('\n$sftp-uploader-eng')

    sftp
        .connect(config)
        .then(() => {
          // Connect to the server
          pointLog('\n> uploading...', 'success')
          pullDir()
        })
        .catch((err) => {
          exError('> sftp connection failed' + err)
        })
  }

  function pullDir() {
    sftp
        .list(options.url)
        .then((files) => {
          // Filter out files that do not need to be deleted
          if (options.deleteFilter && typeof options.deleteFilter === 'function') {
            files = files.filter((x) => options.deleteFilter(x))
          }
          deleteServerFile(files).then(() => {
            globLocalFile()
          })
        })
        .catch(() => {
          pointLog('  - Folder not found：' + options.url + '，Try to create a folder')
          sftp
              .mkdir(options.url, true)
              .then((res) => {
                pointLog(`  - ${options.url}Folder created successfully`)
                pullDir()
              })
              .catch((_) => {
                exError('  - Folder creation failed ' + _)
              })
        })
  }

  async function deleteServerFile(list) {
    const total = list.length
    if (total > 0) {
      // Delete files (folders) on the server
      const speed = progressBar('Deleting') // 上传进度条
      let i = 0
      for (const fileInfo of list) {
        i++
        speed({ completed: i, total })
        const path = url + fileInfo.name
        if (fileInfo.type === '-') {
          await sftp.delete(path)
        } else {
          await sftp.rmdir(path, true)
        }
      }
      pointLog(`\n  - Deleted successfully\n`, 'success')
    }

    return new Promise((resovle) => {
      resovle()
    })
  }

  function globLocalFile() {
    let localDir = `${options.dir}${options.dir.endsWith('/') ? '**' : '/**'}`
    // Get all files in the local path
    glob(localDir, {dot: options.dot}).then((files) => {
      // Paths of all files (folders) in the local directory
      // files.splice(0, 1) // Deleting a Path../dist/
      if (options.uploadFilter && typeof options.uploadFilter === 'function') {
        files = files.filter((x) => options.uploadFilter(x))
      }
      uploadFileToSftp(files)
    })
  }

  async function uploadFileToSftp(files) {
    // Transfer files to the server
    const speed = progressBar('Progress') // Upload progress bar
    const total = files.length
    let i = 0
    for (let localSrc of files) {
      i++
      localSrc = resolve(localSrc) // Get the full path
      let targetSrc = localSrc.replace(options.dir, options.url)
      targetSrc = targetSrc.replace(/\\/g, '/')
      speed({ completed: i, total })
      if (fs.lstatSync(localSrc).isDirectory()) {
        // Is a folder
        await sftp.mkdir(targetSrc)
      } else {
        await sftp.put(localSrc, targetSrc)
      }
    }
    pointLog(`\n  - Upload Successfully\n`, 'success')
    pointLog(`  - time consuming: ${Date.now() - timer}ms`)
    if (options.previewPath) {
      pointLog(`  - Preview address: ${options.previewPath} \n\n`, 'link')
    }
    sftp.end()
  }

  function exError(err) {
    sftp.end()
    pointLog(`  - sftpError:${err}`, 'error')
  }

  return {
    name: 'sftp-uploader-eng',
    // @ts-ignore Because it needs to be compatible with webpack, vite verification will fail
    apply, // webpack hooks
    put,
    // vite upload hook
    closeBundle() {
      isPut()
    }
  }
}

export default sftpUploader
// module.exports = sftpUploader

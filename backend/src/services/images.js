import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { check } from './db.js'

export const uploadDir = fileURLToPath(new URL('../../uploads/', import.meta.url))
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 15, fieldSize: 10000 },
  fileFilter(req, file, callback) {
    callback(extensions[file.mimetype] ? null : Object.assign(new Error('Use JPG, PNG or WebP images.'), { status: 400 }), true)
  }
}).array('images', 5)

function cloudEnabled() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })
  return true
}

function validImage({ buffer, mimetype }) {
  if (mimetype === 'image/jpeg') return buffer.subarray(0, 3).toString('hex') === 'ffd8ff'
  if (mimetype === 'image/png') return buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
}

export async function storeImages(files) {
  check(files.every(validImage), 'One of the selected files is not a valid image.')
  const stored = []
  try {
    for (const file of files) {
      if (cloudEnabled()) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'green-second-life' }, (error, result) => error ? reject(error) : resolve(result)).end(file.buffer)
        })
        stored.push(result.secure_url)
      } else {
        const name = `${randomUUID()}.${extensions[file.mimetype]}`
        await mkdir(uploadDir, { recursive: true })
        await writeFile(uploadDir + name, file.buffer)
        stored.push('/uploads/' + name)
      }
    }
    return stored
  } catch (error) {
    await removeImages(stored)
    throw error
  }
}

export async function removeImages(images) {
  await Promise.allSettled(images.map(async url => {
    if (url.startsWith('/uploads/')) return unlink(uploadDir + url.split('/').at(-1))
    const asset = url.match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/(green-second-life\/[\w-]+)\.[\w]+$/)
    if (asset && cloudEnabled()) return cloudinary.uploader.destroy(asset[1])
  }))
}

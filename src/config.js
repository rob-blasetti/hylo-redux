import { parse } from 'url'

const environment = process.env.NODE_ENV || 'development'
const isServer = typeof window === 'undefined'

if (isServer && environment === 'development') {
  require('dotenv').load({silent: true})
}

const config = {
  environment,
  useAssetManifest: environment === 'production',
  assetHost: process.env.ASSET_HOST || '',
  assetPath: process.env.ASSET_PATH || '',
  filepickerKey: process.env.FILEPICKER_API_KEY,
  logLevel: process.env.LOG_LEVEL,
  upstreamHost: process.env.UPSTREAM_HOST,
  host: process.env.HOST,
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    host: process.env.AWS_S3_HOST
  },
  google: {
    key: process.env.GOOGLE_BROWSER_KEY,
    clientId: process.env.GOOGLE_CLIENT_ID
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID
  },
  segment: {
    writeKey: process.env.SEGMENT_KEY
  }
}

let { upstreamHost } = config

if (!upstreamHost || !parse(upstreamHost).protocol) {
  throw new Error(`bad value for UPSTREAM_HOST: ${upstreamHost}`)
}

if (!isServer) window.__appConfig = config

export default config

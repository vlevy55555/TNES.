import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: { projectId: 'bchwhnoq', dataset: 'production' },
  // `npm run deploy` publishes the Studio at https://tnes.sanity.studio
  studioHost: 'tnes',
  deployment: { appId: 't1goxgy49u0nvfj914j1s3b7', autoUpdates: true },
})

import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: { projectId: 'bchwhnoq', dataset: 'production' },
  // `npm run deploy` publishes the Studio at https://tnes.sanity.studio
  studioHost: 'tnes',
  deployment: { autoUpdates: true },
})

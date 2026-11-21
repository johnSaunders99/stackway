import {defineConfig,normalizePath} from 'vite'
import react from '@vitejs/plugin-react'
import MarkdownIt from 'markdown-it'

export default defineConfig({
  base:'./',
  cacheDir:process.env.STACKWAY_TASK_TAG && /^[a-z0-9-]+$/.test(process.env.STACKWAY_TASK_TAG) ? '.cache/'+process.env.STACKWAY_TASK_TAG+'/vite' : undefined,
  plugins:[react(), {
    name:'stackway-guide',
    enforce:'pre',
    transform(source,id) {
      if (normalizePath(id).endsWith('/docs/guide.md')) {
        return 'export default '+JSON.stringify(new MarkdownIt({html:false}).render(source))
      }
    }
  }],
  server:{host:'127.0.0.1'},
  test:{include:['tests/**/*.test.{ts,tsx,mjs}']}
})

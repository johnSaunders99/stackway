import { buildContent, source } from './content.mjs';
import { createServer } from 'vite';
buildContent(source(process.argv.slice(2)));
const server = await createServer();
await server.listen();
server.printUrls();

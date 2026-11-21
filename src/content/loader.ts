import type {Body} from './types'
import {assembleCatalog} from './catalog'
async function get<T>(file:string):Promise<T>{const r=await fetch(import.meta.env.BASE_URL+'content/'+file);if(!r.ok)throw Error('無法讀取課程，請重新建置內容。');return r.json()}
export async function loadCatalog(){const [index,deck]=await Promise.all([get<Parameters<typeof assembleCatalog>[0]>('index.json'),get<Parameters<typeof assembleCatalog>[1]>('concepts.json')]);return assembleCatalog(index,deck)}
export const loadBody=(id:string)=>get<Body>('lessons/'+encodeURIComponent(id)+'.json')

import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
export function createApp({backend=process.env.FRUITVISION_BACKEND_URL||'http://127.0.0.1:8000',key=process.env.FRUITVISION_API_KEY||'',request=fetch,allowedOrigin=process.env.ALLOWED_ORIGIN||'http://127.0.0.1:5173'}={}){
 const target=new URL(backend);if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.search||target.hash)throw Error('URL do backend inválida.');let busy=false;
 return createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
 const route=(req.url||'/').split('?')[0];
 if(route.startsWith('/api/')){
  if(req.headers.origin&&![allowedOrigin,`http://${req.headers.host}`,`https://${req.headers.host}`].includes(req.headers.origin))return send(403,{error:'Origem não autorizada.'});
  const action=route.slice('/api/backend/'.length),video=/^videos\/[a-f0-9]{32}$/.test(action),health=action==='health',post=['detect','segment','process-video'].includes(action);
  if(!route.startsWith('/api/backend/')||!(post||video||health))return send(404,{error:'Rota não encontrada.'});
  if(req.method!==(post?'POST':'GET'))return send(405,{error:'Método não permitido.'});
  if(post&&busy)return send(429,{error:'Um processamento já está em andamento.'});
  if(post&&!/^multipart\/form-data;\s*boundary=[^\r\n]{1,200}$/i.test(req.headers['content-type']||''))return send(415,{error:'Envie um formulário multipart.'});
  if(post)busy=true;
  try{
   let body;const headers={};if(key)headers['X-API-Key']=key;
   if(post){const chunks=[];let size=0;const limit=(action==='process-video'?26:6)*1024*1024;for await(const chunk of req){size+=chunk.length;if(size>limit)return send(413,{error:'Arquivo acima do limite.'});chunks.push(chunk);}body=Buffer.concat(chunks);headers['content-type']=req.headers['content-type'];}
   let upstream;try{upstream=await request(new URL(action,target.href.replace(/\/?$/,'/')),{method:req.method,body,headers,redirect:'error',signal:AbortSignal.timeout(action==='process-video'?120000:30000)});}catch{return send(504,{error:'Backend indisponível ou prazo excedido. Verifique o serviço local.'});}
   if(!upstream.ok){let message='Falha no backend.';try{const data=await upstream.json();if(typeof data.detail==='string')message=data.detail.slice(0,500);}catch{}return send([400,401,403,404,413,415,422,429,503].includes(upstream.status)?upstream.status:502,{error:message});}
   if(video){if(!(upstream.headers.get('content-type')||'').startsWith('video/mp4'))return send(502,{error:'Formato de download inválido.'});const declared=Number(upstream.headers.get('content-length')||0);if(declared>128*1024*1024)return send(502,{error:'Saída acima do limite.'});const chunks=[];let size=0;for await(const chunk of upstream.body){size+=chunk.length;if(size>128*1024*1024)return send(502,{error:'Saída acima do limite.'});chunks.push(chunk);}res.writeHead(200,{'content-type':'video/mp4','content-disposition':'attachment; filename="fruitvision.mp4"','cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(Buffer.concat(chunks));}
   const data=await upstream.json();if(action==='process-video'){if(!/^\/videos\/[a-f0-9]{32}$/.test(data.download_url))return send(502,{error:'URL de saída inválida.'});data.download_url='/api/backend'+data.download_url;delete data.output_file;}return send(200,data);
  }catch{return send(502,{error:'Resposta inválida do backend.'});}finally{if(post)busy=false;}
 }
 if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Método não permitido.'});
 try{const path=resolve(dist,'.'+decodeURIComponent(route==='/'?'/index.html':route));if(!path.startsWith(resolve(dist)+sep)||!(await stat(path)).isFile())return send(404,{error:'Arquivo não encontrado.'});const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:await readFile(path));}catch{return send(404,{error:'Execute npm run build.'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log('FruitVision: http://127.0.0.1:'+(process.env.PORT||3001)));

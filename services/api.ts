export type Mode='demo'|'yolo';
export type Detection={class_id:number;label:string;confidence:number;bbox:[number,number,number,number]};
export type Result={mode:Mode;detections?:Detection[];image_shape?:[number,number];polygons?:number[][][];num_objects?:number;processing_time_ms?:number;total_frames?:number;total_detections?:number;download_url?:string;resolution?:number[];fps?:number};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export function validateResult(data:any,action:string):Result{
 if(!data||data.success!==true||!['demo','yolo'].includes(data.mode))throw Error('Resposta inválida do backend.');
 if(action==='detect'){
  if(!Array.isArray(data.image_shape)||data.image_shape.length!==2||!data.image_shape.every((n:unknown)=>finite(n)&&n>0)||!Array.isArray(data.detections)||data.detections.length>5000)throw Error('Dimensões ou detecções inválidas.');
  for(const d of data.detections)if(!Number.isInteger(d.class_id)||typeof d.label!=='string'||d.label.length>100||!finite(d.confidence)||d.confidence<0||d.confidence>1||!Array.isArray(d.bbox)||d.bbox.length!==4||!d.bbox.every(finite)||d.bbox[0]<0||d.bbox[1]<0||d.bbox[2]<d.bbox[0]||d.bbox[3]<d.bbox[1]||d.bbox[2]>data.image_shape[0]||d.bbox[3]>data.image_shape[1])throw Error('Caixa de detecção inválida.');
 }else if(action==='segment'){
  if(!Array.isArray(data.polygons)||data.polygons.length>5000||!Number.isInteger(data.num_objects)||data.num_objects<0||data.polygons.some((p:any)=>!Array.isArray(p)||p.length>100000||p.some((v:any)=>!Array.isArray(v)||v.length!==2||!v.every(finite))))throw Error('Polígonos inválidos.');
 }else if(action==='process-video'){
  if(!/^\/api\/backend\/videos\/[a-f0-9]{32}$/.test(data.download_url)||!Number.isInteger(data.total_frames)||data.total_frames<1||!Number.isInteger(data.total_detections)||data.total_detections<0||!finite(data.fps)||data.fps<=0||!Array.isArray(data.resolution)||data.resolution.length!==2||!data.resolution.every((n:unknown)=>finite(n)&&n>0))throw Error('Resposta de vídeo inválida.');
 }else throw Error('Ação inválida.');
 if(action!=='process-video'&&(!finite(data.processing_time_ms)||data.processing_time_ms<0))throw Error('Tempo de processamento inválido.');
 return data;
}
export function validateFile(file:File,video:boolean){
 if(!file.size||file.size>(video?25:5)*1024*1024)throw Error(video?'Envie um vídeo de até 25 MB.':'Envie uma imagem de até 5 MB.');
 if(video?!['video/mp4','video/webm','video/x-msvideo','video/quicktime'].includes(file.type):!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Formato de arquivo não suportado.');
}
export async function processFile(file:File,action:string,segmentation:boolean,signal:AbortSignal){
 const body=new FormData();body.append('file',file);if(action==='process-video')body.append('enable_segmentation',String(segmentation));
 const response=await fetch('/api/backend/'+action,{method:'POST',body,signal});const data=await response.json();if(!response.ok)throw Error(typeof data.error==='string'?data.error:'Falha ao processar arquivo.');return validateResult(data,action);
}

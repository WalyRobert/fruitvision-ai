import {describe,it,expect} from 'vitest';
import {validateFile,validateResult} from '../services/api';
describe('contratos do backend',()=>{
 it('mantém demo explícito e lista vazia',()=>expect(validateResult({success:true,mode:'demo',detections:[],image_shape:[100,100],processing_time_ms:1},'detect').mode).toBe('demo'));
 it('recusa confiança ou caixa fora da imagem',()=>{const data={success:true,mode:'yolo',detections:[{class_id:1,label:'banana',confidence:1.2,bbox:[0,0,12,12]}],image_shape:[10,10],processing_time_ms:1};expect(()=>validateResult(data,'detect')).toThrow();data.detections[0].confidence=.9;expect(()=>validateResult(data,'detect')).toThrow();});
 it('recusa links externos de vídeo',()=>expect(()=>validateResult({success:true,mode:'demo',download_url:'https://example.com/'},'process-video')).toThrow());
 it('recusa arquivos inválidos antes do envio',()=>{expect(()=>validateFile(new File(['x'],'a.svg',{type:'image/svg+xml'}),false)).toThrow();expect(()=>validateFile(new File([],'a.png',{type:'image/png'}),false)).toThrow();});
});

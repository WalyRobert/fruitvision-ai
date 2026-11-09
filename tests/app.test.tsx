import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import App from '../App';
afterEach(()=>vi.unstubAllGlobals());
it('não envia mídia nem consulta servidor ao abrir',()=>{const request=vi.fn();vi.stubGlobal('fetch',request);render(<App/>);expect(request).not.toHaveBeenCalled();expect(screen.getByText('Conexão não verificada.')).toBeTruthy();});
it('exibe advertência real de demo após consulta',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({mode:'demo'})}));render(<App/>);fireEvent.click(screen.getByText('Verificar backend'));expect(await screen.findByRole('note')).toHaveProperty('textContent',expect.stringContaining('não há inferência de IA'));});

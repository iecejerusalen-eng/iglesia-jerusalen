import { test, expect } from './fixtures/test';

test('Las lecturas tienen canonical propio, preguntas y progreso persistente', async ({ page }) => {
 await page.goto('/nosotros/doctrina');
 await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://www.iecejerusalen.com/nosotros/doctrina');
 const question=page.getByRole('group',{name:'¿Cómo recibimos la salvación?'});
 await question.getByRole('radio',{name:'Como recompensa por acumular buenas obras.'}).check();
 await page.locator('form').filter({has:question}).getByRole('button',{name:'Comprobar respuesta'}).click();
 await expect(page.locator('form').filter({has:question}).getByRole('status')).toContainText('Revisa la lectura.');
 await question.getByRole('radio',{name:'Por gracia mediante la fe en Jesucristo.'}).check();
 await page.locator('form').filter({has:question}).getByRole('button',{name:'Comprobar respuesta'}).click();
 await expect(page.locator('form').filter({has:question}).getByRole('status')).toContainText('Correcto.');
 await page.getByRole('button',{name:'Marcar como leído',exact:true}).click();
 await page.reload();await expect(page.getByRole('button',{name:'Lectura completada · desmarcar'})).toHaveAttribute('aria-pressed','true');
 await page.goto('/nosotros');await expect(page.getByRole('region',{name:'Tu recorrido de aprendizaje'})).toContainText('1 de 5');
 await page.goto('/nosotros/simbolos');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://www.iecejerusalen.com/nosotros/simbolos');
});

test('El himno carga YouTube solo al solicitarlo y conserva la fuente', async ({ page }) => {
 await page.goto('/nosotros/himno');await expect(page.locator('#himno h3')).toHaveCount(5);
 await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Escuchar en YouTube'})).toHaveAttribute('href','https://www.youtube.com/watch?v=-I1Omj7vE6k');
 await page.getByRole('button',{name:'Cargar reproductor'}).click();
 await expect(page.locator('iframe[title="Himno Cuadrangular completo"]')).toHaveAttribute('src',/youtube-nocookie\.com\/embed\/-I1Omj7vE6k/);
});

test('Los borradores privados no se consultan desde las lecturas públicas', async ({ page }) => {
 const drafts:string[]=[];page.on('request',r=>{if(/about_learning_(drafts|history)/.test(r.url()))drafts.push(r.url());});
 await page.goto('/nosotros/historia');
 await page.locator('section.history-sources details > summary').click();
 await expect(page.getByRole('heading',{name:'Una historia que conservamos juntos'})).toBeVisible();
 await expect(page.getByText('Consultando la edición publicada…')).toHaveCount(0);
 expect(drafts).toEqual([]);
});

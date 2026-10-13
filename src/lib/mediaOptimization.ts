export async function optimizeLibraryImage(file: File): Promise<File> {
  if (!['image/jpeg','image/png'].includes(file.type) || file.size < 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1,1920 / Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const context=canvas.getContext('2d');if(!context)throw new Error('Este navegador no permite optimizar la imagen.');
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('No se pudo optimizar la imagen.')),'image/webp',0.86));
    if(blob.size>=file.size)return file;
    return new File([blob],`${file.name.replace(/\.[^.]+$/,'')}.webp`,{type:'image/webp',lastModified:file.lastModified});
  } finally {bitmap.close();}
}

-- Migration para agregar el arreglo de editores a la tabla de sermones
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS editors TEXT[] DEFAULT '{}';

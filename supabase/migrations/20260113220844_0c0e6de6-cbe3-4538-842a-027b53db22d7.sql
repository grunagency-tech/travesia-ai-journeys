-- Tabla para imágenes de destinos turísticos
CREATE TABLE public.destination_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL,
  city_name_en TEXT, -- nombre en inglés para búsquedas
  country TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city_name, country)
);

-- Permitir lectura pública (no requiere auth)
ALTER TABLE public.destination_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destination images"
ON public.destination_images
FOR SELECT
USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Admins can manage destination images"
ON public.destination_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice para búsquedas rápidas
CREATE INDEX idx_destination_images_city ON public.destination_images(city_name);
CREATE INDEX idx_destination_images_city_en ON public.destination_images(city_name_en);
CREATE INDEX idx_destination_images_country ON public.destination_images(country);
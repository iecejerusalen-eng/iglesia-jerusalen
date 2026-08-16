-- Mantiene separadas las publicaciones de la congregación y las de cada
-- ministerio/departamento. Cuerpo de Apoyo se conserva intencionalmente como
-- espacio de Iglesia general cuando no existe una relación con ministries.

WITH matched_ministries AS (
  -- Sólo se elige un espacio por ministerio para respetar el índice único y
  -- evitar que dos espacios antiguos provoquen un fallo durante el despliegue.
  SELECT DISTINCT ON (ministry.id)
    space.id AS space_id,
    ministry.id AS ministry_id
  FROM public.editorial_spaces AS space
  JOIN public.ministries AS ministry
    ON (
      space.ministry_id = ministry.id
      OR lower(space.slug) IN (
        lower(ministry.slug),
        lower('ministerio-' || ministry.slug),
        lower('publicaciones-' || ministry.slug)
      )
      OR lower(space.name) = lower(ministry.name)
      OR lower(space.name) = lower('Publicaciones de ' || ministry.name)
      OR lower(space.name) LIKE '%' || lower(ministry.name) || '%'
      OR regexp_replace(lower(space.slug), '^(ministerio-|publicaciones-|dep-)', '') = regexp_replace(lower(ministry.slug), '^(ministerio-|publicaciones-|dep-)', '')
    )
  WHERE space.owner_type = 'church'
    AND lower(space.name) NOT LIKE '%cuerpo%de%apoyo%'
    AND lower(space.slug) NOT LIKE '%cuerpo-de-apoyo%'
    AND lower(space.name) NOT LIKE '%iglesia general%'
    AND lower(space.name) NOT LIKE '%oficial%'
  ORDER BY ministry.id, (space.ministry_id IS NOT NULL) DESC, char_length(ministry.name) DESC, space.id
)
UPDATE public.editorial_spaces AS space
SET owner_type = 'ministry',
    ministry_id = matched.ministry_id,
    program_id = NULL,
    updated_at = now()
FROM matched_ministries AS matched
WHERE space.id = matched.space_id
  -- Si ya existe un espacio del ministerio, no se pisa ni se elimina ningún
  -- contenido: el duplicado queda para revisión manual en el panel admin.
  AND NOT EXISTS (
    SELECT 1
    FROM public.editorial_spaces AS claimed
    WHERE claimed.owner_type = 'ministry'
      AND claimed.ministry_id = matched.ministry_id
      AND claimed.id <> space.id
  );

-- Retira da vitrine as categorias ainda não utilizadas pela VG.
update public.categories
set is_active = false, updated_at = now()
where slug in ('personalizados', 'trofeus', 'impressoes', 'comunicacao-visual', 'acrilicos', 'placas');

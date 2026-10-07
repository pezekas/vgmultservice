-- Esconde os produtos genéricos de demonstração pedidos para remoção.
-- A desativação mantém referências e histórico, sem exibi-los na vitrine.
update public.products
set is_active = false, updated_at = now()
where slug in (
  'adesivo-personalizado',
  'placa-personalizada',
  'peca-em-acrilico',
  'comunicacao-visual-sob-medida',
  'impressao-personalizada',
  'trofeu-personalizado',
  'gravacao-personalizada',
  'produto-personalizado'
);

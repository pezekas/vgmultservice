# VG Multiservice

Site para a gráfica para aumento de fatuamento.

## Estado do projeto

Concludo: vitrine e área administrativa. O catálogo público e o painel usam as mesmas tabelas do Supabase.

## Stack

- Next.js, React e TypeScript para vitrine, painel e operações no servidor.
- PostgreSQL gerenciado pelo Supabase.
- Supabase Auth para login dos funcionários.
- Supabase Storage público para imagens de produtos e privado para arquivos de orçamento.
- Vercel como opção inicial de hospedagem.
- Link `wa.me` para abrir a mensagem de orçamento no WhatsApp.

## Requisitos locais

- Node.js 20.9 ou superior e npm.
- Um projeto Supabase.


## Regras e decisões de negócio

- O WhatsApp é oficial da gráfia.
- O cliente não precisa criar conta para pedir orçamento.
- Produtos e descrições de exemplo devem ser editáveis pela equipe.
- Fórmula proposta: largura × altura em m² × preço/m². 
- Pagamento, frete e conclusão serão acertados pelo WhatsApp no MVP. O acompanhamento do pedido pelo cliente fica para fase futura.
- Administradores gerenciam produtos, usuários e categorias; funcionários podem criar e editar produtos, preços, fotos e opções, mas não excluir produtos nem gerenciar usuários; clientes não acessam o painel.

## Verificações

- `npm run lint`: análise estática do código.
- `npm run build`: compilação de produção.


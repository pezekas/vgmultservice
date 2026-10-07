# VG Multiservice

Plataforma web para vitrine de produtos gráficos, solicitações de orçamento e gestão administrativa.

## Estado do projeto

Etapa atual: vitrine e início da área administrativa. O catálogo público e o painel usam as mesmas tabelas do Supabase.

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

Crie `.env.local` a partir de `.env.example` e preencha a URL e a chave pública anon antes de testar login. `.env.local` não deve ser versionado.

```bash
npm install
npm run dev
```

## Supabase

1. Aplique os arquivos em `supabase/migrations` na ordem indicada, incluindo `0013_admin_access_and_product_editor.sql`.
2. Crie o primeiro usuário em Supabase Dashboard → Authentication → Users.
3. Execute `docs/bootstrap-admin.sql` no SQL Editor, substituindo `EMAIL_COMPLETO` pelo e-mail integral. A mensagem anterior com `admvg123@g...` está truncada e não identifica uma conta.
4. Use uma senha temporária forte de pelo menos 8 caracteres; o valor `12345` é fraco e curto para a validação desta aplicação. Na primeira entrada, o painel exigirá a troca de senha.
5. Para criar usuários pela interface, copie a chave `service_role`/`secret` do Supabase para `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` e no ambiente de produção. Essa chave é exclusivamente de servidor, nunca use o prefixo `NEXT_PUBLIC_` e não a envie por chat.

Não há cadastro público. Não coloque chaves secretas no navegador ou no repositório. A autorização administrativa deve ser verificada no servidor e reforçada pelas políticas do banco.

## Regras e decisões de negócio

- O WhatsApp oficial é (81) 3204-9313.
- O cliente não precisa criar conta para pedir orçamento.
- Produtos e descrições de exemplo devem ser editáveis pela equipe.
- Adesivos: Vinil R$ 85/m² e mínimo R$ 35; Transparente R$ 95/m² e mínimo R$ 45; Fosco R$ 95/m² e mínimo R$ 45.
- Fórmula proposta: largura × altura em m² × preço/m², respeitando o mínimo por material. Unidade das medidas ainda precisa ser confirmada; sugestão: centímetros.
- Medidas, corte/sem corte e arquivo são obrigatórios para adesivos. Formatos informados: PNG, PDF e CDR. Limite técnico de upload precisa ser definido antes da produção.
- Pagamento, frete e conclusão serão acertados pelo WhatsApp no MVP. O acompanhamento do pedido pelo cliente fica para fase futura.
- Administradores gerenciam produtos, usuários e categorias; funcionários podem criar e editar produtos, preços, fotos e opções, mas não excluir produtos nem gerenciar usuários; clientes não acessam o painel.

## Verificações

- `npm run lint`: análise estática do código.
- `npm run build`: compilação de produção.

## Vitrine de demonstração

Antes de aplicar as migrações, a vitrine usa conteúdo de demonstração para permitir revisar o layout. Depois que o banco estiver configurado, categorias e produtos ativos serão lidos do Supabase. O conteúdo inicial de exemplo está em `0003_catalog_examples.sql`; os preços de adesivo usam apenas os valores fornecidos pelo negócio e os demais produtos ficam para orçamento manual.

Use `npm run dev` e abra `http://localhost:3000` para navegar na página inicial, filtrar o catálogo, abrir categorias e consultar páginas individuais dos produtos.

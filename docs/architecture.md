# Arquitetura inicial — VG Multiservice

## Componentes

```text
Navegador
   │ HTTPS
   ▼
Aplicação Next.js (vitrine, formulários, painel e lógica de servidor)
   ├── Supabase Auth: contas da equipe
   ├── PostgreSQL: catálogo, leads, solicitações e histórico
   ├── Supabase Storage privado: arquivos ligados às solicitações
   ├── Link wa.me: resumo para atendimento humano
   └── Provedor de e-mail: confirmação ao cliente (a definir)
```

## Decisões e limites

- Uma aplicação Next.js reduz a quantidade de serviços e deploys a manter no MVP.
- A área `/admin` é renderizada por requisição, verifica token e perfil no servidor e não entra em cache público.
- O servidor recalcula estimativas a partir dos dados cadastrados; nunca confia no preço enviado pelo navegador.
- A autenticação identifica funcionários. A autorização (o que cada perfil pode fazer) é aplicada no servidor e reforçada por políticas no banco.
- Arquivos ficam em bucket privado; o acesso é liberado a pessoal autenticado por links temporários ou operações server-side autorizadas.
- As políticas RLS do Supabase (regras no banco que limitam quais linhas cada usuário pode acessar) devem ser ativadas e revistas antes de conectar dados de produção.
- WhatsApp será aberto pelo navegador com texto preenchido. Isso não envia uma mensagem silenciosamente; o usuário precisa confirmar o envio no WhatsApp.
- Sem Redis, filas, WebSockets, pagamentos ou API oficial do WhatsApp no MVP.

## Status configuráveis

Os estados iniciais são linhas da tabela `quote_statuses`, não um tipo fixo do PostgreSQL. O administrador poderá ajustar os rótulos, a ordem e a ativação; orçamentos guardam um código estável para não perder histórico quando um rótulo mudar.

## Precificação de adesivos — proposta inicial

Dados informados pelo negócio:

| Material | Preço por m² | Mínimo informado |
|---|---:|---:|
| Vinil | R$ 85,00 | R$ 35,00 |
| Transparente | R$ 95,00 | R$ 45,00 |
| Fosco | R$ 95,00 | R$ 45,00 |

Fórmula proposta: área em m² × preço por m²; aplicar como piso o mínimo do material quando o subtotal for menor. A3 será explicado como referência de formato mínimo. Confirmar unidade de entrada (sugestão: cm) e validar a regra do mínimo antes de publicar calculadora.

Obrigatórios para adesivos: largura, altura, escolha corte/sem corte e arquivo. Tipos solicitados: PNG, PDF e CDR. Sem máximo comercial foi informado; deve ser definido um limite técnico seguro por requisição/armazenamento antes de aceitar uploads em produção.

## Funções administrativas

- `admin`: gestão completa.
- `staff`: pode inserir produto e preço, mas não pode alterar nem excluir o registro depois de criado. Pode tratar orçamentos conforme regra a detalhar.

## Próximas etapas

1. Aplicar as migrações ao projeto Supabase e criar o perfil do primeiro administrador.
2. Concluir o painel de produtos/categorias, com controle de edição por perfil.
3. Implementar a solicitação de orçamento, cálculo de adesivo e upload seguro após confirmar os limites técnicos.
4. Implementar gestão dos leads/orçamentos, e-mail ao cliente e handoff para WhatsApp.

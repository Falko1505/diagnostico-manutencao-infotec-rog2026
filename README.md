# Diagnóstico de Maturidade em Manutenção — Infotec Brasil / ROG.e 2026

Aplicação online do Diagnóstico de Manutenção.

## Fluxo

1. Visitante responde 8 perguntas.
2. A aplicação calcula score (0–24), percentual, perfil e 4 dimensões.
3. Visitante informa dados e consentimento LGPD.
4. O payload é salvo localmente antes do envio.
5. A função segura grava o diagnóstico, envia a conversão ao RD Station e solicita o e-mail.
6. O resultado abre em uma URL portátil e pode ser compartilhado ou salvo em PDF.

## Arquivos principais

- `index.html` — diagnóstico online.
- `app.js` — perguntas, cálculo, formulário, fila offline e envio.
- `result.html` / `result.js` — resultado compartilhável e impressão/PDF.
- `config.js` — URL pública da função segura.
- `supabase/functions/submit-diagnostic/index.ts` — backend seguro.
- `supabase/migrations/202609190001_create_diagnostics.sql` — tabela de diagnósticos.

## Configuração do endpoint

Depois de publicar a Edge Function, edite `config.js`:

```js
window.INFOTEC_CONFIG = {
  submitEndpoint: "https://SEU-PROJETO.supabase.co/functions/v1/submit-diagnostic"
};
```

## Secrets da função

RD Station:
- `RD_API_KEY`
- `RD_CONVERSION_IDENTIFIER` (default: `quiz-diagnostico-manutencao-rog2026`)
- `RD_TRAFFIC_SOURCE` (default: `diagnostico-manutencao-online`)

E-mail:
- `RESEND_API_KEY`
- `EMAIL_FROM` (ex.: `Infotec Brasil <diagnostico@dominio-validado.com.br>`)

Banco:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Campos personalizados do RD

Configure com o **api_identifier real** dos campos existentes no RD:

- `RD_CF_SEGMENTO`
- `RD_CF_SCORE`
- `RD_CF_MATURIDADE`
- `RD_CF_PERFIL`
- `RD_CF_DIAGNOSTIC_ID`
- `RD_CF_DIM_1` a `RD_CF_DIM_4`
- `RD_CF_Q1` a `RD_CF_Q8`

Campos não configurados são simplesmente omitidos do payload.

## PDF

O botão **Salvar resultado em PDF** chama a impressão nativa do navegador com uma folha limpa, sem os controles da interface. No celular, o usuário pode salvar/compartilhar como PDF usando as opções do sistema.

## Segurança

Nenhuma chave do RD Station, serviço de e-mail ou banco fica no front-end.

## Próximo passo

Importar este repositório no Lovable, conectar/ativar o backend, aplicar a migration, publicar a função, cadastrar os secrets e configurar `config.js`.

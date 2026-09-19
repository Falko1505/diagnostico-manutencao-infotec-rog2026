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
- `RD_TRAFFIC_SOURCE` (default: `ROG.e 2026 / Diagnóstico Online`)

E-mail:
- `RESEND_API_KEY`
- `EMAIL_FROM` (ex.: `Infotec Brasil <diagnostico@dominio-validado.com.br>`)

Banco:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Campos personalizados do RD

O backend já contém como padrão o **api_identifier real** dos campos da conta Infotec Brasil, auditados em 19/09/2026. As variáveis abaixo são overrides opcionais caso algum identificador mude:

- `RD_CF_EMAIL_CORPORATIVO=cf_e_mail_corporativo`
- `RD_CF_SEGMENTO=cf_segmento`
- `RD_CF_ORIGEM=cf_origem`
- `RD_CF_SCORE=cf_diagnostico_rog_e_2026_score_total`
- `RD_CF_MATURIDADE=cf_diagnostico_rog_e_2026_maturidade`
- `RD_CF_PERFIL=cf_diagnostico_rog_e_2026_perfil`
- `RD_CF_DIAGNOSTIC_ID=cf_diagnostico_rog_e_2026_id`
- `RD_CF_CONSENTIMENTO=cf_diagnostico_rog_e_2026_consentimento_lgpd`
- `RD_CF_RESULT_URL=cf_diagnostico_rog_e_2026_url_individual_do_resultado`
- `RD_CF_DIM_1=cf_diagnostico_rog_e_2026_estrategia_e_cultura`
- `RD_CF_DIM_2=cf_diagnostico_rog_e_2026_planejamento_e_controle_da_manu`
- `RD_CF_DIM_3=cf_diagnostico_rog_e_2026_dados_e_confiabilidade`
- `RD_CF_DIM_4=cf_diagnostico_rog_e_2026_tecnologia_e_preditiva`
- `RD_CF_Q1=cf_diagnostico_rog_e_2026_resposta_q1` até `RD_CF_Q8=cf_diagnostico_rog_e_2026_resposta_q8`

Campos não configurados são simplesmente omitidos do payload.

O backend também registra a base legal de comunicação como consentimento concedido e envia as tags `ROG.e 2026` e `Diagnóstico de Manutenção`.

## E-mail automático pelo RD Station

Crie um fluxo de Automação de Marketing com entrada pela conversão `quiz-diagnostico-manutencao-rog2026`. O botão principal do e-mail deve usar o campo `Diagnóstico ROG.e 2026 — URL individual do resultado` como destino. O envio opcional via Resend permanece disponível como contingência; deixe `RESEND_API_KEY` e `EMAIL_FROM` sem configuração quando o fluxo do RD estiver ativo para evitar envio duplicado.

## PDF

O botão **Salvar resultado em PDF** chama a impressão nativa do navegador com uma folha limpa, sem os controles da interface. No celular, o usuário pode salvar/compartilhar como PDF usando as opções do sistema.

## Segurança

Nenhuma chave do RD Station, serviço de e-mail ou banco fica no front-end.

## Próximo passo

Conectar/ativar o projeto Supabase, aplicar a migration, publicar a função, cadastrar os secrets e configurar `config.js`.

# GIE360 — migração para produção

Esta ramificação prepara o backend sem substituir nem redesenhar o `index.html` atual.

## Primeira etapa

- confirmar a conexão do Vercel com o Neon;
- criar a estrutura inicial para persistir os dados;
- manter a interface atual intacta;
- preparar autenticação antes de habilitar gravações.

O Vercel deve fornecer `DATABASE_URL` pela integração Neon. Segredos nunca devem ser enviados ao GitHub.

Após a implantação de pré-visualização, `/api/health` deve retornar:

```json
{ "ok": true, "database": "connected" }
```

Em seguida: revisar o esquema, integrar Neon Auth e migrar cadastro, agenda, base de apoio e relatórios módulo por módulo.

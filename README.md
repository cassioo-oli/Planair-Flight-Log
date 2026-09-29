# Planair Ponto

Sistema web de ponto. Ele funciona no computador e no celular pelo navegador; depois pode virar aplicativo instalável (PWA) sem reescrever a interface.

## Instalação no VS Code

1. Instale o **Node.js LTS**, o **MySQL Server** e o **MySQL Workbench**.
2. Abra a pasta `app-ponto` no VS Code.
3. No Workbench, abra `database/schema.sql` e clique no ícone do raio para executá-lo. Isto cria o banco e um funcionário de teste.
4. Duplique `.env.example`, renomeie a cópia para `.env` e preencha `DB_PASSWORD` com a senha do MySQL. Nunca publique esse arquivo.
5. No terminal do VS Code, rode `npm install` e depois `npm run dev`.
6. Abra `http://localhost:3000`.

## Uso

- O gestor cadastra pessoas em **Administração** e informa a carga em minutos: 480 = 8 horas; 420 = 7 horas.
- A pessoa faz as quatro marcações em sequência. O PDF usa os dois períodos trabalhados e mostra previsto, realizado e saldo.
- A aba administrativa recebe justificativas, abre o PDF e aprova ou recusa com observação. Também registra ocorrências, como saída autorizada.
- Ao cadastrar, defina os quatro horários previstos. Cada marcação fica disponível entre **uma hora antes e uma hora depois** do seu horário previsto. Passado esse período, o sistema bloqueia a batida e pede registro de ocorrência ao administrador.

## Antes de uso real

Este é um protótipo funcional. Acrescente login/senhas com perfis de funcionário e administrador, HTTPS, backup, auditoria de alterações e validação jurídica/trabalhista (incluindo LGPD e regras brasileiras de controle de ponto) antes de colocá-lo em produção. A tela de Administração ainda não possui autenticação e deve ficar protegida antes do uso por pessoas reais.

# Attend Church - Automatização de Relatórios

Aplicação Node.js que automatiza a coleta de dados de frequência e indicadores das alas da Igreja através do sistema LCR (Leader and Clerk Resources) e salva os dados em planilhas do Google Sheets.

## 🚀 Funcionalidades

- **Coleta de Frequência das Alas**: Extrai dados de frequência sacramental de múltiplas alas
- **Indicadores da Área**: Coleta dados de batismos, recomendações ao templo e missionários no campo
- **Integração com Google Sheets**: Salva automaticamente os dados em planilhas configuráveis
- **Agendamento Automático**: Executa coletas em horários programados
- **Multi-unidade**: Suporta múltiplas alas/estacas simultaneamente

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Conta Google** com acesso ao Google Sheets
- **Credenciais LCR** (Leader and Clerk Resources)
- **Google Chrome** (para web scraping via Puppeteer)

## 🔧 Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd attend_church
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Crie uma Conta de Serviço do Google

Para integrar com o Google Sheets, você precisa criar uma conta de serviço:

#### Passo a passo:

1. **Acesse o Google Cloud Console**
   - Vá para [console.cloud.google.com](https://console.cloud.google.com)
   - Faça login com sua conta Google

2. **Crie um novo projeto (se necessário)**
   - Clique em "Select a project" → "New Project"
   - Dê um nome ao projeto (ex: "church-automation")
   - Clique em "Create"

3. **Ative a API do Google Sheets**
   - No menu lateral, vá em "APIs & Services" → "Library"
   - Pesquise por "Google Sheets API"
   - Clique em "Google Sheets API" → "Enable"

4. **Crie credenciais de conta de serviço**
   - Vá em "APIs & Services" → "Credentials"
   - Clique em "Create Credentials" → "Service Account"
   - Preencha:
     - **Service Account Name**: `church-automation`
     - **Service Account ID**: `church-automation`
     - **Description**: `Automação para relatórios da igreja`
   - Clique em "Create and Continue"

5. **Configure permissões (opcional)**
   - Na tela "Grant this service account access to project"
   - Você pode pular esta etapa clicando em "Continue"

6. **Gere a chave da conta de serviço**
   - Clique em "Create Key"
   - Selecione "JSON"
   - Clique em "Create"
   - O arquivo JSON será baixado automaticamente

7. **Extraia as informações necessárias**
   - Abra o arquivo JSON baixado
   - Copie os valores de:
     - `client_email`
     - `private_key`

### 4. Configure as planilhas do Google Sheets

1. **Crie suas planilhas no Google Sheets**
   - Uma para frequência das alas
   - Uma para indicadores da área (ou use a mesma planilha)

2. **Compartilhe com a conta de serviço**
   - Abra cada planilha
   - Clique em "Share" (Compartilhar)
   - Adicione o email da conta de serviço (valor de `client_email`)
   - Dê permissão de "Editor"

3. **Obtenha os IDs das planilhas**
   - O ID está na URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

### 5. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas informações reais.

## 📊 Variáveis de Ambiente

### Credenciais Google Sheets

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `CLIENT_EMAIL` | Email da conta de serviço | Arquivo JSON baixado do Google Cloud Console |
| `PRIVATE_KEY` | Chave privada da conta de serviço | Arquivo JSON baixado (manter quebras de linha `\n`) |

### Credenciais LCR

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `LCR_LOGIN` | Usuário para acessar o sistema LCR | `joao.silva` |
| `LCR_PASSWORD` | Senha do sistema LCR | `minhasenha123` |

### Configuração das Unidades

| Variável | Descrição | Formato |
|----------|-----------|---------|
| `WARD_CODES` | Lista das alas/ramos com códigos | Array JSON: `[{"name":"Ala Central","code":"123456"}]` |
| `STAKE_INFO` | Informações da estaca | JSON: `{"name":"Estaca Central","code":"999888"}` |

#### Como obter os códigos das alas:
1. Acesse o sistema LCR
2. Vá para a página de frequência da ala
3. Na URL você verá: `...unitNumber=123456`
4. O número após `unitNumber=` é o código da ala

### IDs das Planilhas

| Variável | Descrição | Como Obter |
|----------|-----------|------------|
| `AREA_SHEET_ID` | ID da planilha de indicadores | URL da planilha: `docs.google.com/spreadsheets/d/[ID]/edit` |
| `ATTENDANCE_SHEET_ID` | ID da planilha de frequência | URL da planilha: `docs.google.com/spreadsheets/d/[ID]/edit` |

## 🏃‍♂️ Como Executar

### Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Produção

```bash
# Build da aplicação
npm run build

# Executar versão compilada
npm start
```

## 📊 Estrutura dos Dados Coletados

### Indicadores da Área
A aplicação coleta três tipos de indicadores e salva em abas separadas:

#### Aba "baptism"
- **ward**: Nome da ala
- **month**: Mês (número)
- **count**: Quantidade de batismos
- **updatedAt**: Data da última atualização

#### Aba "missionary"
- **ward**: Nome da ala
- **month**: Mês (número)
- **quantity**: Quantidade de missionários no campo
- **updatedAt**: Data da última atualização

#### Aba "recommendations"
- **ward**: Nome da ala
- **month**: Mês (número)
- **count**: Quantidade de recomendações ao templo
- **updatedAt**: Data da última atualização

### Frequência das Alas
- **Aba por ala**: Cada ala terá sua própria aba (identificada pelo código da ala)
- **Colunas**: Ward, Month, Day, Attendance
- **Dados**: Frequência diária de cada ala

## 🔄 Lógica de Atualização

A aplicação implementa uma lógica inteligente de atualização:

- **Novos dados**: Se não existe registro para o mês/ala, adiciona novo registro
- **Dados existentes**: Se o valor coletado for maior que o existente, atualiza
- **Preservação**: Não sobrescreve dados com valores menores (evita perda de dados)

## 🔒 Segurança

- **Nunca commite** o arquivo `.env` no repositório
- Mantenha suas credenciais LCR seguras
- Use variáveis de ambiente em produção
- Revogue chaves de API comprometidas
- A aplicação usa headless browser para maior segurança

## 🐛 Troubleshooting

### Problemas comuns:

#### 1. Erro de autenticação Google
```
Error: No key or keyFile set
```
**Solução**: Verifique se `CLIENT_EMAIL` e `PRIVATE_KEY` estão corretos no `.env`

#### 2. Planilha não acessível
```
Error: The caller does not have permission
```
**Solução**: Compartilhe a planilha com o email da conta de serviço (`CLIENT_EMAIL`)

#### 3. Erro de login LCR
```
Login failed or timeout
```
**Solução**: Verifique `LCR_LOGIN` e `LCR_PASSWORD` no `.env`

#### 4. Dependências do Chrome (Linux)
```bash
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
  libxtst6 ca-certificates fonts-liberation libappindicator1 \
  libnss3 lsb-release xdg-utils wget
```

#### 5. Problemas de timeout
Se a aplicação está falhando por timeout, edite `src/helpers/functions.ts` e aumente o valor do timeout.

## 📁 Estrutura do Projeto

```
attend_church/
├── src/
│   ├── main.ts                 # Ponto de entrada da aplicação
│   ├── area_indicators.ts      # Coleta de indicadores da área
│   ├── wards_attendance.ts     # Coleta de frequência das alas
│   └── helpers/
│       ├── constants.ts        # Constantes e headers das planilhas
│       ├── functions.ts        # Funções utilitárias
│       └── models.ts          # Tipos TypeScript
├── .env                       # Variáveis de ambiente (não commitado)
├── .env.example              # Exemplo de configuração
├── package.json              # Dependências e scripts
└── README.md                 # Este arquivo
```

## 📝 Logs e Monitoramento

A aplicação exibe logs detalhados no console:
- 📊 **Início**: `> Starting Area Indicators...`
- 🌐 **Navegação**: `Going to baptism page...`
- 💾 **Salvamento**: `Saving baptism info...`
- ✅ **Conclusão**: `> Process to save Area Indicators is Done!`

## 🔄 Adicionando Novas Alas

Para adicionar uma nova ala:

1. **Obtenha o código da ala** no sistema LCR
2. **Atualize a variável `WARD_CODES`** no `.env`:
   ```json
   WARD_CODES='[
     {"name":"Ala Existente","code":"123456"},
     {"name":"Nova Ala","code":"789012"}
   ]'
   ```
3. **Reinicie a aplicação**

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `package.json` para mais detalhes.

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro
2. Confirme todas as variáveis de ambiente
3. Teste as credenciais manualmente
4. Verifique se as planilhas estão acessíveis
5. Abra uma issue no repositório

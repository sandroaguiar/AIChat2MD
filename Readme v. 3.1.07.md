# Universal AI Chat Exporter

Userscript para **Tampermonkey** desenvolvido para extrair conversas completas das principais plataformas de IA (**ChatGPT**, **Claude** e **Perplexity**) e exportá-las formatadas em arquivos **Markdown (`.md`)**.

## 🚀 O que foi realizado até a versão 3.1.07

- **Injeção Universal e Posicionamento Fixo:** Botão flutuante integrado de forma segura (`right: 170px`, `bottom: 20px`) para evitar colisões com as barras de rolagem nativas de cada interface.
- **Identidade Visual por Plataforma:** Cores de destaque dedicadas na interface do botão (Verde para ChatGPT, Salmão para Claude e Ciano para Perplexity).
- **Suporte Robusto ao ChatGPT:** Extração completa da árvore de mensagens via API interna (`/backend-api/conversation`), com suporte a timestamps granulares, anexos e limpeza de artefatos.
- **Suporte Robusto ao Claude:** Extração de conversas via API de conversações por organização (`/api/organizations/...`), preservando a ordem das mensagens, metadados e arquivos anexados.
- **Integração Completa com o Perplexity:**
  - Extração de threads via API interna (`/rest/thread/...`) com paginação automática.
  - Mapeamento refinado de **timestamps por mensagem** (com suporte a fallback inteligente para a data de criação global do thread).
  - Tratamento de títulos e limpeza estrutural de blocos de texto e equações (LaTeX).
- **Padronização de Saída em Markdown:** Cabeçalhos limpos contendo metadados de título, data, URL de origem e separadores padronizados entre as mensagens do usuário e da IA.

## 📦 Histórico de Versões Recentes

- **v3.1.07:** Adicionado fallback inteligente para timestamps globais e refinamento do adaptador do Perplexity.
- **v3.1.06:** Ajustes iniciais de mapeamento de datas individuais e formatação de links no Perplexity.
- **v3.1.00 - v3.1.05:** Estabelecimento da base universal, posicionamento seguro do botão flutuante e isolamento de versões.

## 🛠️ Como Instalar e Usar

1. Instale a extensão **Tampermonkey** no seu navegador.
2. Crie um novo script e cole o código da versão mais recente (`Universal AI Chat Exporter`).
3. Acesse uma conversa salva em qualquer uma das plataformas suportadas (**ChatGPT**, **Claude** ou **Perplexity**).
4. Clique no botão flutuante **📥 Export MD** (ou utilize o comando de menu do Tampermonkey) para baixar o seu arquivo compactado em Markdown.

## 📄 Licença

Distribuído sob a licença **MIT**.
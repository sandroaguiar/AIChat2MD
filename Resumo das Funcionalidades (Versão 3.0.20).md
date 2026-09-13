# Universal AI Chat Exporter 🚀
*Exportador de conversas do ChatGPT e Claude para arquivos Markdown limpos e estruturados.*

---

## 📋 Resumo das Funcionalidades (Versão 3.0.20)

Esta versão foi desenvolvida para garantir estabilidade, tratamento de anexos e organização de timestamps nas plataformas **ChatGPT** e **Claude**.

### 1. Suporte a Timestamps Dinâmicos por Mensagem
* Inserção e formatação automática da data e hora exata (`YYYY-MM-DD HH:MM`) ao lado de cada remetente, baseada nos metadados nativos de criação de cada mensagem obtidos diretamente via API.

### 2. Tratamento Avançado de Anexos e Arquivos
* Rotina dedicada para varrer e capturar anexos, imagens e arquivos enviados nas interações (tanto no ChatGPT quanto no Claude).
* Conversão automática dos ponteiros de arquivos para o formato de links limpos compatíveis com o ecossistema do Obsidian (`[[NomeDoArquivo]]`).

### 3. Extração Direta via API (Sem Travamentos)
* Utilização de requisições assíncronas diretas para os endpoints de histórico das plataformas, eliminando os problemas de travamento e lentidão causados pelo parsing de DOM em chats muito longos.

### 4. Robustez e Experiência de Uso (UX)
* **Interface Flutuante Adaptativa:** Botão flutuante inteligente que detecta automaticamente a plataforma ativa e ajusta a identidade visual (verde para ChatGPT e laranja/terracota para Claude).
* **Prevenção de Erros de Download:** O botão de exportação desativa temporariamente o clique e exibe um indicador de progresso durante o salvamento, evitando a geração de arquivos duplicados ou vazios.
* **Comando Rápido:** Suporte integrado ao menu de contexto do gerenciador de scripts via atalho do Tampermonkey.

---

## 🛠️ Instalação e Uso

1. Instale um gerenciador de usuários compatível (como **Tampermonkey** ou **Violentmonkey**).
2. Crie um novo script e cole o código da versão `3.0.20`.
3. Navegue até uma conversa salva no [ChatGPT](https://chatgpt.com) ou no [Claude](https://claude.ai) e clique no botão **📥 Export MD** no canto superior da tela.

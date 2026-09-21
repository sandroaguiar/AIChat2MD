# 📋 Changelog - Universal AI Chat Exporter

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
  
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).



# Histórico de versões — série 3.8.x

Entradas da **3.8.14** à **3.8.34**, da mais recente para a mais antiga. 

**Regra de compatibilidade da série:** o código do ChatGPT não foi alterado desde a 3.7.4; o do Perplexity só mudou na 3.8.24 (horário das mensagens); o do Claude só mudou nas 3.8.29 e 3.8.30 (arquivos, imagens e formato da conversa). A posição do botão flutuante (`bottom: 20px; right: 140px`) não mudou.

## 3.8.34 — Gemini: imagens geradas com a conta correta

- O teste da 3.8.33 mostrou HTTP 403 em todas as variantes do endereço da imagem. A página do Gemini exibe as mesmas imagens com `?authuser=N` no endereço (N é o número da conta, o mesmo de `/u/N/` na URL da página), o que faltava nos pedidos do script.
- O download agora tenta, em ordem, `=s0`, `=d` e `=s1600` (todos com `?authuser=N`) e, por último, o endereço que a própria página usou para exibir a imagem. Só aceita resposta que seja imagem. Se todas as tentativas falharem, o aviso lista o resultado de cada uma.
- `@noframes` no cabeçalho: o script deixa de rodar em janelas internas (*iframes*), o que causava o aviso falso "Abra uma conversa salva no Gemini" ao usar os comandos do menu.
- O comando **🔍 Gemini: testar download de imagens** passa a testar esses mesmos endereços (o teste com Referer e com *fetch* na página foi retirado, porque não ajudou).
- O navegador abre **caixas de diálogo para salvar** as imagens com os nomes usados nos links do `.md. O erro HTTP 403 anterior foi resolvido pelo acréscimo de `?authuser=N`.
- No Obsidian, com o `.md` e as imagens no cofre aparecem no corpo da nota, no lugar certo. O cabeçalho mostra `Exportador: AI Chat to MD 3.8.34`, e as mensagens têm hora real.
- Os blocos de código do Gemini saem como ` ```python ` (com destaque de sintaxe no Obsidian). O código executado ainda fica visível antes do gráfico.
- Os arquivos gerados que não são imagens (`.xlsx` e `.js`) saem como link `📎 **[[nome]]**`, sem download automático.

## 3.8.33 — Gemini: teste de download de imagens

- Novo comando no menu, só no Gemini: **🔍 Gemini: testar download de imagens**. Testa variações do pedido e salva só os códigos de resposta em um `.json`.
- Resultado do teste: HTTP 403 em todas as variantes (original, `=s0`, `=d`, `=s1024`, com e sem Referer), e o *fetch* na página foi bloqueado. A comparação com as imagens da própria página revelou o parâmetro `?authuser=N`.

## 3.8.32 — Gemini: download automático das imagens geradas

- As imagens geradas pelo Gemini são baixadas pelo script (via `GM_xmlhttpRequest`) com o mesmo nome usado no link do Markdown, junto do `.md`. Motivo: o Gemini salva as imagens baixadas pelo site com um nome aleatório (`Gemini_Generated_Image_…`), diferente do nome interno da API.
- `@connect` para `lh3.googleusercontent.com` e `googleusercontent.com`.
- Respeita a resposta à pergunta sobre anexos: com **Cancelar**, as imagens não são baixadas. Se alguma falhar, o `.md` é salvo e um aviso lista as imagens e o motivo.
- O dado interno `thought_signature_….pb` deixou de aparecer como link.

## 3.8.31 — Gemini: imagens e arquivos gerados

- No texto das respostas, imagens e arquivos gerados aparecem só como marcadores (`http://googleusercontent.com/image_generation_content/…`, `[http://googleusercontent.com/generated_image/…]`, `[file-tag: code-generated-file-…]`). Os dados do arquivo (nome e tipo) ficam em `block[12]` da resposta. Cada marcador é trocado por `![[nome]]` (imagens) ou `📎 **[[nome]]**` (demais arquivos), na posição em que aparecia; arquivos sem marcador vão ao fim da resposta.
- Os blocos de código executados pelo Gemini, gravados como ` ```python?code_reference&code_event_index=1 `, passam a sair como ` ```python ` (e ` ```text ` para a saída).

## 3.8.30 — Claude: arquivos apresentados e conversa em formato completo

- A exportação do Claude passa a pedir a conversa com `?tree=true&rendering_mode=messages&render_all_tools=true` (com volta ao formato simples se a API recusar). A resposta vem em blocos: `text`, `thinking`, `tool_use` e `tool_result`.
- Os arquivos que o Claude apresentou ao usuário (resultado da ferramenta `present_files`, itens `local_resource`) viram `📎 **[[nome]]**` (ou `![[nome]]` para imagens), na posição em que foram apresentados.
- Raciocínio interno (`thinking`) e chamadas de ferramenta (bash, memória etc.) não entram no arquivo.

## 3.8.29 — Claude: arquivos enviados

- Imagens e arquivos enviados pelo usuário (`files`) saem como `![[nome]]` e `📎 **[[nome]]**`, no início da mensagem. Anexos de texto (`attachments`) passam ao mesmo formato (antes: `📎 **Anexo:** [[nome]]`). Texto colado, sem nome, sai como `📎 **Texto colado** *(N KB)*`, sem o conteúdo.
- O diagnóstico do Claude passa a pedir o formato completo da conversa e a registrar qual formato foi usado.

## 3.8.28 — Novo nome, links de atualização e diagnóstico do Claude para conversas longas

- O script passa a se chamar **AIChat2MD** (AI Chat to MD), com `@namespace` fixo `https://github.com/sandroaguiar/AIChat2MD`, `@description:pt-BR` e o ícone no repositório `AIChat2MD` (edições do autor).
- `@downloadURL` e `@updateURL` apontam para `AIChat2MD.user.js` na raiz do repositório (ramificação `main`).
- O diagnóstico do Claude passa a funcionar em conversas longas: salva um censo dos tipos de conteúdo da conversa inteira e a estrutura de algumas mensagens com blocos, arquivos, anexos ou citações.

## 3.8.27 — Diagnóstico do Claude

- Novo comando no menu, só no claude.ai: **🔍 Claude: salvar diagnóstico**. Baixa um `.json` com a estrutura da conversa (textos cortados, identificadores trocados por marcas).
- Revelou que a requisição usada até então só trazia o texto achatado de cada mensagem, mais as listas `files` e `attachments`.

## 3.8.26 — Ícone: endereço pela ramificação `main`

- O `@icon` passa a apontar para `.../Universal-AI-Chat-Exporter2MD/main/assets/icon-128.png`, sem o código do commit. Se o arquivo for substituído no repositório, o novo ícone aparece sozinho no Tampermonkey.
- Nenhuma alteração de código além do cabeçalho e da versão.

## 3.8.25 — Ícone próprio

- O `@icon` deixa de usar o favicon do Perplexity e passa a usar um ícone próprio: balão de conversa com o símbolo do Markdown, em magenta `#FB43FB` sobre borda roxo azulado `#5A2BF0`.
- Arquivos do ícone no repositório: `assets/icon-128.png`, `assets/icon-64.png` e `assets/icon.svg`.
- Nenhuma alteração de código além do cabeçalho e da versão.

## 3.8.24 — Perplexity: data da conversa no cabeçalho

- O Perplexity deixa de repetir a mesma hora em todas as mensagens.
- A data única que a API informa (`thread_metadata.created_at`) passa a aparecer no cabeçalho: `**Conversa em:** AAAA-MM-DD HH:mm`. Se a API não trouxer essa data, o cabeçalho volta a mostrar `**Data:**` com a data da exportação.

## 3.8.23 — Gemini: anexos

- Anexos enviados pelo usuário são exportados no início da mensagem: imagens como `![[nome.png]]` e outros arquivos como `📎 **[[nome.pdf]]**`, o mesmo formato do Lumo.
- Mensagens só com anexo, sem texto, também são exportadas.
- Se o nome do anexo vier sem extensão, a extensão do tipo do arquivo é acrescentada (PDF, PNG, JPEG, WebP, GIF, TXT, MD, CSV, JSON, HTML).
- As marcas internas `[cite: N]` são removidas dos textos das respostas.
- Estrutura usada: anexos novos da mensagem em `turn[2][0][4]`, descoberta com o diagnóstico da 3.8.22.

## 3.8.22 — Gemini: diagnóstico

- Novo comando no menu do Tampermonkey, só no Gemini: **🔍 Gemini: salvar diagnóstico de anexos**. Baixa um `.json` com a estrutura dos dados da conversa (textos cortados em 60 caracteres, links em 90, até 30 turnos).
- A exportação normal não mudou.

## 3.8.21 — Grok: sem hora falsa por mensagem

- O Grok deixa de repetir a hora da exportação em todas as mensagens.
- O cabeçalho passa a mostrar **"Exportado em"** com a data e a hora da exportação, como no Lumo.

## 3.8.20 — Lumo: só mensagens reais

- Apenas blocos com `data-message-id` contam como mensagem. Deixam de entrar o aviso "Este chat expira em 2 dias", a área de digitação e o seletor de modelo.
- Se a página não tiver nenhum `data-message-id`, o comportamento anterior é mantido como reserva.

## 3.8.19 — Lumo: conversa completa

- Correção do arquivo que terminava antes do fim da conversa: uma mensagem que apenas mencionava "Conversa criptografada" era descartada pelo filtro de textos de interface (problema herdado da 3.7.4).
- Os filtros de texto de interface passam a valer só para blocos sem `data-message-id`.

## 3.8.18 — Lumo: sem hora falsa por mensagem

- O Lumo deixa de repetir a hora da exportação em todas as mensagens. O DOM do Lumo e os identificadores das mensagens (UUID versão 4) não trazem horário.
- O cabeçalho passa a mostrar **"Exportado em"** com a data e a hora da exportação.

## 3.8.17 — Lumo: anexos

- Os cartões de anexo do Lumo ficam fora do bloco de texto da mensagem (`.lumo-markdown`). Agora são lidos: imagens como `![[nome]]` e demais arquivos como `📎 **[[nome]]**`.
- O campo de digitação ("Pergunte qualquer coisa ao Lumo") deixa de ser exportado como mensagem.

## 3.8.16 — Lumo: restauração de recursos da 3.6.3

- Reconhecimento de cartões de arquivo por qualquer classe que contenha `file-card`, com link quando a imagem do cartão tiver endereço `blob:` ou `http(s)`. Endereços `data:` são ignorados para não inflar o arquivo.
- Filtros contra textos de interface do Lumo: "Mostrar barra lateral", "Mostrar painel de conhecimento", "Bate-papo atual:" e "Ferramentas" (só em blocos curtos).

## 3.8.15 — Lumo: listas

- Listas numeradas (`<ol>`) saem como `1.`, `2.`, `3.`, respeitando o atributo `start`.
- Listas com marcadores (`<ul>`) saem como `- `, e sublistas são indentadas com 4 espaços.
- Itens com vários parágrafos continuam no mesmo item.

## 3.8.14 — Gemini

- Novo adaptador do Gemini (`gemini.google.com`) via API interna `batchexecute`: RPC `hNvQHb` para a conversa completa e `MaZiqc` para localizar o título.
- Exporta a conversa inteira, com data e hora reais de cada turno e referências como `[N]` mais lista ao final da resposta.
- Botão flutuante azul (`#1a73e8`). No Gemini, o rótulo do botão usa `textContent`, porque a página bloqueia `innerHTML` (Trusted Types); nas demais plataformas o comportamento não mudou.
- Suporte a contas Google múltiplas (`/u/N/`).
- `@match` ampliado com `https://gemini.google.com/*`.

## Pendências conhecidas

- Sanitização de links inoperante: a expressão regular tem `\vert{}` no lugar de `|` e nunca reconhece um link (herdado da 3.7.4).
- A limpeza de texto apaga as palavras `Copiar` e `Copy code` também quando fazem parte do texto real da conversa.
- Gemini: anexos e imagens gerados nas respostas ainda não foram mapeados.
- AI Studio e AI Mode (Google) não têm adaptador.



# Histórico de versões — série 3.7.x


## [3.7.4] - 2026-09-17

### 🛠️ Correções e Ajustes (Grok)

- **Correção no Parser DOM do Grok:** Ajustado o tratamento de nós dentro de blocos de código (`pre` e `code`) para evitar que títulos ou rótulos de interface fossem convertidos incorretamente em títulos Markdown (`#`).
    
      
    
- **Limpeza de Resíduos Visuais:** Implementada remoção automática de textos duplicados ou lixos de interface injetados pelo DOM (como botões de cópia e rótulos de linguagem flutuantes).

      
    

## [3.7.3] - 2026-09-17

### 🚀 Novidades e Mudanças Estruturais

- **Novo Adaptador DOM para o Grok:** Substituição completa da rota de API baseada em requisições de backend do X.com por um extrator direto via DOM (`[x.com/i/grok](https://x.com/i/grok)` e `grok.com`), eliminando erros de requisição (`404` e respostas vazias).
    
      
    
- **Política de Congelamento de Módulos:** Estabelecida a diretriz de blindagem e congelamento total dos adaptadores já estáveis (ChatGPT, Claude, Perplexity e Lumo), garantindo que atualizações em uma plataforma não afetem as demais.
    
      
    

## [3.7.2] - 2026-09-17

### 🔍 Correções Gerais e Estabilidade

- Ajustes de compatibilidade em rotinas de mapeamento de nós e tratamento de caracteres especiais.
    
      
    
- Refinamento na limpeza de textos gerados por IA para preservar blocos de código matemáticos e formatações em LaTeX (`$$` e `$`).
    
      
    

## [3.7.0 / 3.7.1] - 2026-09-17

### ⚙️ Refatoração de Módulos

- Tentativa de unificação estrutural de adaptadores de rede (com posterior revisão de escopo para adotar abordagens isoladas por plataforma).
    
      
    
- Correção de regressões no adaptador do Claude, restaurando integralmente a estabilidade operacional da versão `3.6.3`.




# Histórico de versões — série 3.6.x



## [v3.6.3] - 2026-09-15

### 🚀 Novidades e Melhorias (Lumo)

- **Suporte Inicial ao Lumo (Proton):** Implementação bem-sucedida de um adaptador DOM dedicado para a plataforma Lumo, permitindo a exportação de conversas de forma limpa e estruturada diretamente para Markdown.
    
      
    
- **Tratamento Avançado de Anexos e Links Blob:** Adição de rotinas para capturar imagens e arquivos anexados no chat do Lumo, convertendo-os em links funcionais para visualização e integração fluida no Obsidian.
    
      
    
- **Filtragem Rigorosa de Elementos de Interface (UI):** Refinamento dos seletores de extração para ignorar ruídos textuais da página do Lumo (como botões de painel lateral, menus de navegação, avisos de termos de uso e mensagens de rodapé do sistema).
    
      
    
- **Padronização Visual por Plataforma:** Mantido o sistema de cores customizadas nos botões flutuantes de exportação de acordo com a plataforma utilizada:
    
      
    - 🟢 **ChatGPT:** Verde (`#10a37f`)
        
          
        
    - 🟠 **Claude:** Salmão (`#e07a5f`)
        
          
        
    - 🔵 **Perplexity:** Ciano (`#00bcd4`)
        
          
        
    - 🟣 **Lumo:** Roxo característico do ecossistema Proton (`#6d4aff`)
        
          
        
- **Preservação de Metadados:** Inclusão de carimbos de data/hora individuais por mensagem (`timestamp`), nome da conversa, link direto para a fonte e versão do exportador no cabeçalho do arquivo gerado (`.md`).
    
      
    
- **Sanitização Inteligente:** Conversão e limpeza de blocos de código, formatações matemáticas (LaTeX / MathJax) e remoção de artefatos indesejados da interface web de chat.



Para tornar o **Universal AI Chat Exporter** altamente eficiente e robusto — culminando nesta versão mais recente — trabalhamos em vários pilares técnicos importantes.


## Especificação para a versão 3.6.3

Aqui estão os detalhes específicos do que foi implementado e otimizado no código:

  
- **Arquitetura Híbrida (API + DOM Inteligente):**
    
      
    - Para plataformas como **ChatGPT, Claude e Perplexity**, o script foi projetado para extrair os dados diretamente de suas respectivas APIs/endpoints estruturados, garantindo uma captura extremamente rápida, completa e sem perda de dados textuais em conversas longas.
        
          
        
    - Para o **Lumo**, onde barreiras de segurança e criptografia do ecossistema Proton impedem o acesso direto via API, desenvolvemos um extrator baseado em **DOM** altamente cirúrgico.
        
          
        
- **Tratamento Avançado de Anexos e Links Blob:**
    
      
    - Implementação de uma rotina específica de varredura nos nós de cartões de arquivos (`file-card-group`). O script localiza o link temporário do tipo `blob:` diretamente na tag `img` interna e extrai o nome real do arquivo (`title` ou texto correspondente), formatando-os perfeitamente para o Obsidian no padrão `[📎 Nome do Arquivo](blob:...)`.
        
          
        
- **Filtragem Cirúrgica de Ruídos da Interface (UI):**
    
      
    - Para evitar que elementos estáticos da página poluíssem o arquivo Markdown, criamos uma camada de filtros rígidos que descarta textos irrelevantes da interface do Lumo, tais como botões de navegação (_"Mostrar barra lateral"_, _"Mostrar painel de conhecimento"_), avisos de termos de uso (_"O Lumo pode cometer erros"_), cabeçalhos de status e rodapés.
        
          
        
- **Padronização Visual Contextualizada:**
    
      
    - O botão flutuante de exportação injetado dinamicamente na página possui detecção automática de URL, aplicando uma identidade visual própria e cores dedicadas para cada IA (`#10a37f` para ChatGPT, `#e07a5f` para Claude, `#00bcd4` para Perplexity e `#6d4aff` para o roxo característico do Lumo).
        
          
        
- **Sanitização Inteligente e Conversão de Math/LaTeX:**
    
      
    - O texto bruto extraído passa por um processo de limpeza automatizado que remove artefatos incômodos (como botões _"Copy code"_ repetitivos), além de converter marcações matemáticas padrão para o formato LaTeX compatível (`$$ ... $$` para blocos e `$ ... $` para textos inline), ideal para notas científicas.
        
          
        
- **Rastreabilidade e Metadados Automatizados:**
    
      
    - Inclusão de um cabeçalho padronizado em cada arquivo gerado contendo o título da conversa, a data exata da exportação, o link direto para a fonte e a versão exata do script utilizada, garantindo total organização no seu fluxo de PKM (_Personal Knowledge Management_).
 



# Histórico de versões — série 3.1.x



## [3.1.25] - 2026-09-14

- **Correção de Metadados no Painel:** O campo `@name` do Tampermonkey foi simplificado para evitar caracteres extras/versões longas no cabeçalho, garantindo a exibição limpa e correta no painel de controle do gerenciador.
    
      
    
- **Estabilidade Geral:** Consolidação final de todas as correções de formatação e exportação para ChatGPT, Claude e Perplexity.
    
      
    

## [3.1.24] - 2026-09-14

- **Adição de Metadados no Arquivo Exportado:** Implementação da linha de créditos no topo de cada arquivo `.md` gerado, exibindo explicitamente o nome do exportador e a versão exata utilizada (ex: `| **Exportador:** Universal AI Chat Exporter 3.1.24`).
    
      
    

## [3.1.23] - 2026-09-14

- **Interface Dinâmica por Plataforma:** Aprimoramento da cor e do comportamento do botão flutuante de exportação para se adaptar visualmente de forma automática à identidade visual da IA em uso:
    
      
    - Verde padrão para o ChatGPT.
        
          
        
    - Cor salmão/terracota para o Claude.
        
          
        
    - Tom ciano para o Perplexity.
        
          
        
- **Sanitização Avançada de Links:** Melhorias na limpeza automática de URLs longas, remoção de tokens sensíveis da AWS e padronização de links de referência para manter o Markdown limpo e organizado.


  

## [3.1.22] - Estabilização Atual - 2026-09-13

- **Botão Flutuante Otimizado:** Restauração do texto clássico "Exportar Chat" (removendo o número da versão do corpo do botão para manter a interface mais limpa).
    
      
    
- **Posicionamento Blindado:** Ajuste de layout e garantia de `z-index` (`bottom: 20px`, `right: 180px`, `z-index: 2147483647`) para flutuar perfeitamente sem sobrepor os controles nativos de envio de mensagem.
    
      
    
- **Cores Contextuais:** Manutenção da aplicação automática das cores oficiais de cada plataforma (Verde para ChatGPT, Salmão para Claude e Ciano para Perplexity).
    
      
    

## [3.1.12 a 3.1.21] - Refinamentos e Sanitização - 2026-09-13

- **Sanitização Inteligente de Links:** Implementação de rotinas para encurtar URLs longas, tokens de sessão ou links da AWS S3, evitando poluição visual no Markdown.
    
      
    
- **Aprimoramento de LaTeX:** Conversão consistente de blocos matemáticos (`\[ ... \]` para `$$ ... $$` e `\( ... \)` para `$ ... $`).
    
      
    
- **Remoção de Resíduos:** Limpeza automatizada de strings indesejadas (como avisos de dispositivos não suportados e caracteres de controle invisíveis).
    
      
    

## [3.1.11] - Ajustes de UI - 2026-09-13

- **Testes de Compactação:** Avaliação de rótulos curtos e ícones isolados no botão flutuante, servindo de base para o refinamento ergonômico definitivo adotado na versão atual.
    
      
    

## [3.1.10] - Identidade Visual - 2026-09-13

- **Cores Dinâmicas por Plataforma:** Introdução da função `getPlatformThemeColor()` para injetar dinamicamente as cores oficiais da UI (ChatGPT `#10a37f`, Claude `#e07a5f` e Perplexity `#00bcd4`).
    
      
    
- **Padronização Inicial:** Definição do rótulo inicial do botão flutuante como "Exportar Chat (v3.1.10)".
    
      
    

## [3.1.07] - Base Estrutural - 2026-09-13

- **Captura Assíncrona Robusta:** Estabelecimento da arquitetura inicial para as principais plataformas de IA.
    
      
    
- **Adaptadores Nativos:** Implementação de rotinas de extração via rotas internas (`/backend-api/conversation/` no ChatGPT, `/api/organizations/` no Claude e `/rest/thread/` no Perplexity).
    
      
    
- **Limpeza Básica:** Inclusão inicial de tratamento de blocos e remoção de metadados corrompidos.



# Histórico de versões — série 3.0.x



## [3.0.20] - Versão Estável de Referência - 2026-09-11

- **Timestamps Dinâmicos por Mensagem:** Implementação da inserção e formatação automática da data e hora exata (`YYYY-MM-DD HH:MM`) ao lado de cada remetente, utilizando os metadados nativos de criação obtidos via API.
    
      
    
- **Tratamento Avançado de Anexos:** Criação de rotina dedicada para varrer e capturar anexos, imagens e arquivos enviados nas interações (ChatGPT e Claude), convertendo ponteiros em links limpos compatíveis com o Obsidian (`[[NomeDoArquivo]]`).
    
      
    
- **Extração Direta via API:** Adoção de requisições assíncronas diretas para os endpoints de histórico (`/backend-api/conversation/{id}` e `/api/organizations/{orgId}/chat_conversations/{chatId}`), eliminando travamentos causados pelo parsing de DOM em conversas longas.
    
      
    
- **Interface Flutuante Adaptativa (UI/UX):** Botão inteligente que detecta a plataforma ativa e ajusta a cor da identidade visual (verde corporativo para ChatGPT e laranja/terracota para Claude).
    
      
    
- **Prevenção de Erros de Download:** O botão de exportação agora desativa temporariamente o clique e exibe indicador de progresso (`⏳ Baixando...`) para evitar arquivos duplicados ou vazios.
    
      
    
- **Comando Rápido:** Suporte integrado ao menu de contexto do gerenciador de scripts via atalho do Tampermonkey.
    
      
    

## [Em Desenvolvimento / Marcos Recentes]

- **Adaptação Inicial do Perplexity:** Estruturação da extração via endpoint direto `/rest/thread/{uuid}` com paginação (`_threadQuery`) para ganho de performance em threads extensas.
    
      
    
- **Sanitização e Nomenclaturas:** Mapeamento de blocos de referências e URLs da AWS, com foco em regras de truncagem inteligente de títulos (limite de até 20 caracteres), higienização de caracteres especiais e padronização do sufixo temporal completo no salvamento (`Título_YYYY-MM-DD_HH-MM-SS.md`).




# Histórico de versões — série 2.x.x



## [v2.5.29] - Refinamentos de Widgets e LaTeX - 2026-09-10

- **Parser de Widgets da OpenAI (`genui` / `math_block_widget`):** Extração direta do conteúdo bruto da chave `"content"` dos widgets de equação da API, com remoção completa de resíduos do tipo `NgenuiÖ{...}` e chaves de fechamento soltas (`}`).
    
      
    
- **Compatibilidade com LaTeX / Obsidian:** Conversão otimizada dos delimitadores nativos do ChatGPT (`\\[ ... \\]` $\rightarrow$ `$$ ... $$` e `\\( ... \\)` $\rightarrow$ `$ ... $`) e correção automática de barras invertidas duplicadas (`\\frac`, `\\left`, `\\alpha` $\rightarrow$ `\frac`, `\left`, `\alpha`).
    
      
    
- **Limpeza de Artefatos & Unicode:** Supressão de caracteres invisíveis da faixa privada da OpenAI (`\uE000`–`\uF8FF`), eliminação de glifos e símbolos de controle indesejados (``, ``, `N`, `Ô`), além da remoção de tags de sistema (`entity[...]`) e marcadores sintéticos vazios (`$1$`).
    
      
    

## [v2.5.16] - Parser Inteligente de Entidades - 2026-09-03

- **Isolamento de Metadados:** Tratamento de conceitos da OpenAI (`scientific_concept`, `search_term`), garantindo que links de conceitos sejam exportados como texto limpo enquanto as fórmulas matemáticas permanecem intactas em LaTeX.
    
      
    

## [v2.5.12] - Sanitização de Caracteres - 2026-09-03

- **Limpeza de Caracteres Especiais:** Implementação da limpeza automática de caracteres invisíveis de controle (Unicode) que causavam corrupção de código e quebras de sintaxe no Obsidian.
    
      
    

## [v2.5.10] - Suporte a LaTeX - 2026-09-03

- **Tratamento de Expressões Matemáticas:** Padronização e conversão de blocos matemáticos (`genui`, `math_block_widget`, `\[...\]` e `\(...\)`) para a sintaxe nativa do Markdown/Obsidian ($inline$ e blocos de equação).
    
      
    

## [v2.5.5] - Suporte a Mídia - 2026-09-03

- **Anexos e Arquivos:** Implementação do mapeamento de arquivos (`file_asset_pointer`) e marcadores de imagens (`image_asset_pointer`), oferecendo a opção de incluir ou omitir referências visuais na exportação.
    
      
    

## [v2.5.0] - Migração para API Direta - 2026-07-22

- **Nova Arquitetura de Captura:** Substituição da raspagem de DOM pela integração direta com a API interna do ChatGPT (`/backend-api/conversation/`), garantindo a captura do histórico completo de conversas longas sem perdas por rolagem da página.


### Adicionado

- Suporte nativo a temas personalizados (Dark/Light Mode e alto contraste).
      
    
- Novo sistema de exportação de dados nos formatos CSV e JSON.
    
      
    

### Alterado

- Otimização do tempo de carregamento do painel principal em 40%.
    
      
    
- Atualização do SDK base para suporte a versões mais recentes do runtime.
    
      
    

### Corrigido

- Falha ao salvar configurações de preferência do usuário em sessões concorrentes.
    
      
    



## [2.4.0] - 2026-05-20

### Adicionado

- Integração com webhooks para notificações em tempo real.
    
      
    
- Filtros avançados na busca da listagem principal.
    
      
    

### Alterado

- Reformulação da interface de navegação lateral para melhorar a usabilidade.
    
      
    

### Corrigido

- Erro de formatação em valores de moeda ao alternar regiões.
    
      
    


## [2.3.0] - 2026-02-10

### Adicionado

- Suporte a autenticação em dois fatores (2FA) via aplicativo autenticador.
    
      
    
- Logs de auditoria para ações executadas por administradores.
    
      
    

### Depreciado

- Suporte ao método antigo de autenticação via SMS (descontinuação na v3.0).
    
      
    

## [2.2.0] - 2025-11-05

### Adicionado

- Gerenciamento de permissões granulares baseadas em funções (RBAC).
    
      
    
- Suporte ao idioma Espanhol na interface.
    
      
    

### Corrigido

- Vazamento de memória durante o processamento de grandes arquivos em segundo plano.
    
      
    

## [2.1.0] - 2025-07-18

### Adicionado

- Nova API REST para integração com sistemas externos.
    
      
    
- Documentação interativa via Swagger/OpenAPI.
    
      
    

### Alterado

- Limite de upload de arquivos aumentado de 10 MB para 50 MB.
    
      
    

## [2.0.0] - 2025-03-01

### Adicionado

- Reformulação completa da arquitetura do sistema para microsserviços.
    
- Painel de analytics atualizado em tempo real.
     
    

### Alterado (**Mudanças Quebrantes / Breaking Changes**)

- Reestruturação dos endpoints da API (v1 descontinuada).
   
- Novo esquema de banco de dados (migração automática necessária).
      
    

### Removido

- Suporte a navegadores antigos (Internet Explorer 11).
    
      
    


# Histórico de versões — série 1.x.x

As versões 1.x foram protótipos!




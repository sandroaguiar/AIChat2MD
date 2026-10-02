# 📋 Changelog - Universal AI Chat Exporter

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
  
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).



# Histórico de versões — série 3.8.x

Entradas da **3.8.14** à **3.8.69**, da mais recente para a mais antiga. 


# Histórico de versões — 3.8.51 a 3.8.69

Entradas da **3.8.51** à **3.8.69**, da mais recente para a mais antiga. 

**Regra de compatibilidade da série:** a posição do botão flutuante (`bottom: 20px; right: 140px`) e as cores dos botões existentes não mudaram. Lumo e AI Mode não foram alterados. O Grok só mudou na 3.8.69 (exportação pela API própria, com retorno automático à leitura da página se a API falhar). Todas as versões foram validadas em teste real, com a mesma pergunta feita em cada plataforma (pesquisa na web sobre a versão do Python, script de gráfico e arquivo `.xlsx`).

## 3.8.69 — Grok: exportação pela API própria, com hora, fontes, anexos e arquivos

- O Grok deixou de ser lido só da página. A exportação usa a API do próprio site (confirmada por diagnóstico): `GET /rest/app-chat/conversations_v2/<id>` (título), `GET .../conversations/<id>/response-node` (árvore de respostas) e `POST .../load-responses` com os `responseId` (conteúdo). Se a API falhar por qualquer motivo, o script volta sozinho para a leitura antiga da página (`exportGrokDom`).
- **Hora por mensagem** (`createTime`). O cabeçalho do `.md` só informa que o Grok não tem hora quando cai na leitura da página.
- **Citações:** as marcas `<grok:render ... type="render_inline_citation">` viram número sobrescrito com link (`¹` `²`), usando a `url` do cartão correspondente em `cardAttachmentsJson`; cada resposta recebe **Referências:** só com as fontes citadas, sem repetir (título vindo de `webSearchResults`, ou o domínio).
- **Arquivos e imagens:** o cartão `render_file` vira `📎 **[[nome]]**`, a imagem gerada (`render_generated_image`) vira `![[grok_imagem_N.jpg]]` e os anexos enviados pelo usuário aparecem junto da mensagem. Com a opção de anexos, tudo é baixado de `https://assets.grok.com/<chave>` com a sessão do navegador; sem a opção, fica só `📎 **nome**`. Nomes repetidos ganham ` (2)`, ` (3)`.
- Imagens que a resposta cita por código (ex.: capturas de tela de sites) e que não vêm nos cartões saem como `*(imagem não disponível: ...)*`.
- **Ramificações:** vale a ramificação mais recente (a folha com `createTime` mais novo e seus ancestrais).
- `@connect` acrescentado: `assets.grok.com`.
- **Validado em teste real** (horas, citações, planilha, imagem gerada e anexo enviado).

## 3.8.68 — Diagnóstico do Grok: marcas, cartões e fontes

- O diagnóstico passou a mostrar, por resposta do Grok, o início do texto bruto, as marcas `<grok:render>`, os cartões (`cardAttachmentsJson`), três resultados de pesquisa e um resumo dos passos (textos até 200 caracteres, identificadores omitidos). Foi com isso que se descobriu como ligar cada citação à sua fonte e onde estão o arquivo e a imagem gerados.

## 3.8.67 — Diagnóstico do Grok: `response-node` e `load-responses`

- Dois palpites confirmados: `GET .../response-node` lista as respostas (`responseId`, `sender`, `parentResponseId`) e `POST .../load-responses {responseIds}` traz o conteúdo completo (texto, `createTime`, `webSearchResults`, `cardAttachmentsJson`, `fileAttachmentsMetadata`, `steps`).

## 3.8.66 — Diagnóstico do Grok: chamadas de API da página

- O diagnóstico passou a repetir (só leitura) os pedidos que a página faz. Resultado: `conversations_v2` devolve só título e datas; `/rest/conversations/files/list` e `/rest/assets` listam arquivos (nome, tipo, tamanho, chave de download e `sourceConversationId`).

## 3.8.65 — Comando "Salvar diagnóstico" do Grok

- Novo comando de menu no Grok (`grok.com` e `x.com/i/grok`): quantos elementos cada seletor da exportação encontra, esqueleto de mensagens diferentes entre si, inventário da página e endereços consultados.
- Novas ferramentas genéricas para plataformas lidas da página (DOM): `diagDomSkeleton` e `diagDomInventory`.
- Achado: os seletores `chat-message`, `message-row` e `article` encontravam 0 elementos; a exportação antiga só funcionava pelo genérico `div[class*="message"]` (os `data-testid` atuais são `user-message` e `assistant-message`).

## 3.8.64 — AI Studio: hora por mensagem, anexos do Google Drive e fontes da pesquisa

- **Hora por mensagem:** a posição 32 de cada mensagem traz `[segundos, nanossegundos]`. O cabeçalho do `.md` deixou de dizer que o AI Studio não informa hora por mensagem.
- **Anexos:** a mensagem com o arquivo do Drive chega separada (texto vazio, ID do arquivo na posição 1). Agora o anexo aparece junto da pergunta seguinte, como `![[nome.png]]` ou `📎 **[[nome]]**`. Com a opção de incluir anexos, o arquivo é baixado pelo Drive (`drive.google.com/uc?export=download`, com a sessão do navegador; nome vindo do cabeçalho `Content-Disposition`). Sem a opção, aparece só `📎 **Anexo**`. Falha de download: `📎 **Anexo** *(não pôde ser baixado)*`.
- **Fontes da pesquisa na web:** a posição 15 das respostas do modelo traz as pesquisas feitas e as fontes. Entram **Pesquisas realizadas:** e **Referências:** (`- **1.** [domínio](link)`). Os links vêm do redirecionamento do Google (a página só informa o domínio, sem título).
- `@connect` acrescentado: `drive.google.com` e `drive.usercontent.google.com`.
- **Validado em teste real.**

## 3.8.63 — Diagnóstico do AI Studio: leitura do Drive e sondagem do token

- O teste de leitura de anexos passou a tentar duas formas (`drive.google.com/uc` e `drive.usercontent.google.com/download`). Resultado: as duas funcionam com a sessão do navegador (status 200, tipo, nome e tamanho nos cabeçalhos). A sondagem do `GenerateAccessToken` não deu resultado e deixou de ser necessária.

## 3.8.62 — Diagnóstico do AI Studio: todas as posições e testes de anexo

- Cada posição preenchida das mensagens é listada por número (antes as listas eram cortadas em 12 itens e escondiam as posições altas, onde estão hora, fontes e texto em pedaços).
- O redator dos diagnósticos passou a mascarar identificadores longos (Drive), tokens `ya29.`, fotos de perfil e nomes de autor.

## 3.8.61 — Comando "Salvar diagnóstico" do AI Studio

- Novo comando de menu no AI Studio: censo das posições do nível superior e das mensagens, mais a estrutura redigida de mensagens diferentes entre si e a lista de endereços que a página consultou.

## 3.8.60 — ChatGPT: referências limpas e arquivos gerados

- **Marcadores invisíveis das citações:** o texto das respostas com pesquisa trazia marcadores (`U+E200`...) que viravam texto solto (`citeturn0search9`, `urlTítuloEndereço`, `image_group{...}`). Agora cada marcador é trocado pelo campo `alt` de `metadata.content_references` (Markdown pronto, sem `?utm_source=chatgpt.com`); o carrossel de imagens e o rodapé de fontes somem; marcadores sem correspondência são removidos.
- **Arquivos gerados:** os links `sandbox:/mnt/data/...` do texto viram `📎 **[[nome]]**` (ou `![[nome]]` para imagens), e o arquivo é baixado junto, pelo mesmo caminho da página (`/backend-api/conversation/<id>/interpreter/download?message_id=...&sandbox_path=...` → `download_url`). Nomes repetidos ganham ` (2)`, ` (3)`. Sem a opção de anexos, fica só `📎 **nome**`.
- A cadeia de mensagens passou a ser montada em ordem cronológica antes de ser processada; `downloadAssets` aceita arquivo já baixado.
- **Validado em teste real.** Os parênteses em volta do link de origem (`( Python.org )`) são do texto original do ChatGPT, não um defeito.

## 3.8.59 — Diagnóstico do ChatGPT: arquivos gerados e texto bruto

- Procura os links `sandbox:` nos textos, repete o pedido de download que a página faz (só leitura) e salva uma amostra do texto bruto com os caracteres de marcação visíveis.

## 3.8.58 — Comando "Salvar diagnóstico" do ChatGPT

- Novo comando de menu no ChatGPT: censo de papéis, tipos de conteúdo, tipos de parte e chaves de metadados da ramificação atual, mais a estrutura redigida de mensagens diferentes entre si e os endereços consultados pela página.

## 3.8.57 — Perplexity: arquivos gerados (artefatos)

- Os arquivos gerados (planilha, script...) não vêm na conversa: a página os busca em `/rest/thread/<id da entrada>/entry-metadata` → `artifact_entries[].assets[].download_info[]` (`filename`, `url` assinado do CloudFront). A exportação repete esse pedido, coloca os links acima do texto da resposta e baixa os arquivos com a opção de anexos. Nomes repetidos ganham ` (2)`.
- `@connect` acrescentado: `cloudfront.net`.
- **Validado em teste real.**

## 3.8.56 — Diagnóstico do Perplexity: repete `entry-metadata`

- O diagnóstico passou a repetir o pedido `entry-metadata` da página e salvar a estrutura da resposta (onde estavam os artefatos).

## 3.8.55 — Perplexity: referências renderizam certo + diagnóstico estendido

- No MarkText/Obsidian, `[1][2]` virava link de referência quebrado (sobrava só o `1`) e `- [1] ...` virava caixa de seleção. Agora, no texto, cada marcador citado vira um número sobrescrito que é link para a fonte (`¹` `²`), e a lista final usa `- **1.** [título](url)`. Marcadores dentro de código ficam como estão.
- O diagnóstico passou a listar os endereços consultados pela página e trechos da página com botões/links de download.

## 3.8.54 — Perplexity: referências com links

- Cada resposta recebe **Referências:** com os marcadores `[n]` citados no texto, ligados a `entry.blocks[].web_result_block.web_results[]` (`name`, `url`).
- Os diagnósticos novos passaram a omitir campos de usuário e token (`token`, `username`, `email`, foto de perfil).

## 3.8.53 — Comando "Salvar diagnóstico" do Perplexity

- Novo comando de menu no Perplexity (censo das chaves de entrada e dos tipos de bloco, mais a estrutura redigida de entradas diferentes entre si). Criadas as ferramentas genéricas reaproveitáveis `diagMakeRedactor`, `diagSaveJson` e `diagPageRequests`.

## 3.8.52 — Claude: referências com links

- A pesquisa na web do Claude traz as fontes em `citations[].sources[]` do bloco de texto. Cada resposta recebe **Referências:** com as páginas realmente citadas, sem repetir URLs, como `- [título](url)`.
- **Validado em teste real** (3 pesquisas, 2 links únicos).

## 3.8.51 — Gemini: arquivos gerados que não são imagem

- Os arquivos gerados (`.xlsx`, `.js` etc.) trazem a URL de download em `anexo[7][1]` (`contribution.usercontent.google.com/download?c=...`). Agora são baixados junto com o `.md`, com nova tentativa usando `?authuser=N` se a primeira falhar; respostas em HTML (página de login/erro) são recusadas.
- `@connect` acrescentado: `usercontent.google.com`.
- **Validado em teste real.**

## Achados que não são bugs (registrados para referência)

- **Lumo não gera nem baixa arquivos ou imagens** (o próprio Lumo avisa na conversa). Decisão: nele só se implementa o comando de diagnóstico, nunca download de anexos.
- **AI Studio, links de fontes:** vêm do redirecionamento do Google (`vertexaisearch.cloud.google.com/grounding-api-redirect/...`); a página só informa o domínio. Não se sabe por quanto tempo esses links continuam válidos.
- **ChatGPT:** o `alt` das citações já traz os parênteses em volta do link (`( Python.org )`); isso vem do texto original.
- **Grok, fontes:** a exportação lista só as fontes realmente citadas no texto (como nas demais plataformas), e não todas as fontes consultadas na busca (o Grok pode mostrar, por exemplo, "20 sources").
- Os arquivos de diagnóstico omitem identificadores, tokens, nomes e fotos de perfil, mas convém revisar antes de compartilhar.

## Pendências conhecidas

1. **Comando "Salvar diagnóstico" no Lumo e no AI Mode** (plataformas lidas da página: o diagnóstico será um instantâneo dos elementos e seletores, reaproveitando `diagDomSkeleton`, `diagDomInventory`, `diagMakeRedactor`, `diagSaveJson` e `diagPageRequests`; no Grok, olhar os endereços consultados pela página revelou uma API completa, então vale conferir o mesmo nessas duas). O Lumo só terá o diagnóstico, sem download de anexos. "Testar download de imagens" fica fora (só faz sentido no Gemini).
2. **Fechamento da 4.0.0:** atualizar o CHANGELOG oficial (reordenar os blocos, que estão fora de sequência, e remover as entradas 2.x que são texto de modelo) e o README, só quando o autor pedir.



# Histórico de versões — 3.8.48 a 3.8.50

Entradas da **3.8.48** à **3.8.50**, da mais recente para a mais antiga.

**Regra de compatibilidade da série:** nenhuma alteração nas plataformas ChatGPT, Perplexity, Grok, Lumo, AI Studio ou AI Mode nessas versões. A posição do botão flutuante e as cores dos botões existentes não mudaram. Tudo desta série mexeu só no módulo Gemini.

## 3.8.50 — Gemini: mensagens do usuário não quebram mais a formatação do Markdown

- Corrigido: quando o usuário colava um trecho de código na caixa de mensagem do Gemini, linhas que começavam com `#`, `>`, `-`, `*`, `1.` etc. (por exemplo um comentário Python tipo `# nome da variável`) podiam virar título, citação ou lista de verdade no `.md` exportado — o Obsidian então dobrava/desdobrava esse "título" falso e misturava visualmente trechos de partes bem diferentes da conversa.
- Causa raiz (confirmada por diagnóstico): diferente da resposta do Gemini — onde blocos de código vêm estruturados à parte, com a linguagem identificada — a mensagem do **usuário** chega da API como uma única string de texto puro, sem nenhuma marcação de código, cerca ou linguagem. O próprio site do Gemini reconhece e destaca como código por heurística visual local, mas essa informação não vai junto na API.
- Correção aplicada (conserto mínimo, só no texto bruto do usuário no Gemini): caracteres de início de linha que o Markdown leria como bloco (`#`, `>`, `-`/`*`/`+` de lista, `1.` numerada, `---` de linha horizontal, `` ``` `` de cerca de código) são escapados com `\`. O texto sai correto, mas sem a formatação bonita de "bloco de código" — isso fica para a próxima etapa (ver Pendências).
- **Validado em teste real:** reexportada a mesma conversa do Plutão, confirmado que o título falso não aparece mais.
- **Decisão (não vira pendência):** cogitou-se, como próxima etapa, reconhecer automaticamente trechos de código dentro da mensagem do usuário e reenvolvê-los em cercas de código. Descartado: o texto do usuário sem cor (em contraste com o bloco colorido do que a IA gera) é uma distinção visual desejada, que mostra a origem real do conteúdo — a detecção heurística removeria isso, arriscaria falsos positivos/negativos, e o problema original (corrupção do Markdown) já está resolvido sem esse custo.

## 3.8.49 — Diagnóstico do Gemini: limite de turnos aumentado de 30 para 200

- O comando **"🔍 Gemini: salvar diagnóstico de anexos"** só salvava os 30 turnos mais recentes da conversa (`turns.slice(0, 30)`), mesmo reportando corretamente o total real em `totalTurnos`. Em conversas longas, turnos mais antigos (como um problema relatado sobre uma mensagem específica) ficavam de fora do diagnóstico. Limite elevado para 200 turnos.

## 3.8.48 — Gemini: código executado vira callouts recolhidos separados

- O código que o Gemini executa (e sua saída) era mantido como bloco de código comum no `.md`, sem distinção visual entre o código e o resultado. Agora cada um vira um *callout* recolhido do Obsidian: um para **"Código executado pelo Gemini"**, outro para **"Saída"** (ou **"Erro"**, se for `stderr`), ambos fechados por padrão na leitura.
- Saída ou erro vazios (execução sem nenhum `print`/erro) deixam de gerar um callout vazio — são simplesmente descartados.

## Achados que não são bugs (registrados para referência)

- **Gemini — mensagem do usuário sem estrutura de código:** confirmado por diagnóstico (turno com "Eu inclui Plutão") que a API do Gemini nunca envia marcação de código para o texto que o próprio usuário digita ou cola — é sempre uma string única. Isso não é um bug pontual a corrigir, é uma limitação de dados. Decisão: não implementar detecção heurística para reenvolver esse texto em cercas de código — a diferença visual entre texto do usuário (sem cor) e código da IA (colorido) mostra a origem real do conteúdo, e é considerada um ganho, não uma falha. (Reforça o diagnóstico: a extensão de Firefox "AI Chat Exporter", de terceiros, apresenta exatamente o mesmo defeito na mesma situação.)
- (herdado da 3.8.41-3.8.47) Claude: mensagem só com `thinking` não aparece no `.md` — decisão deliberada do autor.
- (herdado) AI Mode / AI Studio: sem hora por mensagem porque a página não fornece esse dado.
- (herdado) Downloads do Gemini "sumindo" sem aviso: comportamento do navegador, não do script.

## Pendências conhecidas

1. Gemini: arquivos gerados que não são imagem (`.xlsx`, `.js`) saem só como link, sem download automático. A URL de download já foi localizada no dado do anexo (índice 7).
2. Claude: referências com links (pesquisa na web e citações) ainda não são exportadas; o campo `citations` veio vazio nos testes feitos até agora.
3. Fechamento da 4.0.0: atualizar o README (já feito nesta sessão, falta só postar no GitHub) e o CHANGELOG oficiais.




# Histórico de versões — 3.8.41 a 3.8.47

Entradas da **3.8.41** à **3.8.47**, da mais recente para a mais antiga. 

**Regra de compatibilidade da série:** nenhuma alteração nas plataformas ChatGPT, Perplexity ou Gemini nessas versões. A posição do botão flutuante (`bottom: 20px; right: 140px`) e as cores dos botões já existentes não mudaram.

## 3.8.47 — Grok: listas com marcador e numeração

- Corrigido: listas (`<ul>`/`<ol>`) do Grok saíam como linhas soltas, sem marcador nem numeração. Agora saem com `-` ou numeração (respeitando o atributo `start`), com sublistas indentadas — mesmo tratamento que o Lumo já tinha.
- Corrigido: títulos (`<h1>` a `<h6>`) do Grok fora de bloco de código agora viram `#`/`##`/etc. em vez de texto solto.
- Corrigida a causa raiz de ambos: o container da mensagem que tinha um bloco de código dentro "contaminava" tudo ao redor como se fosse código, impedindo negrito, itálico e título de funcionarem perto de um bloco de código. Agora só o que está de fato dentro de `<pre>`/`<code>` conta como código.

## 3.8.46 — Removida a sanitização de links inoperante

- Removida a função `sanitizeMarkdownLinks`, herdada da 3.7.4: a expressão regular tinha `\vert{}` no lugar de `|` e nunca reconhecia nenhum link, então a função não fazia nada desde sempre. Confirmado que a remoção não muda a saída em nenhuma plataforma.

## 3.8.45 — Grok e Lumo: blocos de código sem vazamento de rótulo

- Corrigido no Grok: o cabeçalho de cada bloco de código (nome da linguagem + botão "Copiar"/"Copiado") vazava para o texto exportado como linhas soltas. Agora esse cabeçalho é removido e a linguagem do cabeçalho é usada na cerca do bloco (antes era sempre ` ```python `).
- Corrigido no Lumo: código dentro de `<pre>` ou com várias linhas agora vira bloco com cerca ` ``` ` (com a linguagem, quando disponível); antes saía entre crases simples e linhas começadas com `#` viravam títulos grandes no Obsidian.
- A limpeza das palavras "Copiar"/"Copy code" deixou de ser usada em qualquer plataforma (ver 3.8.43 e 3.8.44).

## 3.8.44 — Versão de teste (Grok/Lumo sem limpeza de "Copiar")

- Versão intermediária, só para teste: igual à 3.8.43, mas sem a limpeza de "Copiar"/"Copy code" no Grok e no Lumo, para diagnosticar os vazamentos de rótulo corrigidos na 3.8.45.

## 3.8.43 — Corrigida a limpeza que apagava "Copiar"/"Copy code" do texto real

- Corrigido bug herdado da 3.7.4: a limpeza de rótulos de botão ("Copiar", "Copy code") apagava essas palavras mesmo quando faziam parte do texto real da conversa. No ChatGPT, no Claude e no Perplexity (dados vêm por API, sem rótulos de botão) essa limpeza deixou de ser aplicada. No Grok e no Lumo, na época, o comportamento anterior foi mantido (revisto depois, na 3.8.45).

## 3.8.42 — Gemini: pedir a pasta das imagens uma única vez (Chromium)

- Em navegadores baseados em Chromium (Chrome, Edge, Brave\*, Opera) que suportam a API `showDirectoryPicker`, o download de imagens geradas pelo Gemini passa a pedir a pasta **uma única vez** e escrever todos os arquivos ali direto, sem uma caixa "Salvar como" por imagem.
- Se o navegador não suportar essa API (Firefox e derivados) ou se o usuário cancelar a escolha da pasta, o script cai automaticamente no comportamento anterior (um download por imagem, sujeito à configuração de download do navegador).
- \* Nota: o Brave bloqueia essa API de propósito (decisão de privacidade da equipe, sem opção de reativar), então nele o script sempre usa o download clássico. Isso não é um bug: desativando "Perguntar onde salvar cada arquivo antes de baixar" nas configurações de download do navegador (Firefox, Brave ou Chrome), o resultado final é o mesmo — tudo salvo silenciosamente numa única pasta, com ou sem essa API.

## 3.8.41 — AI Mode: perguntas de continuação sugeridas

- O AI Mode mostra, ao final de cada resposta, uma lista de perguntas de continuação sugeridas (`ul.XSq4R.KI3fJ`, dentro de `div.AHmQrc`) — uma classe diferente da lista de conteúdo normal, por isso não era capturada. Agora entra no `.md` como um bloco de lista com o prefixo **"Perguntas sugeridas para continuar:"**.

## Achados que não são bugs (registrados para referência)

- **Claude:** uma mensagem que contém só raciocínio interno (`thinking`), sem nenhum texto de resposta real, não aparece no `.md` desde que o `thinking` passou a ser excluído (3.8.30). Decisão do autor: manter assim — quando quiser ver o raciocínio de uma resposta específica, basta pedir diretamente ao Claude.
- **AI Mode / AI Studio:** sem hora por mensagem porque as respectivas páginas não fornecem esse dado — mesmo tratamento do Lumo e do Grok ("Exportado em").
- **Downloads do Gemini "sumindo" sem aviso:** quando o navegador está configurado para não perguntar onde salvar, os arquivos são salvos silenciosamente na pasta padrão configurada — não é um bug do script.

## Pendências conhecidas

- Decidir o que fazer com o código executado pelo Gemini no `.md` (manter, *callout* recolhido do Obsidian, ou remover).
- Gemini: arquivos gerados que não são imagem (`.xlsx`, `.js`) saem só como link, sem download automático. A URL de download já foi localizada no dado do anexo (índice 7).
- Claude: referências com links (pesquisa na web e citações) ainda não são exportadas; o campo `citations` veio vazio nos testes feitos até agora.
- Fechamento da 4.0.0: atualizar o README e o CHANGELOG oficiais.



# Histórico de versões — 3.8.35 a 3.8.40

Entradas da **3.8.35** à **3.8.40**, da mais recente para a mais antiga. 

**Regra de compatibilidade da série:** nenhuma das plataformas já existentes (ChatGPT, Claude, Perplexity, Grok, Lumo, Gemini) foi alterada nessas versões. A posição do botão flutuante (`bottom: 20px; right: 140px`) não mudou.

## 3.8.40 — AI Mode: correção de fórmulas dentro de negrito

- Corrigido bug em que fórmulas matemáticas dentro de texto em **negrito** (`<strong>`/`<b>`) desapareciam da exportação — tanto em células de tabela (coluna de termos ficava vazia) quanto em rótulos de lista (`"Expansão (θ):"` saía como `"Expansão ():"`). Causa: o tratamento de negrito extraía só texto puro, e essa extração ignora de propósito os elementos de fórmula (`span.mTEjhd`, `span.cPGBZb`, atributos `data-xpm-*`). Passa a processar o conteúdo do negrito pela mesma rotina que reconhece fórmulas. Bug herdado do adaptador original do AfterChat, confirmado com o HTML real de uma célula de tabela fornecido pelo usuário.
- Confirmado, por comparação direta com a página: quando uma resposta do AI Mode aparenta terminar "no meio de uma frase" no `.md` exportado, é porque a própria resposta parou ali na origem — não é um bug do exportador.

## 3.8.39 — AI Mode: novo adaptador

- Novo `@match` para `https://www.google.com/search*` e `https://www.google.com/ai*`. Como esse caminho também cobre a busca comum do Google, o botão flutuante só aparece quando a página é realmente o AI Mode — checagem em tempo de execução do parâmetro `udm=50` na URL (ou do caminho `/ai`) — e não em qualquer pesquisa.
- Botão flutuante amarelo (`#FBBC05`), só nessa plataforma.
- `isGeminiHost()` (usada para contornar o bloqueio de `innerHTML` por Trusted Types) passa a cobrir também `www.google.com`.
- Novo módulo `AIModeAdapter`, lendo direto do DOM da página (o AI Mode não expõe o conteúdo da conversa por API JSON, só por *scraping*):
  - Cada turno é um `div.CKgc1d` de nível mais externo; a pergunta do usuário é `h2.iMqumd`; a resposta são um ou mais `div.pWvJNd`.
  - Dentro da resposta: parágrafos (`div.n6owBd.awi2gc`), títulos de seção (`div.otQkpb` → negrito), listas aninhadas (`ul.KsbFXc`) e tabelas (`table.NRefec`).
  - Fórmulas LaTeX inline e em bloco (`span.mTEjhd` / `span.cPGBZb`) viram `$...$` / `$$...$$`.
  - Referências e citações (chips `span.WBgIic` com link `a.PMDqCb`) viram marcas `[N]` no texto, com uma lista **Referências** numerada ao final de cada resposta — recurso que nenhum outro adaptador do script tem hoje.
- Simplificado de propósito em relação ao adaptador original: não foi portado o mecanismo de abrir outras conversas do histórico num `<iframe>` oculto (o AI Mode não permite buscar o conteúdo de uma conversa por `fetch`, só por navegação real), porque o script só exporta a conversa já aberta na tela, não o histórico inteiro.
- Sem hora por mensagem, porque a página não fornece esse dado: segue o mesmo padrão do Lumo, do Grok e do AI Studio, com **"Exportado em"** no cabeçalho.
- Não trata anexos enviados nem imagens/arquivos gerados (mesma limitação dos demais adaptadores).

## 3.8.38 — AI Studio: correção de blocos de código

- Corrigido bug em que a conversão de `# título` para `**negrito**` também era aplicada **dentro de blocos de código**, corrompendo comentários Python (uma linha como `# Definindo a função` saía como `**Definindo a função**`, quebrando a sintaxe do script exportado). A função agora ignora o conteúdo entre ` ``` `.

## 3.8.37 — AI Studio: correção da detecção de URL (revertida a 3.8.36)

- A 3.8.36 havia mudado a regra assumindo que a URL do AI Studio tinha um segmento `/app/` (`.../app/prompts/<id>`), baseado numa referência desatualizada. Um teste real confirmou que a URL de fato é `/u/<n>/prompts/<id>` ou `/prompts/<id>`, sem `/app/` — exatamente como a 3.8.35 original já esperava. A 3.8.36 foi revertida.
- Mantido o reconhecimento do placeholder `new_data`, além de `new_chat`, como página padrão sem conversa real.

## 3.8.36 — AI Studio: tentativa de correção da URL

- Alterou `getCurrentConversationId()` para exigir `/app/prompts/<id>` na URL. Ajuste equivocado, revertido na 3.8.37: a URL real do AI Studio não tem esse segmento.

## 3.8.35 — AI Studio: novo adaptador

- Novo `@match` para `https://aistudio.google.com/*`.
- Botão flutuante vermelho vinho (`#722F37`), só nessa plataforma.
- `isGeminiHost()` estendida para cobrir também `aistudio.google.com` (Trusted Types bloqueia `innerHTML` lá também).
- Novo módulo `AIStudioAdapter`:
  - ID do prompt obtido da URL (`/prompts/<id>` ou `/u/<n>/prompts/<id>`).
  - Autenticação calculada na hora: `SAPISIDHASH` a partir do cookie `SAPISID` + timestamp, e chave de API extraída de um `<script type="application/json">` da própria página.
  - Conversa obtida via chamada direta (XHR, sem `GM_xmlhttpRequest`) ao método `ResolveDriveResource` da API interna do AI Studio (`MakerSuiteService`).
  - Separa "Processo de raciocínio" de "Resposta" quando o modelo expõe pensamento (heurística por palavras-chave no início do texto, como no adaptador original).
- Sem hora por mensagem (API não fornece), com o mesmo cabeçalho **"Exportado em"** do Lumo e do Grok.
- Não trata anexos, imagens/arquivos gerados nem referências com link.

## Pendências conhecidas

- Claude: referências com links (pesquisa na web e citações) ainda não são exportadas.
- Gemini: arquivos gerados que não são imagens (`.xlsx`, `.js`) saem só como link, sem download automático.
- AI Studio e AI Mode: sem hora por mensagem, porque as respectivas páginas não fornecem esse dado.
- AI Mode: sem figuras/gráficos gerados no `.md` (mesma limitação dos demais adaptadores).
- Sanitização de links inoperante (regex com `\vert{}` no lugar de `|`), herdada da 3.7.4.
- Fechamento da 4.0.0: atualizar README e CHANGELOG oficiais (só quando solicitado).

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

- Claude: referências com links (pesquisa na web e citações). O campo `citations` dos blocos de texto existe, mas veio vazio nas conversas testadas; falta uma conversa curta com pesquisa na web para ver a estrutura.
- Claude: os arquivos apresentados pelo Claude saem só como link; o arquivo precisa ser baixado do Claude e colocado no cofre.
- Gemini: arquivos gerados (por exemplo `.xlsx` e `.js`) saem como link, sem download automático. Os endereços de download aparecem no dado do anexo (índice 7).
- Sanitização de links inoperante: a expressão regular tem `\vert{}` no lugar de `|` e nunca reconhece um link (herdado da 3.7.4).
- A limpeza de texto apaga as palavras `Copiar` e `Copy code` também quando fazem parte do texto real da conversa.
- AI Studio e AI Mode (Google) não têm adaptador.



# Histórico de versões — série 3.7.x


## 3.7.4 - 2026-09-17

### 🛠️ Correções e Ajustes (Grok)

- **Correção no Parser DOM do Grok:** Ajustado o tratamento de nós dentro de blocos de código (`pre` e `code`) para evitar que títulos ou rótulos de interface fossem convertidos incorretamente em títulos Markdown (`#`).
- **Limpeza de Resíduos Visuais:** Implementada remoção automática de textos duplicados ou lixos de interface injetados pelo DOM (como botões de cópia e rótulos de linguagem flutuantes).





## 3.7.3 - 2026-09-17

### 🚀 Novidades e Mudanças Estruturais

- **Novo Adaptador DOM para o Grok:** Substituição completa da rota de API baseada em requisições de backend do X.com por um extrator direto via DOM (`[x.com/i/grok](https://x.com/i/grok)` e `grok.com`), eliminando erros de requisição (`404` e respostas vazias).
- **Política de Congelamento de Módulos:** Estabelecida a diretriz de blindagem e congelamento total dos adaptadores já estáveis (ChatGPT, Claude, Perplexity e Lumo), garantindo que atualizações em uma plataforma não afetem as demais.





## 3.7.2 - 2026-09-17

### 🔍 Correções Gerais e Estabilidade

- Ajustes de compatibilidade em rotinas de mapeamento de nós e tratamento de caracteres especiais.
- Refinamento na limpeza de textos gerados por IA para preservar blocos de código matemáticos e formatações em LaTeX (`$$` e `$`).




## 3.7.0 / 3.7.1 - 2026-09-17

### ⚙️ Refatoração de Módulos

- Tentativa de unificação estrutural de adaptadores de rede (com posterior revisão de escopo para adotar abordagens isoladas por plataforma).
- Correção de regressões no adaptador do Claude, restaurando integralmente a estabilidade operacional da versão `3.6.3`.




# Histórico de versões — série 3.6.x



## v3.6.3 - 2026-09-15

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



## 3.1.25 - 2026-09-14

- **Correção de Metadados no Painel:** O campo `@name` do Tampermonkey foi simplificado para evitar caracteres extras/versões longas no cabeçalho, garantindo a exibição limpa e correta no painel de controle do gerenciador.
- **Estabilidade Geral:** Consolidação final de todas as correções de formatação e exportação para ChatGPT, Claude e Perplexity.




## 3.1.24 - 2026-09-14

- **Adição de Metadados no Arquivo Exportado:** Implementação da linha de créditos no topo de cada arquivo `.md` gerado, exibindo explicitamente o nome do exportador e a versão exata utilizada (ex: `| **Exportador:** Universal AI Chat Exporter 3.1.24`).




## 3.1.23 - 2026-09-14

- **Interface Dinâmica por Plataforma:** Aprimoramento da cor e do comportamento do botão flutuante de exportação para se adaptar visualmente de forma automática à identidade visual da IA em uso:

    - Verde padrão para o ChatGPT.
    - Cor salmão/terracota para o Claude.
    - Tom ciano para o Perplexity.
        
- **Sanitização Avançada de Links:** Melhorias na limpeza automática de URLs longas, remoção de tokens sensíveis da AWS e padronização de links de referência para manter o Markdown limpo e organizado.


  

## 3.1.22 - Estabilização Atual - 2026-09-13

- **Botão Flutuante Otimizado:** Restauração do texto clássico "Exportar Chat" (removendo o número da versão do corpo do botão para manter a interface mais limpa).
- **Posicionamento Blindado:** Ajuste de layout e garantia de `z-index` (`bottom: 20px`, `right: 180px`, `z-index: 2147483647`) para flutuar perfeitamente sem sobrepor os controles nativos de envio de mensagem.
- **Cores Contextuais:** Manutenção da aplicação automática das cores oficiais de cada plataforma (Verde para ChatGPT, Salmão para Claude e Ciano para Perplexity).




## 3.1.12 a 3.1.21 - Refinamentos e Sanitização - 2026-09-13

- **Sanitização Inteligente de Links:** Implementação de rotinas para encurtar URLs longas, tokens de sessão ou links da AWS S3, evitando poluição visual no Markdown.
- **Aprimoramento de LaTeX:** Conversão consistente de blocos matemáticos (`\[ ... \]` para `$$ ... $$` e `\( ... \)` para `$ ... $`).
- **Remoção de Resíduos:** Limpeza automatizada de strings indesejadas (como avisos de dispositivos não suportados e caracteres de controle invisíveis).




## 3.1.11 - Ajustes de UI - 2026-09-13

- **Testes de Compactação:** Avaliação de rótulos curtos e ícones isolados no botão flutuante, servindo de base para o refinamento ergonômico definitivo adotado na versão atual.




## 3.1.10 - Identidade Visual - 2026-09-13

- **Cores Dinâmicas por Plataforma:** Introdução da função `getPlatformThemeColor()` para injetar dinamicamente as cores oficiais da UI (ChatGPT `#10a37f`, Claude `#e07a5f` e Perplexity `#00bcd4`).
- **Padronização Inicial:** Definição do rótulo inicial do botão flutuante como "Exportar Chat (v3.1.10)".




## 3.1.07 - Base Estrutural - 2026-09-13

- **Captura Assíncrona Robusta:** Estabelecimento da arquitetura inicial para as principais plataformas de IA.
- **Adaptadores Nativos:** Implementação de rotinas de extração via rotas internas (`/backend-api/conversation/` no ChatGPT, `/api/organizations/` no Claude e `/rest/thread/` no Perplexity).
- **Limpeza Básica:** Inclusão inicial de tratamento de blocos e remoção de metadados corrompidos.



# Histórico de versões — série 3.0.x



## 3.0.20 - Versão Estável de Referência - 2026-09-11

- **Timestamps Dinâmicos por Mensagem:** Implementação da inserção e formatação automática da data e hora exata (`YYYY-MM-DD HH:MM`) ao lado de cada remetente, utilizando os metadados nativos de criação obtidos via API.
- **Tratamento Avançado de Anexos:** Criação de rotina dedicada para varrer e capturar anexos, imagens e arquivos enviados nas interações (ChatGPT e Claude), convertendo ponteiros em links limpos compatíveis com o Obsidian (`[[NomeDoArquivo]]`).
- **Extração Direta via API:** Adoção de requisições assíncronas diretas para os endpoints de histórico (`/backend-api/conversation/{id}` e `/api/organizations/{orgId}/chat_conversations/{chatId}`), eliminando travamentos causados pelo parsing de DOM em conversas longas.
- **Interface Flutuante Adaptativa (UI/UX):** Botão inteligente que detecta a plataforma ativa e ajusta a cor da identidade visual (verde corporativo para ChatGPT e laranja/terracota para Claude).
- **Prevenção de Erros de Download:** O botão de exportação agora desativa temporariamente o clique e exibe indicador de progresso (`⏳ Baixando...`) para evitar arquivos duplicados ou vazios.
- **Comando Rápido:** Suporte integrado ao menu de contexto do gerenciador de scripts via atalho do Tampermonkey.


## Em Desenvolvimento / Marcos Recentes

- **Adaptação Inicial do Perplexity:** Estruturação da extração via endpoint direto `/rest/thread/{uuid}` com paginação (`_threadQuery`) para ganho de performance em threads extensas.
- **Sanitização e Nomenclaturas:** Mapeamento de blocos de referências e URLs da AWS, com foco em regras de truncagem inteligente de títulos (limite de até 20 caracteres), higienização de caracteres especiais e padronização do sufixo temporal completo no salvamento (`Título_YYYY-MM-DD_HH-MM-SS.md`).





# Histórico de versões — série 2.x.x



## 2.5.29 - Refinamentos de Widgets e LaTeX - 2026-09-10

- **Parser de Widgets da OpenAI (`genui` / `math_block_widget`):** Extração direta do conteúdo bruto da chave `"content"` dos widgets de equação da API, com remoção completa de resíduos do tipo `NgenuiÖ{...}` e chaves de fechamento soltas (`}`).
- **Compatibilidade com LaTeX / Obsidian:** Conversão otimizada dos delimitadores nativos do ChatGPT (`\\[ ... \\]` $\rightarrow$ `$$ ... $$` e `\\( ... \\)` $\rightarrow$ `$ ... $`) e correção automática de barras invertidas duplicadas (`\\frac`, `\\left`, `\\alpha` $\rightarrow$ `\frac`, `\left`, `\alpha`).
- **Limpeza de Artefatos & Unicode:** Supressão de caracteres invisíveis da faixa privada da OpenAI (`\uE000`–`\uF8FF`), eliminação de glifos e símbolos de controle indesejados (``, ``, `N`, `Ô`), além da remoção de tags de sistema (`entity[...]`) e marcadores sintéticos vazios (`$1$`).




## 2.5.16 - Parser Inteligente de Entidades - 2026-09-03

- **Isolamento de Metadados:** Tratamento de conceitos da OpenAI (`scientific_concept`, `search_term`), garantindo que links de conceitos sejam exportados como texto limpo enquanto as fórmulas matemáticas permanecem intactas em LaTeX.




## 2.5.12 - Sanitização de Caracteres - 2026-09-03

- **Limpeza de Caracteres Especiais:** Implementação da limpeza automática de caracteres invisíveis de controle (Unicode) que causavam corrupção de código e quebras de sintaxe no Obsidian.




## 2.5.10 - Suporte a LaTeX - 2026-09-03

- **Tratamento de Expressões Matemáticas:** Padronização e conversão de blocos matemáticos (`genui`, `math_block_widget`, `\[...\]` e `\(...\)`) para a sintaxe nativa do Markdown/Obsidian ($inline$ e blocos de equação).




## 2.5.5 - Suporte a Mídia - 2026-09-03

- **Anexos e Arquivos:** Implementação do mapeamento de arquivos (`file_asset_pointer`) e marcadores de imagens (`image_asset_pointer`), oferecendo a opção de incluir ou omitir referências visuais na exportação.



## 2.5.0 - Migração para API Direta - 2026-07-22

- **Nova Arquitetura de Captura:** Substituição da raspagem de DOM pela integração direta com a API interna do ChatGPT (`/backend-api/conversation/`), garantindo a captura do histórico completo de conversas longas sem perdas por rolagem da página.

### Adicionado

- Suporte nativo a temas personalizados (Dark/Light Mode e alto contraste).
- Novo sistema de exportação de dados nos formatos CSV e JSON.

### Alterado

- Otimização do tempo de carregamento do painel principal em 40%.
- Atualização do SDK base para suporte a versões mais recentes do runtime.
 
### Corrigido

- Falha ao salvar configurações de preferência do usuário em sessões concorrentes.




## 2.4.0 - 2026-05-20

### Adicionado

- Integração com webhooks para notificações em tempo real.
- Filtros avançados na busca da listagem principal.
  
### Alterado

- Reformulação da interface de navegação lateral para melhorar a usabilidade.

### Corrigido

- Erro de formatação em valores de moeda ao alternar regiões.




## 2.3.0 - 2026-02-10

### Adicionado

- Suporte a autenticação em dois fatores (2FA) via aplicativo autenticador.
- Logs de auditoria para ações executadas por administradores.
   



## 2.2.0 - 2025-11-05

### Adicionado

- Gerenciamento de permissões granulares baseadas em funções (RBAC).
- Suporte ao idioma Espanhol na interface.

### Corrigido

- Vazamento de memória durante o processamento de grandes arquivos em segundo plano.




## 2.1.0 - 2025-07-18

### Adicionado

- Nova API REST para integração com sistemas externos.
- Documentação interativa via Swagger/OpenAPI.
 
### Alterado

- Limite de upload de arquivos aumentado de 10 MB para 50 MB.





## 2.0.0 - 2025-03-01

### Adicionado

- Reformulação completa da arquitetura do sistema para microsserviços.
- Painel de analytics atualizado em tempo real.
   
### Alterado (**Mudanças Quebrantes / Breaking Changes**)

- Reestruturação dos endpoints da API (v1 descontinuada).
- Novo esquema de banco de dados (migração automática necessária).


  


# Histórico de versões — série 1.x.x

*As versões 1.x foram protótipos!*




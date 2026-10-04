# AIChat2MD

Userscript para **Tampermonkey** que exporta conversas de plataformas de IA para arquivos **Markdown (`.md`)**, pensado para uso em cofres de gestão de conhecimento como o **Obsidian** (também funciona com Logseq, Bear, NotePlan e Drafts).

**AIChat2MD** significa *AI Chat to MD*. O projeto se chamava Universal AI Chat Exporter até a versão 3.8.27.

**Versão atual:** 4.0.0 · **Licença:** MIT · **Autor:** Sandro Aguiar & Collaborator

## Plataformas suportadas

| Plataforma | Endereço | Como extrai | Cor do botão | Data/hora das mensagens | Anexos, arquivos e imagens |
|---|---|---|---|---|---|
| ChatGPT | `chatgpt.com`, `chat.openai.com` | API interna | Verde `#10a37f` | Hora real de cada mensagem | Links de anexos; arquivos gerados baixados; citações com link |
| Claude | `claude.ai` | API interna | Salmão `#e07a5f` | Hora real de cada mensagem | Imagens e arquivos enviados e arquivos apresentados (como links); referências com link |
| Perplexity | `perplexity.ai` | API interna | Ciano `#00bcd4` | Uma única data para a conversa, no cabeçalho; mensagens sem hora | Arquivos gerados (planilhas, scripts...) baixados; referências com link |
| Grok | `x.com/i/grok`, `grok.com` | API interna (com retorno automático à leitura da página) | Preto `#000000` | Hora real de cada mensagem (sem hora se cair na leitura da página) | Anexos, arquivos e imagens gerados baixados; citações com link |
| Lumo (Proton) | `lumo.proton.me` | DOM da página | Roxo `#6d4aff` | Não informada pela plataforma | Cartões de anexo (como links); links e títulos das respostas |
| Gemini | `gemini.google.com` | API interna (`batchexecute`) | Azul `#1a73e8` | Hora real de cada turno | Anexos enviados; imagens e arquivos gerados baixados; código executado e sua saída |
| Google AI Studio | `aistudio.google.com` | API interna (chave de API + `SAPISIDHASH`) | Vinho `#722F37` | Hora real de cada mensagem | Anexos do Google Drive baixados; pesquisas e referências |
| Google AI Mode | `google.com/search` (com `udm=50` ou `/ai`) | DOM da página | Amarelo `#FBBC05` | Não informada pela plataforma | Arquivos gerados baixados; imagens do carrossel; blocos de código e links |

**API × DOM:** a extração por API busca a conversa inteira, sem depender do que está desenhado na tela, e por isso não perde mensagens em conversas longas. A extração por DOM (Lumo, AI Mode e, se a API falhar, o Grok) lê apenas o que a página renderiza.

## Recursos

- **Conversa completa** nas plataformas com API (ChatGPT, Claude, Perplexity, Grok, Gemini, AI Studio), sem rolagem manual.
- **Cabeçalho** com título, data, fonte (link da conversa) e versão do exportador.
- **Data e hora por mensagem** quando a plataforma fornece esse dado. Onde não fornece, o script não inventa horários:
  - **Lumo e AI Mode:** o cabeçalho mostra **"Exportado em"** com a data e a hora da exportação.
  - **Perplexity:** a API informa uma única data para a conversa, mostrada no cabeçalho como **"Conversa em"**.
- **Referências com links:** no ChatGPT, Claude, Perplexity, Grok, Gemini, AI Studio e AI Mode as fontes citadas viram links no texto e/ou uma lista **Referências** ao final da resposta (só as fontes citadas, sem repetir).
- **Anexos, imagens e arquivos gerados** como links do Obsidian (veja a seção abaixo), baixados junto com o `.md` onde a plataforma permite.
- **Código executado pelo Gemini:** o código e sua saída (ou erro) entram como dois *callouts* recolhidos do Obsidian, separados — "Código executado pelo Gemini" e "Saída"/"Erro" —, fechados por padrão na leitura.
- **Listas, títulos e blocos de código** com a formatação correta, inclusive no Grok, no Lumo e no AI Mode.
- **Fórmulas LaTeX** convertidas para o formato do Obsidian (`$...$` e `$$...$$`).
- **Limpeza de interface:** rótulos de botões de cópia e, no Lumo, avisos e a área de digitação não entram no arquivo. No Claude, o raciocínio interno e as chamadas de ferramenta também ficam de fora.
- **Botão flutuante** com a cor da plataforma, no canto inferior direito, e comando equivalente no menu do Tampermonkey.
- **Comando "Salvar diagnóstico"** em todas as plataformas (veja a seção própria).
- **Ícone próprio** na lista de scripts do Tampermonkey: um balão de conversa com o símbolo do Markdown (`assets/icon-128.png`, com o desenho vetorial em `assets/icon.svg`).
- **Nome do arquivo** com o título (truncado) e o momento da exportação: `Titulo_AAAA-MM-DD_HH-MM-SS.md`.

## Como instalar

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/) no navegador (Firefox, Chrome, Edge, Brave).
2. No painel do Tampermonkey, escolha **Criar novo script**.
3. Apague o conteúdo do editor e cole o código completo do arquivo `AIChat2MD.user.js`.
4. Salve com `Ctrl + S` (`Cmd + S` no Mac).
5. Abra uma conversa em uma das plataformas e recarregue a página (`F5`). O botão **`📥 Exportar Chat`** aparece no canto inferior direito, na cor da plataforma.

## Como atualizar

O `@namespace` do script é fixo, então uma nova versão **substitui** a instalada, sem criar um script novo:

- **Manual:** abra o script no Tampermonkey, apague o conteúdo do editor, cole o código novo e salve.
- **Automática:** o cabeçalho traz `@updateURL` e `@downloadURL` apontando para `AIChat2MD.user.js` na raiz da ramificação `main` deste repositório. O Tampermonkey verifica esse arquivo periodicamente e oferece a atualização quando o `@version` dele for maior que o instalado. Quando uma versão acrescenta domínios ao `@connect` (por exemplo `assets.grok.com` ou `drive.google.com`), o Tampermonkey pode pedir permissão na primeira vez; aceite.

## Como usar

1. Abra a conversa que deseja exportar.
2. Clique em **`📥 Exportar Chat`**, ou use o ícone do Tampermonkey e escolha **📥 Exportar para Markdown**.
3. Nas plataformas em que se aplica, uma caixa pergunta se você deseja incluir links e referências de anexos. Respondendo que **sim**, os arquivos e imagens geradas são baixados junto com o `.md`; respondendo **Cancelar**, só o texto é exportado.
4. O download do `.md` começa automaticamente. Em navegadores Chromium, o script pede a pasta uma única vez para gravar o `.md` e os arquivos juntos.

**Gemini:** a conversa precisa estar salva, com endereço no formato `gemini.google.com/app/...`.

**Google AI Studio:** o prompt precisa estar salvo, com endereço no formato `aistudio.google.com/prompts/...`.

**Google AI Mode:** a página precisa ser realmente uma busca em modo IA (endereço com `udm=50` ou `/ai`); uma busca comum do Google não mostra o botão.

**Grok:** a conversa precisa estar salva (endereço com `/c/...`) para a exportação pela API; fora disso, o script lê a página.

## Formato do arquivo

```markdown
# Título da conversa

**Data:** 2026-09-19 | **Fonte:** [Gemini](https://gemini.google.com/app/...) | **Exportador:** AI Chat to MD 4.0.0

---

**👤 Você:** *(2026-09-19 03:24)*

![[figura.png]]

Descreva esta figura.

---

**🤖 Gemini:**

A imagem apresenta...

*(2026-09-19 03:24)*

---
```

No Lumo e no AI Mode, a linha do cabeçalho fica assim: `**Exportado em:** 2026-09-19 02:30 *(o Lumo não informa data/hora por mensagem)*`.

No Perplexity: `**Conversa em:** 2026-09-18 21:45 *(o Perplexity informa uma única data para toda a conversa)*`. As mensagens saem sem hora.

Referências, no Perplexity, no Grok e no AI Studio:

```markdown
A versão estável é a 3.14.8.[¹](https://www.python.org/downloads/)

**Referências:**

- **1.** [Download Python | Python.org](https://www.python.org/downloads/)
```

No Gemini, quando a resposta executa código, ele entra assim:

````markdown
> [!example]- Código executado pelo Gemini
>
> ```python
> print("oi")
> ```

> [!example]- Saída
>
> ```python
> oi
> ```
````

## Anexos, imagens e arquivos gerados no Obsidian

O exportador escreve os anexos como links do Obsidian, sempre **pelo nome do arquivo**, sem caminho:

- Imagens: `![[nome.png]]`. O Obsidian mostra a figura no corpo da nota.
- Outros arquivos (PDF, `.md`, `.tex`, `.js`, `.xlsx` e outros): `📎 **[[nome.pdf]]**`. O link abre o arquivo pelo Obsidian.

Para os links funcionarem, os arquivos precisam estar **dentro do cofre** do Obsidian, com o mesmo nome e a mesma extensão que aparecem no link. O que o exportador baixa sozinho, com a opção de anexos:

- **ChatGPT:** os arquivos gerados (planilhas, scripts, imagens do Python), pelo mesmo caminho que a página usa para baixá-los.
- **Perplexity:** os arquivos gerados (planilhas, scripts).
- **Grok:** os anexos que você enviou, as imagens geradas e os arquivos gerados.
- **Gemini:** as imagens geradas (o site salva com um nome aleatório que o script não consegue prever) e os arquivos gerados que não são imagem (`.xlsx`, `.js` etc.).
- **Google AI Studio:** os anexos que você enviou, guardados no Google Drive.
- **Google AI Mode:** os arquivos gerados (por exemplo `.xlsx` e `.png`) e as imagens do carrossel de pesquisa.
- **Claude e Lumo:** o script **não baixa** os arquivos; os anexos saem como links. Os arquivos que você enviou já estão no seu computador; os que o Claude apresentou precisam ser baixados na própria plataforma. O Lumo não gera nem baixa arquivos.

Os arquivos baixados caem na mesma pasta do `.md` (ou na pasta de downloads do navegador, se o navegador não permitir escolher a pasta; nesse caso mova-os para o cofre junto com o `.md`). Se algum arquivo não puder ser baixado, o `.md` é salvo e um aviso lista o motivo.

**Configurações recomendadas do Obsidian** (Configurações → Arquivos e links):

- **Usar [[Wikilinks]]:** ativado.
- **Formato para links novos:** Menor caminho possível.
- **Detectar todas as extensões dos arquivos:** ativado, para que arquivos como `.js` e `.tex` apareçam e abram pelos links.

**Use nomes de arquivo únicos.** Como o link não leva caminho, se o mesmo nome existir em várias pastas, o Obsidian pode abrir um arquivo diferente do esperado, sem avisar. Dentro de uma mesma exportação, nomes repetidos ganham ` (2)`, ` (3)`.

## Comandos de diagnóstico

Estes comandos aparecem no menu do Tampermonkey, só no site da plataforma correspondente, e servem para investigar como cada plataforma guarda anexos, arquivos e referências quando algo muda. Eles salvam só a **estrutura** dos dados (arquivo `.json`), com textos cortados e identificadores, tokens, e-mails, nomes, fotos de perfil e títulos do histórico omitidos. Revise o arquivo antes de compartilhá-lo.

- **🔍 ChatGPT: salvar diagnóstico (referências, anexos, imagens e arquivos)**
- **🔍 Claude: salvar diagnóstico (referências, anexos e arquivos)**
- **🔍 Perplexity: salvar diagnóstico (estrutura, fontes e anexos)**
- **🔍 Grok: salvar diagnóstico (estrutura, anexos e arquivos)**
- **🔍 Lumo: salvar diagnóstico (estrutura, anexos e arquivos)**
- **🔍 Gemini: salvar diagnóstico de anexos** (até 200 turnos) e **🔍 Gemini: testar download de imagens** (códigos de resposta do servidor ao pedir as imagens geradas)
- **🔍 AI Studio: salvar diagnóstico (estrutura, anexos e arquivos)**
- **🔍 AI Mode: salvar diagnóstico (estrutura, anexos e arquivos)**

Para os diagnósticos que repetem pedidos da página (Perplexity, Grok, AI Mode), recarregue a página (`F5`) antes de rodar o comando, para ela refazer as consultas.

## Limitações conhecidas

- **Lumo e AI Mode** não fornecem data/hora por mensagem; o **Perplexity** informa uma única data por conversa. O **Grok** só perde a hora se a API falhar e o script cair na leitura da página.
- **Lumo e AI Mode** usam extração por DOM: só o que a página renderiza é exportado. O AI Mode depende de seletores CSS do Google que podem mudar sem aviso a qualquer momento.
- **AI Mode:** o gráfico interativo da resposta (que muda com o zoom) não pode ser exportado como imagem fixa — o `.md` mostra um aviso; os dados costumam estar no código ao lado. O painel lateral de fontes não é exportado; só entram os links que estão no texto. Se você pedir uma imagem fixa, o AI Mode a entrega como arquivo, que a exportação baixa.
- **Lumo:** a lista do botão "Fontes" só existe na página depois de um clique e não é exportada.
- **Referências:** a exportação lista só as fontes citadas no texto, não todas as consultadas na busca (por exemplo, as "20 sources" do Grok). No AI Studio, os links vêm do redirecionamento do Google (`vertexaisearch.cloud.google.com`) e a página só informa o domínio; não se sabe por quanto tempo continuam válidos.
- **ChatGPT:** os parênteses em volta do link de origem (`( Python.org )`) vêm do próprio texto da plataforma.
- **Gemini — código colado pelo usuário:** a API não envia nenhuma marcação de formatação para o texto que o usuário digita ou cola na mensagem. Para essas linhas não quebrarem a estrutura do Markdown (por exemplo um comentário Python virando título), caracteres como `#`, `>`, `-`, `*`, `1.`, `---` e `` ``` `` no início de linha são escapados — o texto sai correto, mas sem a formatação visual de bloco de código.
- **Claude:** uma mensagem que tem só raciocínio interno (`thinking`), sem texto de resposta, não aparece no `.md`. Os arquivos apresentados pelo Claude saem só como link.
- **Palavras de interface removidas do texto:** a limpeza apaga as palavras `Copiar` e `Copy code` do conteúdo exportado. Se elas aparecerem no texto real de uma conversa, também podem ser apagadas.
- **Links:** saem como a plataforma os fornece, inclusive URLs longas e com tokens. Revise os links das conversas antes de compartilhar um `.md`.
- **Brave** bloqueia de propósito a API de escolha de pasta; nesse navegador o script usa o download clássico, arquivo por arquivo.
- O exportador depende da estrutura interna de cada plataforma, que pode mudar sem aviso. Se um botão ou uma extração parar de funcionar após uma atualização do site, rode o comando de diagnóstico da plataforma e abra uma *issue* com a plataforma, a mensagem de erro e o arquivo de diagnóstico (revisado).

## Histórico de versões

Veja o [CHANGELOG](CHANGELOG.md).

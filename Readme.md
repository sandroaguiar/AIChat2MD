# Universal AI Chat Exporter

Userscript para **Tampermonkey** que exporta conversas de plataformas de IA para arquivos **Markdown (`.md`)**, pensado para uso em cofres de gestão de conhecimento como o **Obsidian** (também funciona com Logseq, Bear, NotePlan e Drafts).

**Versão atual:** 3.8.24 · **Licença:** MIT · **Autor:** Sandro Aguiar & Collaborator

## Plataformas suportadas

| Plataforma | Endereço | Como extrai | Cor do botão | Data/hora das mensagens |
|---|---|---|---|---|
| ChatGPT | `chatgpt.com`, `chat.openai.com` | API interna | Verde `#10a37f` | Hora real de cada mensagem |
| Claude | `claude.ai` | API interna | Salmão `#e07a5f` | Hora real de cada mensagem |
| Perplexity | `perplexity.ai` | API interna | Ciano `#00bcd4` | Uma única data para a conversa, mostrada no cabeçalho; mensagens sem hora |
| Grok | `x.com/i/grok`, `grok.com` | DOM da página | Preto `#000000` | Não informada pela plataforma |
| Lumo (Proton) | `lumo.proton.me` | DOM da página | Roxo `#6d4aff` | Não informada pela plataforma |
| Gemini | `gemini.google.com` | API interna (`batchexecute`) | Azul `#1a73e8` | Hora real de cada turno |

**API × DOM:** a extração por API busca a conversa inteira, sem depender do que está desenhado na tela, e por isso não perde mensagens em conversas longas. A extração por DOM lê apenas o que a página renderiza.

## Recursos

- **Conversa completa** nas plataformas com API (ChatGPT, Claude, Perplexity, Gemini), sem rolagem manual.
- **Cabeçalho** com título, data, fonte (link da conversa) e versão do exportador.
- **Data e hora por mensagem** quando a plataforma fornece esse dado. Onde não fornece (Lumo e Grok), o cabeçalho mostra **"Exportado em"** com a data e hora da exportação, e as mensagens saem sem horário, para não sugerir um horário que não existe.
- **Anexos e imagens** como links do Obsidian (veja a seção abaixo).
- **Referências do Gemini:** os links de referência viram marcas `[1]` no texto e uma lista **Referências** ao final da resposta. As marcas internas `[cite: N]` do Gemini são removidas.
- **Listas numeradas, listas com marcadores e sublistas** no Lumo, com a numeração correta.
- **Fórmulas LaTeX** convertidas para o formato do Obsidian (`$...$` e `$$...$$`) e **blocos de código** mantidos nas plataformas que os fornecem como código.
- **Limpeza de interface:** rótulos de botões de cópia e, no Lumo, avisos e a área de digitação não entram no arquivo.
- **Botão flutuante** com a cor da plataforma, no canto inferior direito, e comando equivalente no menu do Tampermonkey.
- **Nome do arquivo** com o título (truncado) e o momento da exportação: `Titulo_AAAA-MM-DD_HH-MM-SS.md`.

## Como instalar

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/) no navegador (Firefox, Chrome, Edge, Brave).
2. No painel do Tampermonkey, escolha **Criar novo script**.
3. Apague o conteúdo do editor e cole o código completo do arquivo `.user.js`.
4. Salve com `Ctrl + S` (`Cmd + S` no Mac).
5. Abra uma conversa em uma das plataformas e recarregue a página (`F5`). O botão **`📥 Exportar Chat`** aparece no canto inferior direito, na cor da plataforma.

Ao atualizar de versão, **desative ou remova a versão anterior** no Tampermonkey. Duas versões ativas ao mesmo tempo podem duplicar o botão.

## Como usar

1. Abra a conversa que deseja exportar.
2. Clique em **`📥 Exportar Chat`**, ou use o ícone do Tampermonkey e escolha **📥 Exportar para Markdown**.
3. Nas plataformas em que se aplica, uma caixa pergunta se você deseja incluir links e referências de anexos.
4. O download do `.md` começa automaticamente.

**Gemini:** a conversa precisa estar salva, com endereço no formato `gemini.google.com/app/...`. Numa conversa nova, sem resposta ainda, não há o que exportar.

## Formato do arquivo

```markdown
# Título da conversa

**Data:** 2026-09-19 | **Fonte:** [Gemini](https://gemini.google.com/app/...) | **Exportador:** Universal AI Chat Exporter 3.8.24

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

No Lumo e no Grok, a linha do cabeçalho fica assim: `**Exportado em:** 2026-09-19 02:30 *(o Lumo não informa data/hora por mensagem)*`.

No Perplexity, a API informa uma única data para a conversa toda, e ela aparece assim: `**Conversa em:** 2026-09-18 21:45 *(o Perplexity informa uma única data para toda a conversa)*`. As mensagens saem sem hora.

## Anexos e imagens no Obsidian

O exportador escreve os anexos como links do Obsidian, sempre **pelo nome do arquivo**, sem caminho:

- Imagens: `![[nome.png]]`. O Obsidian mostra a figura no corpo da nota.
- Outros arquivos (PDF, `.md`, `.tex`, `.js` e outros): `📎 **[[nome.pdf]]**`. O link abre o arquivo pelo Obsidian.

O exportador **não baixa** os arquivos. Para os links funcionarem, coloque os arquivos originais **dentro do cofre** do Obsidian, com o mesmo nome e a mesma extensão que aparecem no link.

**Configurações recomendadas do Obsidian** (Configurações → Arquivos e links):

- **Usar [[Wikilinks]]:** ativado.
- **Formato para links novos:** Menor caminho possível.
- **Detectar todas as extensões dos arquivos:** ativado, para que arquivos como `.js` e `.tex` apareçam e abram pelos links.

**Use nomes de arquivo únicos.** Como o link não leva caminho, se o mesmo nome existir em várias pastas (por exemplo, `Anexos/figura.png` em dois projetos), o Obsidian pode abrir um arquivo diferente do esperado, sem avisar. Um prefixo do projeto ou a data no nome resolve.

## Diagnóstico do Gemini

No Gemini, o menu do Tampermonkey tem o comando **🔍 Gemini: salvar diagnóstico de anexos**. Ele baixa um `.json` com a **estrutura** dos dados da conversa atual, com os textos cortados em 60 caracteres e os links em 90, e inclui no máximo os 30 primeiros turnos. Serve para investigar como o Gemini guarda anexos e imagens. Revise o arquivo antes de compartilhá-lo.

## Limitações conhecidas

- **Lumo e Grok** não fornecem data/hora por mensagem no DOM. No Lumo, os identificadores das mensagens (`data-message-id`) também não trazem horário.
- **Lumo e Grok** usam extração por DOM: só o que a página renderiza é exportado.
- **Perplexity:** a API informa uma única data para a conversa inteira. Ela aparece no cabeçalho como "Conversa em", e as mensagens saem sem hora. Se a API não trouxer essa data, o cabeçalho mostra a data da exportação.
- **Palavras de interface removidas do texto:** a limpeza apaga as palavras `Copiar` e `Copy code` do conteúdo exportado. Se elas aparecerem no texto real de uma conversa, também são apagadas.
- **Gemini:** o adaptador trata anexos enviados pelo usuário. Imagens ou arquivos gerados pelo Gemini nas respostas ainda não foram mapeados.
- **Sanitização de links (inativa):** a função que deveria tratar links longos ou temporários usa uma expressão regular com um resíduo de escrita (`\vert{}` no lugar de `|`) e, por isso, nunca reconhece nenhum link. Na prática, os links saem como a plataforma os fornece, inclusive URLs longas e com tokens. Mesmo corrigida, a função apenas ajustaria o rótulo do link, sem remover a URL. Revise os links das conversas antes de compartilhar um `.md`.
- O exportador depende da estrutura interna de cada plataforma, que pode mudar sem aviso. Se um botão ou uma extração parar de funcionar após uma atualização do site, abra uma *issue* com a plataforma e a mensagem de erro.

## Histórico de versões

Veja o [CHANGELOG](CHANGELOG.md).

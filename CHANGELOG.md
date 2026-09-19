# 📋 Changelog - Universal AI Chat Exporter

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
  
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).



# Histórico de versões — série 3.8.x

Entradas da **3.8.14** à **3.8.24**, da mais recente para a mais antiga. 

**Regra de compatibilidade da série:** o código de ChatGPT e Claude não foi alterado desde a 3.7.4, o do Perplexity só mudou na 3.8.24 (horário das mensagens), e a posição do botão flutuante (`bottom: 20px; right: 140px`) não mudou.

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


#### Script da versão 3.7.4:

// ==UserScript==
// @name         Universal AI Chat Exporter
// @namespace    https://github.com/sandroaguiar/exportfullchat2md-v3.7.4
// @version      3.7.4
// @description  Exporta conversas do ChatGPT, Claude, Perplexity, Grok (com correção de blocos de código DOM) e Lumo em Markdown.
// @author       Sandro Aguiar & Collaborator
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://lumo.proton.me/*
// @match        https://*.lumo.proton.me/*
// @match        https://x.com/i/grok*
// @match        https://grok.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var SCRIPT_NAME_VERSION = 'Universal AI Chat Exporter 3.7.4';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;

        var button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        button.innerHTML = '📥 Exportar Chat';
        
        var baseStyles = 'position: fixed !important; bottom: 20px !important; right: 140px !important; z-index: 2147483647 !important; padding: 10px 16px !important; border-radius: 6px !important; color: #ffffff !important; border: none !important; cursor: pointer !important; font-size: 13px !important; font-weight: bold !important; box-shadow: 0px 4px 6px rgba(0,0,0,0.1) !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important;';

        var href = window.location.href;
        var bgColor = '#10a37f';

        if (href.includes('claude.ai')) {
            bgColor = '#e07a5f';
        } else if (href.includes('perplexity.ai')) {
            bgColor = '#00bcd4';
        } else if (href.includes('lumo.proton.me') || href.includes('lumo')) {
            bgColor = '#6d4aff';
        } else if (href.includes('x.com/i/grok') || href.includes('grok.com')) {
            bgColor = '#000000';
        }

        button.style.cssText = baseStyles + ' background-color: ' + bgColor + ' !important;';

        button.addEventListener('mouseover', function() { button.style.opacity = '0.85'; });
        button.addEventListener('mouseout', function() { button.style.opacity = '1'; });
        button.addEventListener('click', startExportProcess);

        if (document.body) {
            document.body.appendChild(button);
        }
    }

    function formatTimestampForFilename(date) {
        if (!date) date = new Date();
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        var hours = String(date.getHours()).padStart(2, '0');
        var minutes = String(date.getMinutes()).padStart(2, '0');
        var seconds = String(date.getSeconds()).padStart(2, '0');
        return year + '-' + month + '-' + day + '_' + hours + '-' + minutes + '-' + seconds;
    }

    function formatMessageTimestamp(dateInput) {
        if (!dateInput) return '';
        var d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';

        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');

        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
    }

    function sanitizeMarkdownLinks(markdownContent) {
        if (!markdownContent) return '';
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+\vert{}blob:https?:\/\/[^\s)]+)\)/g;
        
        let cleaned = markdownContent.replace(mdLinkRegex, function(match, text, url) {
            if (url.startsWith('blob:') || url.length > 120 || url.includes('amazonaws.com') || url.includes('token=')) {
                let cleanLabel = (text && text.length < 60 && !text.includes('http')) ? text : '📎 Anexo';
                return `[${cleanLabel}](${url})`;
            }
            return match;
        });
        return cleaned;
    }

    function cleanRawText(text) {
        if (!text) return '';
        text = text.replace(/This block is not supported on your current device yet\.?/gi, '');
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uEF00-\uEFFF]/g, '');
        text = text.replace(/```[\s\n]*```/g, '');
        text = text.replace(/Copy\s*Copy code\s*/gi, '');
        text = text.replace(/Copy code\s*/gi, '');
        text = text.replace(/\bCopiarCopiar\b/g, '');
        text = text.replace(/\bCopiar\b/g, '');

        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, function(match, mathCode) {
            return '\n$$\n' + mathCode.trim() + '\n$$\n';
        });
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, function(match, mathCode) {
            return '$' + mathCode.trim() + '$';
        });

        return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // ==========================================
    // MÓDULO CHATGPT (Congelado/Estável)
    // ==========================================
    function extractChatGPTTextFromParts(parts, includeImages, attachments) {
        var textSegments = [];
        var imageCounter = 1;
        if (attachments && attachments.length > 0) {
            attachments.forEach(function(att) {
                var fileName = att.name || 'Arquivo_Anexo';
                textSegments.push('📎 **Anexo:** [[' + fileName + ']]\n');
            });
        }
        parts.forEach(function(part) {
            if (typeof part === 'string') {
                textSegments.push(part);
            } else if (typeof part === 'object' && part !== null) {
                if (part.content_type === 'image_asset_pointer' && includeImages) {
                    textSegments.push('\n![Imagem ' + imageCounter + '](imagem_' + imageCounter + '.png)\n');
                    imageCounter++;
                } else if (part.text) {
                    textSegments.push(part.text);
                }
            }
        });
        return cleanRawText(textSegments.join('\n'));
    }

    async function exportChatGPT(includeImages) {
        var match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
        var conversationId = match ? match[1] : null;
        if (!conversationId) throw new Error('Abra uma conversa salva na barra lateral do ChatGPT.');
        var sessionRes = await fetch('/api/auth/session').then(function(r) { return r.json(); });
        var token = sessionRes ? sessionRes.accessToken : null;
        var response = await fetch('/backend-api/conversation/' + conversationId, {
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        var data = await response.json();
        var mapping = data.mapping;
        var orderedMessages = [];
        var currentNodeId = data.current_node;

        while (currentNodeId) {
            var node = mapping[currentNodeId];
            if (node && node.message) {
                var role = node.message.author.role;
                if (role === 'user' || role === 'assistant') {
                    var parts = (node.message.content && node.message.content.parts) || [];
                    var attachments = (node.message.metadata && node.message.metadata.attachments) || [];
                    var text = extractChatGPTTextFromParts(parts, includeImages, attachments);
                    var timeFormatted = formatMessageTimestamp(node.message.create_time * 1000);
                    if (text.length > 0) {
                        orderedMessages.unshift({
                            sender: role === 'user' ? '👤 Você' : '🤖 ChatGPT',
                            timestamp: timeFormatted,
                            isUser: role === 'user',
                            content: text
                        });
                    }
                }
            }
            currentNodeId = node ? node.parent : null;
        }
        return { title: data.title || 'Conversa ChatGPT', messages: orderedMessages, source: 'ChatGPT' };
    }

    // ==========================================
    // MÓDULO CLAUDE (Congelado/Estável)
    // ==========================================
    function formatClaudeMessage(msg, includeImages) {
        var isUser = (msg.sender === 'human');
        var contentSegments = [];
        if (includeImages && msg.attachments) {
            msg.attachments.forEach(function(att) {
                contentSegments.push('📎 **Anexo:** [[' + (att.file_name || 'Arquivo') + ']]');
            });
        }
        if (msg.content && Array.isArray(msg.content)) {
            msg.content.forEach(function(c) {
                if (c.type === 'text') contentSegments.push(c.text);
            });
        } else if (typeof msg.text === 'string') {
            contentSegments.push(msg.text);
        }
        return {
            sender: isUser ? '👤 Você' : '🤖 Claude',
            timestamp: formatMessageTimestamp(msg.created_at),
            isUser: isUser,
            content: cleanRawText(contentSegments.join('\n\n'))
        };
    }

    async function exportClaude(includeImages) {
        var match = window.location.pathname.match(/\/chat\/([a-f0-9-]+)/);
        var chatId = match ? match[1] : null;
        if (!chatId) throw new Error('Abra uma conversa salva no Claude.ai.');
        
        var orgsRes = await fetch('/api/organizations').then(function(r) { return r.json(); });
        if (!orgsRes || orgsRes.length === 0) throw new Error('Organização do Claude não encontrada.');
        var orgId = orgsRes[0].uuid;

        var chatRes = await fetch('/api/organizations/' + orgId + '/chat_conversations/' + chatId + '?tree=true');
        var data = await chatRes.json();
        
        var rawMessages = data.chat_messages || data.messages || [];
        var orderedMessages = [];
        
        rawMessages.forEach(function(m) {
            var fmt = formatClaudeMessage(m, includeImages);
            if (fmt.content) orderedMessages.push(fmt);
        });

        if (orderedMessages.length === 0) {
            throw new Error('Nenhuma mensagem encontrada na conversa do Claude.');
        }

        return { title: data.name || 'Conversa Claude', messages: orderedMessages, source: 'Claude' };
    }

    // ==========================================
    // MÓDULO PERPLEXITY (Congelado/Estável)
    // ==========================================
    const PerplexityAdapter = {
        getCurrentConversationId: function() {
            const match = window.location.pathname.match(/^\/search\/([^\/?]+)/);
            return match ? match[1] : null;
        },
        getConversationDetails: async function(id) {
            const url = `/rest/thread/${id}?with_parent_info=true&with_schematized_response=true&limit=50&offset=0&from_first=true`;
            const r = await fetch(url, { credentials: 'include' });
            return await r.json();
        },
        toMarkdownData: function(data) {
            const meta = data?.thread_metadata || {};
            const messages = [];
            const globalTime = meta.created_at ? formatMessageTimestamp(new Date(meta.created_at)) : '';
            (data?.entries || []).forEach(function(entry) {
                if (entry?.query_str) {
                    messages.push({ sender: '👤 Você', timestamp: globalTime, isUser: true, content: cleanRawText(entry.query_str) });
                }
                const mb = entry?.blocks?.find((b) => b.markdown_block && b.intended_usage === 'ask_text');
                if (mb?.markdown_block?.answer) {
                    messages.push({ sender: '🤖 Perplexity', timestamp: globalTime, isUser: false, content: cleanRawText(mb.markdown_block.answer) });
                }
            });
            return { title: meta.title || 'Conversa Perplexity', source: 'Perplexity', messages: messages };
        }
    };

    async function exportPerplexity(includeImages) {
        var chatId = PerplexityAdapter.getCurrentConversationId();
        if (!chatId) throw new Error('Abra uma conversa salva no Perplexity.');
        var rawData = await PerplexityAdapter.getConversationDetails(chatId);
        return PerplexityAdapter.toMarkdownData(rawData);
    }

    // ==========================================
    // MÓDULO GROK (Corrigido para blocos de código limpos)
    // ==========================================
    function parseGrokNodeToMarkdown(node, isInCodeBlock = false) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            if (isInCodeBlock) return text;
            // Remove lixos comuns de botões do Grok perdidos no texto
            if (text.trim() === 'Copiar' || text.trim() === 'Copy' || text.trim() === 'Python') return '';
            return text;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        var tag = node.tagName.toLowerCase();
        var isCode = tag === 'code' || tag === 'pre' || node.classList.contains('code-block') || node.querySelector('code');
        var nextInCode = isInCodeBlock || isCode;

        var innerContent = '';
        for (var i = 0; i < node.childNodes.length; i++) {
            innerContent += parseGrokNodeToMarkdown(node.childNodes[i], nextInCode);
        }

        if (tag === 'pre') return '\n\n```python\n' + innerContent.trim() + '\n```\n\n';
        if (tag === 'code' && !node.closest('pre')) return '`' + innerContent.trim() + '`';
        if (tag === 'p' || tag === 'div') {
            if (isInCodeBlock) return innerContent + '\n';
            return '\n\n' + innerContent.trim() + '\n\n';
        }
        if (tag === 'br') return '\n';
        if ((tag === 'strong' || tag === 'b') && !isInCodeBlock) return '**' + innerContent.trim() + '**';
        if ((tag === 'em' || tag === 'i') && !isInCodeBlock) return '*' + innerContent.trim() + '*';

        return innerContent;
    }

    async function exportGrok() {
        var titleEl = document.querySelector('h1, header h2, title');
        var title = titleEl ? titleEl.textContent.trim().replace(/^Grok:\s*/i, '') : 'Conversa Grok';
        var messages = [];
        var currentTimestamp = formatMessageTimestamp(new Date());

        var messageNodes = document.querySelectorAll('div[data-testid="chat-message"], div.message-row, article, div[class*="message"]');

        messageNodes.forEach(function(node) {
            var textContent = node.textContent ? node.textContent.toLowerCase() : '';
            if (
                textContent.includes('grok can make mistakes') || 
                textContent.includes('grok pode cometer erros') ||
                textContent.includes('terms of service')
            ) {
                return;
            }

            var isUser = node.getAttribute('data-is-user') === 'true' || 
                         node.className.toLowerCase().includes('user') || 
                         node.querySelector('div[data-testid="fruit-user-avatar"], img[alt*="Avatar"]') !== null;

            var text = cleanRawText(parseGrokNodeToMarkdown(node, false));
            if (!text || text.length < 2) return;

            messages.push({
                sender: isUser ? '👤 Você' : '🤖 Grok',
                timestamp: currentTimestamp,
                isUser: isUser,
                content: text
            });
        });

        if (messages.length === 0) {
            throw new Error('Nenhuma mensagem identificada no Grok. Certifique-se de que a conversa está visível na tela.');
        }

        return { title: title, source: 'Grok', messages: messages };
    }

    // ==========================================
    // MÓDULO LUMO (Congelado/Estável)
    // ==========================================
    function parseNodeToMarkdown(node, indentLevel = 0) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        var tag = node.tagName.toLowerCase();
        
        if (node.classList.contains('file-card-group') || node.classList.contains('file-card') || node.querySelector('.file-card-info-text')) {
            var titleEl = node.querySelector('.file-card-info-text p, p, span');
            var fileName = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : 'Anexo';
            fileName = fileName.trim().replace(/\s+/g, ' ');
            return ` 📎 **[[${fileName}]]** `;
        }

        var innerContent = '';
        for (var i = 0; i < node.childNodes.length; i++) {
            innerContent += parseNodeToMarkdown(node.childNodes[i], indentLevel);
        }

        if (tag === 'p' || tag === 'div') return '\n\n' + innerContent.trim() + '\n\n';
        if (tag === 'br') return '\n';
        if (tag === 'strong' || tag === 'b') return '**' + innerContent.trim() + '**';
        if (tag === 'em' || tag === 'i') return '*' + innerContent.trim() + '*';
        if (tag === 'code') return '`' + innerContent.trim() + '`';

        return innerContent;
    }

    async function exportLumo() {
        var titleEl = document.querySelector('h1, header h2, title');
        var title = titleEl ? titleEl.textContent.trim().replace(/^Lumo:\s*/i, '') : 'Conversa Lumo';
        var messages = [];
        var currentTimestamp = formatMessageTimestamp(new Date());

        var messageNodes = document.querySelectorAll('div.lumo-chat-item, main div[data-message-role]');

        messageNodes.forEach(function(node) {
            var roleAttr = node.getAttribute('data-message-role') || '';
            var classList = node.className ? node.className.toLowerCase() : '';
            var isUser = roleAttr === 'user' || classList.includes('user-msg') || classList.includes('human');
            
            var textContainer = node.querySelector('.lumo-markdown, .workspace-markdown, div[class*="markdown"]') || node;
            var text = cleanRawText(parseNodeToMarkdown(textContainer, 0));

            if (!text || text.length < 2) return;
            if (text.includes('O Lumo pode cometer erros') || text.includes('Conversa criptografada') || text === title) return;

            messages.push({
                sender: isUser ? '👤 Você' : '🤖 Lumo',
                timestamp: currentTimestamp,
                isUser: isUser,
                content: text
            });
        });

        if (messages.length === 0) throw new Error('Nenhuma mensagem identificada no Lumo.');
        return { title: title, source: 'Lumo', messages: messages };
    }

    // ==========================================
    // ORQUESTRADOR
    // ==========================================
    async function startExportProcess() {
        var href = window.location.href;
        var button = document.getElementById('export-markdown-button-float');
        if (button) { button.disabled = true; button.innerHTML = '⏳ Baixando...'; }

        try {
            var includeImages = confirm("Deseja incluir links e referências de anexos?");
            var result;

            if (href.includes('claude.ai')) result = await exportClaude(includeImages);
            else if (href.includes('chatgpt.com') || href.includes('chat.openai.com')) result = await exportChatGPT(includeImages);
            else if (href.includes('perplexity.ai')) result = await exportPerplexity(includeImages);
            else if (href.includes('x.com/i/grok') || href.includes('grok.com')) result = await exportGrok();
            else if (href.includes('lumo.proton.me') || href.includes('lumo')) result = await exportLumo();
            else throw new Error('Plataforma não suportada.');

            var lines = [];
            var timestampSuffix = formatTimestampForFilename(new Date());
            var displayDate = timestampSuffix.split('_')[0];

            lines.push('# ' + result.title + '\n');
            lines.push('**Data:** ' + displayDate + ' | **Fonte:** [' + result.source + '](' + window.location.href + ') | **Exportador:** ' + SCRIPT_NAME_VERSION + '\n');
            lines.push('---\n');

            result.messages.forEach(function(msg) {
                var timeTag = msg.timestamp ? '*(' + msg.timestamp + ')*' : '';
                if (msg.isUser) {
                    lines.push('**' + msg.sender + ':** ' + timeTag + '\n');
                    lines.push(msg.content);
                } else {
                    lines.push('**' + msg.sender + ':**\n');
                    lines.push(msg.content);
                    if (timeTag) lines.push('\n' + timeTag);
                }
                lines.push('\n---\n');
            });

            var markdown = sanitizeMarkdownLinks(lines.join('\n').trim());
            var safeTitle = (result.title || 'chat').replace(/[/\\?%*:|"<>]/g, '_').trim().substring(0, 25);
            var filename = safeTitle + '_' + timestampSuffix + '.md';

            var blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            var a = document.createElement('a');
            a.download = filename;
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            alert('Falha ao exportar: ' + (err.message || err));
        } finally {
            if (button) { button.disabled = false; button.innerHTML = '📥 Exportar Chat'; }
        }
    }

    setInterval(createFloatingButton, 1500);
})();


    
      
    

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




## [1.2.0] - 2024-10-12

### Adicionado

- Sistema de notificações por e-mail personalizável.
    
      
    
- Atalhos de teclado para navegação rápida.
    
      
    

### Corrigido

- Erro ao exportar relatórios em formato PDF com caracteres especiais.
    
      
    

## [1.1.0] - 2024-06-30

### Adicionado

- Suporte inicial a internacionalização (Inglês e Português).
    
      
    
- Mecanismo de cache para consultas frequentes.
    
      
    

### Alterado

- Melhorias no layout de telas menores (responsividade mobile).
    
      
    

## [1.0.0] - 2024-01-15

### Adicionado

- Lançamento oficial da versão estável do produto.
    
      
    
- Módulo principal de gerenciamento de usuários e autenticação.
    
      
    
- Painel de controle básico com métricas principais.
    
      
    
- Suporte inicial a banco de dados relacional.

// ==UserScript==
// @name         Universal AI Chat Exporter
// @namespace    https://github.com/sandroaguiar/Universal-AI-Chat-Exporter2MD
// @version      3.8.26
// @description  Tampermonkey userscript that exports AI chats (ChatGPT, Claude, Gemini, Perplexity, Grok, Lumo) to Markdown for Obsidian: full history via API where available, attachment links, and per-message timestamps where the platform provides them.
// @description:pt-BR  Userscript do Tampermonkey que exporta conversas de IA (ChatGPT, Claude, Gemini, Perplexity, Grok, Lumo) para Markdown, para uso no Obsidian: histórico completo via API quando disponível, links de anexos e hora por mensagem quando a plataforma fornece.
// @author       Sandro Aguiar & Collaborator
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://lumo.proton.me/*
// @match        https://*.lumo.proton.me/*
// @match        https://x.com/i/grok*
// @match        https://grok.com/*
// @match        https://gemini.google.com/*
// @icon         https://raw.githubusercontent.com/sandroaguiar/Universal-AI-Chat-Exporter2MD/main/assets/icon-128.png
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var SCRIPT_NAME_VERSION = 'Universal AI Chat Exporter 3.8.26';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
        if (window.location.hostname === 'gemini.google.com') {
            GM_registerMenuCommand("🔍 Gemini: salvar diagnóstico de anexos", geminiDiagnostic);
        }
    }

    function isGeminiHost() {
        return window.location.hostname === 'gemini.google.com';
    }

    // No Gemini (Trusted Types) innerHTML é bloqueado; nas demais plataformas o comportamento original é mantido.
    function setButtonLabel(btn, label) {
        if (isGeminiHost()) { btn.textContent = label; } else { btn.innerHTML = label; }
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;

        var button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        setButtonLabel(button, '📥 Exportar Chat');
        
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
        } else if (href.includes('gemini.google.com')) {
            bgColor = '#1a73e8';
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
                    messages.push({ sender: '👤 Você', timestamp: '', isUser: true, content: cleanRawText(entry.query_str) });
                }
                const mb = entry?.blocks?.find((b) => b.markdown_block && b.intended_usage === 'ask_text');
                if (mb?.markdown_block?.answer) {
                    messages.push({ sender: '🤖 Perplexity', timestamp: '', isUser: false, content: cleanRawText(mb.markdown_block.answer) });
                }
            });
            // 3.8.24: o Perplexity informa uma única data para a conversa toda; ela vai para o cabeçalho (headerTime), não para cada mensagem.
            return { title: meta.title || 'Conversa Perplexity', source: 'Perplexity', messages: messages, headerTime: globalTime };
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
        // 3.8.21: a página do Grok não informa data/hora por mensagem; não usamos mais a hora da exportação em cada uma.

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
                timestamp: '',
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
    // Listas do Lumo (3.8.15): <ol> vira 1. 2. 3. (respeitando start), <ul> vira "- ", com aninhamento por indentação.
    function lumoRenderListItems(listNode, level) {
        var ordered = listNode.tagName.toLowerCase() === 'ol';
        var counter = 1;
        if (ordered) {
            var startAttr = parseInt(listNode.getAttribute('start'), 10);
            if (!isNaN(startAttr)) counter = startAttr;
        }
        var indent = '    '.repeat(Math.max(0, level));
        var out = '';

        for (var i = 0; i < listNode.childNodes.length; i++) {
            var child = listNode.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
                if (child.textContent.trim()) out += indent + '- ' + child.textContent.trim() + '\n';
                continue;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) continue;

            if (child.tagName.toLowerCase() !== 'li') {
                out += parseNodeToMarkdown(child, level);
                continue;
            }

            var marker = ordered ? (counter++) + '. ' : '- ';
            var inline = '';
            var nested = '';
            for (var j = 0; j < child.childNodes.length; j++) {
                var sub = child.childNodes[j];
                var subTag = (sub.nodeType === Node.ELEMENT_NODE) ? sub.tagName.toLowerCase() : '';
                if (subTag === 'ul' || subTag === 'ol') {
                    nested += lumoRenderListItems(sub, level + 1);
                } else {
                    inline += parseNodeToMarkdown(sub, level + 1);
                }
            }
            inline = inline.trim().replace(/\n\s*\n/g, '\n').replace(/\n/g, '\n' + indent + '    ');
            out += indent + marker + inline + '\n' + nested;
        }
        return out;
    }

    function parseNodeToMarkdown(node, indentLevel = 0) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        var tag = node.tagName.toLowerCase();
        
        if (node.classList.contains('file-card-group') || node.classList.contains('file-card') || node.querySelector('.file-card-info-text') || node.matches('[class*="file-card"]')) {
            var titleEl = node.querySelector('.file-card-info-text p, p, span');
            var fileName = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : 'Anexo';
            fileName = fileName.trim().replace(/\s+/g, ' ');

            // 3.8.16: mapeia links temporários (blob:/http) de imagens do cartão; ignora data: URIs para não inflar o .md
            var imgEl = node.querySelector('img');
            var fileUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';
            if (fileUrl && /^(blob:|https?:)/i.test(fileUrl)) {
                return ` [📎 ${fileName}](${fileUrl}) `;
            }
            return ` 📎 **[[${fileName}]]** `;
        }

        if (tag === 'ul' || tag === 'ol') {
            return '\n' + lumoRenderListItems(node, indentLevel) + '\n';
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
        if (tag === 'li') return '- ' + innerContent.trim() + '\n';

        return innerContent;
    }

    // 3.8.17: cartões de anexo do Lumo ficam FORA do bloco de texto (.lumo-markdown), num contêiner ao lado.
    // Imagens viram ![[nome]] (Obsidian exibe se o arquivo estiver na mesma pasta); demais arquivos viram 📎 **[[nome]]**.
    function lumoCardToMarkdown(card) {
        var titleEl = card.querySelector('.file-title, .file-card-info-text p');
        var name = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '';
        name = (name || '').trim().replace(/\s+/g, ' ');
        var subEl = card.querySelector('.file-subtitle');
        var kind = subEl ? (subEl.getAttribute('title') || subEl.textContent || '') : '';
        if (!name) name = 'Anexo';
        var isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name) || /image|imagem/i.test(kind);
        return isImage ? '![[' + name + ']]' : '📎 **[[' + name + ']]**';
    }

    async function exportLumo() {
        var titleEl = document.querySelector('h1, header h2, title');
        var title = titleEl ? titleEl.textContent.trim().replace(/^Lumo:\s*/i, '') : 'Conversa Lumo';
        var messages = [];
        // 3.8.18: o Lumo não expõe data/hora por mensagem (DOM e data-message-id não trazem horário),
        // então não usamos mais a hora da exportação como se fosse a de cada mensagem.

        var messageNodes = document.querySelectorAll('div.lumo-chat-item, main div[data-message-role]');
        // 3.8.20: mensagens reais do Lumo têm data-message-id. Blocos sem esse atributo (aviso "Este chat expira",
        // área de digitação, seletor de modelo) não são mensagens. Se a página não tiver nenhum id, mantém o comportamento antigo.
        var pageHasMessageIds = document.querySelectorAll('[data-message-id]').length > 0;

        messageNodes.forEach(function(node) {
            if (pageHasMessageIds && !node.getAttribute('data-message-id')) return;
            var roleAttr = node.getAttribute('data-message-role') || '';
            var classList = node.className ? node.className.toLowerCase() : '';
            var isUser = roleAttr === 'user' || classList.includes('user-msg') || classList.includes('human');
            
            var textContainer = node.querySelector('.lumo-markdown, .workspace-markdown, div[class*="markdown"]') || node;
            // 3.8.17: anexos (cartões fora do bloco de texto)
            var cardNodes = Array.prototype.slice.call(node.querySelectorAll('.file-card'));
            var textSource = textContainer;
            if (cardNodes.length > 0 && textContainer === node) {
                // mensagem sem .lumo-markdown: lê o texto sem os cartões, para não duplicar nem engolir o texto
                textSource = node.cloneNode(true);
                textSource.querySelectorAll('.file-card').forEach(function(c) { c.remove(); });
            }
            var text = cleanRawText(parseNodeToMarkdown(textSource, 0));

            var attachLines = [];
            cardNodes.forEach(function(card) {
                if (textContainer !== node && textContainer.contains(card)) return;
                if (card.parentElement && card.parentElement.closest('.file-card')) return;
                attachLines.push(lumoCardToMarkdown(card));
            });

            if ((!text || text.length < 2) && attachLines.length === 0) return;
            if (text === title) return;

            // Campo de digitação do Lumo (começa sempre com esse texto)
            if (text.indexOf('Pergunte qualquer coisa') === 0) return;

            // 3.8.19: mensagens reais do chat têm data-message-id. Os filtros de texto de interface só valem para
            // blocos SEM esse atributo; antes, uma mensagem que apenas mencionava "Conversa criptografada" era descartada.
            var isRealMessage = !!node.getAttribute('data-message-id');
            if (!isRealMessage) {
                if (
                    text.includes('O Lumo pode cometer erros') ||
                    text.includes('Conversa criptografada') ||
                    text.includes('Mostrar barra lateral') ||
                    text.includes('Mostrar painel de conhecimento') ||
                    text.includes('Bate-papo atual:') ||
                    (text.includes('Ferramentas') && text.length < 40)
                ) {
                    return;
                }
            }

            if (attachLines.length > 0) {
                text = attachLines.join('\n') + (text ? '\n\n' + text : '');
            }

            messages.push({
                sender: isUser ? '👤 Você' : '🤖 Lumo',
                timestamp: '',
                isUser: isUser,
                content: text
            });
        });

        if (messages.length === 0) throw new Error('Nenhuma mensagem identificada no Lumo.');
        return { title: title, source: 'Lumo', messages: messages };
    }

    // ==========================================
    // MÓDULO GEMINI (Novo na 3.8.x - via API interna batchexecute)
    // ==========================================
    // RPCs usados (mesmo mecanismo do AfterChat):
    //   - hNvQHb : conversa completa  -> ["c_<ID>", 500, null, 1, [0], [4], null, 1]
    //   - MaZiqc : lista de conversas -> [20, "<cursor>", [0, null, 1]] (usado só para achar o título)
    var GeminiAdapter = {
        _titleCache: {},

        getAccountPrefix: function() {
            var m = window.location.pathname.match(/^\/u\/(\d+)\//);
            return m ? '/u/' + m[1] : '';
        },

        getCurrentConversationId: function() {
            var m = window.location.pathname.match(/\/app\/([^\/?#]+)/);
            return m ? m[1] : null;
        },

        _pageParams: function() {
            var bl = 'boq_assistant-bard-web-server_20260730.21_p0';
            var sid = '0';
            try {
                var entries = performance.getEntriesByType('resource');
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].name.indexOf('batchexecute') !== -1) {
                        var blm = entries[i].name.match(/bl=([^&]+)/);
                        if (blm) bl = decodeURIComponent(blm[1]);
                        var sm = entries[i].name.match(/f\.sid=(-?\d+)/);
                        if (sm) sid = sm[1];
                        break;
                    }
                }
            } catch (e) { /* ignora */ }
            return { bl: bl, sid: sid };
        },

        _getAtToken: function() {
            var at = '';
            try {
                var html = document.documentElement.innerHTML;
                var m = html.match(/"SNlM0e":"([^"]+)"/);
                if (m) {
                    at = m[1];
                } else {
                    var m2 = html.match(/[A-Za-z0-9_-]{20,}:\d{13}/);
                    if (m2) at = m2[0];
                }
            } catch (e) { /* ignora */ }
            return at;
        },

        _newUuid: function() {
            var u;
            try {
                u = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() :
                    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random() * 16 | 0;
                        var v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
            } catch (e) { u = '00000000-0000-4000-8000-000000000000'; }
            return u.toUpperCase();
        },

        _rpc: async function(rpc, proto, sourcePath) {
            var pp = this._pageParams();
            var at = this._getAtToken();
            if (!at) throw new Error('Token de sessão (SNlM0e) não encontrado na página do Gemini. Recarregue a página (F5) e tente novamente.');

            var headers = {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                'X-Same-Domain': '1',
                'x-goog-ext-73010989-jspb': '[0]',
                'x-goog-ext-525001261-jspb': '[1,null,null,null,null,null,null,null,[4,5,6,8],null,null,null,null,null,3,1,"' + this._newUuid() + '"]'
            };

            var params = new URLSearchParams({
                'rpcids': rpc,
                'source-path': sourcePath,
                'bl': pp.bl,
                'f.sid': pp.sid,
                'hl': 'en',
                '_reqid': String(Date.now() % 10000000),
                'rt': 'c'
            });

            var body = 'f.req=' + encodeURIComponent(JSON.stringify([[[rpc, proto, null, 'generic']]])) +
                       '&at=' + encodeURIComponent(at) + '&';

            var url = this.getAccountPrefix() + '/_/BardChatUi/data/batchexecute?' + params.toString();
            var r = await fetch(url, { method: 'POST', headers: headers, body: body, credentials: 'include' });
            if (!r.ok) throw new Error('RPC ' + rpc + ' falhou: HTTP ' + r.status + ' ' + r.statusText);

            var text = await r.text();
            var lines = text.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var t = lines[i].trim();
                if (t.charAt(0) !== '[') continue;
                var arr;
                try { arr = JSON.parse(t); } catch (e) { continue; }
                if (!Array.isArray(arr)) continue;
                for (var j = 0; j < arr.length; j++) {
                    var item = arr[j];
                    if (Array.isArray(item) && item[0] === 'wrb.fr' && item[1] === rpc) {
                        if (typeof item[2] === 'string') return JSON.parse(item[2]);
                        throw new Error('RPC ' + rpc + ' retornou sem dados.');
                    }
                }
            }
            throw new Error('Não foi possível interpretar a resposta do RPC ' + rpc + '.');
        },

        _lookupTitle: async function(id) {
            var cursor = null;
            for (var i = 0; i < 20; i++) {
                var proto = JSON.stringify([20, cursor || '', [0, null, 1]]);
                var data = await this._rpc('MaZiqc', proto, this.getAccountPrefix() + '/app');
                var items = (data && data[2]) || [];
                for (var k = 0; k < items.length; k++) {
                    var c = items[k];
                    if (String(c[0] || '').replace(/^c_/, '') === String(id)) return c[1] || '';
                }
                cursor = (data && data[1]) || null;
                if (!cursor || !cursor.length) break;
                await new Promise(function(res) { setTimeout(res, 150); });
            }
            return '';
        },

        getConversationDetails: async function(id) {
            var proto = JSON.stringify(['c_' + id, 500, null, 1, [0], [4], null, 1]);
            var data = await this._rpc('hNvQHb', proto, this.getAccountPrefix() + '/app/' + id);
            var title = '';
            try { title = await this._lookupTitle(id); } catch (e) { console.warn('Gemini: título não obtido pela lista.', e); }
            if (!title) {
                title = (document.title || '').replace(/\s*[-–—|]\s*Google Gemini\s*$/i, '').trim();
                if (!title || /^Google Gemini$/i.test(title)) title = 'Conversa Gemini';
            }
            return { turns: (data && data[0]) || [], title: title };
        },

        // 3.8.23: anexos do usuário. Estrutura observada no diagnóstico: turn[2][0][4] = [ [null,null,null, NOVOS, TODOS] ],
        // onde NOVOS = anexos enviados nesta mensagem; cada anexo = [null, tipo, nome, url, ..., mime (índice 11)].
        _mimeExts: {
            'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/gif': ['.gif'],
            'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'], 'text/csv': ['.csv'],
            'application/json': ['.json'], 'text/html': ['.html']
        },

        _userAttachments: function(user) {
            var out = [];
            try {
                var msg = (Array.isArray(user) && Array.isArray(user[0])) ? user[0] : null;
                var groups = (msg && Array.isArray(msg[4])) ? msg[4] : [];
                groups.forEach(function(g) {
                    var list = (Array.isArray(g) && Array.isArray(g[3])) ? g[3] : [];
                    list.forEach(function(att) {
                        if (Array.isArray(att) && typeof att[2] === 'string' && att[2].trim()) {
                            var name = att[2].trim();
                            var mime = (typeof att[11] === 'string') ? att[11] : '';
                            var dup = out.some(function(o) { return o.name === name && o.mime === mime; });
                            if (!dup) out.push({ name: name, mime: mime });
                        }
                    });
                });
            } catch (e) { /* ignora */ }
            return out;
        },

        // Imagem -> ![[nome]] (Obsidian mostra se o arquivo estiver no cofre); demais -> 📎 **[[nome]]**
        _attachmentLine: function(att) {
            var name = att.name.replace(/\s+/g, ' ').trim();
            var exts = this._mimeExts[att.mime];
            if (exts) {
                var lower = name.toLowerCase();
                var hasKnownExt = exts.some(function(e) { return lower.endsWith(e); });
                var hasOtherExt = /\.[A-Za-z]{1,5}$/.test(name);
                if (!hasKnownExt && !hasOtherExt) name += exts[0];
            }
            var isImage = /^image\//i.test(att.mime) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return isImage ? '![[' + name + ']]' : '📎 **[[' + name + ']]**';
        },

        _cleanText: function(text) {
            if (!text) return '';
            return String(text)
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        },

        _buildAssistantText: function(block) {
            var body = Array.isArray(block[1]) ? block[1].join('') : '';
            var refsData = block[2];
            var refList = (refsData && Array.isArray(refsData[1])) ? refsData[1] : [];
            var refs = [];
            refList.forEach(function(r) {
                var content = Array.isArray(r) ? r[0] : null;
                var urls = (Array.isArray(r) && Array.isArray(r[2])) ? r[2] : [];
                var first = Array.isArray(urls[0]) ? urls[0] : [];
                var u = first[0] || '';
                if (u) u = u.split('#:~:')[0];
                if (!u) return;
                refs.push({
                    n: refs.length + 1,
                    spans: (content && Array.isArray(content[3])) ? content[3] : [],
                    url: u,
                    title: first[1] || ''
                });
            });

            var marks = [];
            refs.forEach(function(r) {
                r.spans.forEach(function(sp) {
                    if (Array.isArray(sp) && sp.length === 2) marks.push({ s: sp[0], e: sp[1], n: r.n });
                });
            });
            marks.sort(function(a, b) { return b.s - a.s; });
            marks.forEach(function(mk) {
                if (mk.s >= 0 && mk.e >= mk.s && mk.e <= body.length) {
                    body = body.slice(0, mk.e) + '[' + mk.n + ']' + body.slice(mk.e);
                }
            });

            // 3.8.23: remove marcas internas de citação de anexos, como [cite: 1, 2] (sem significado fora do Gemini)
            body = body.replace(/[ \t]*\[cite:\s*\d+(?:\s*,\s*\d+)*\]/g, '');

            body = this._cleanText(body);
            if (!body) return '';

            if (refs.length) {
                var refLines = ['', '**Referências:**', ''];
                refs.forEach(function(r) {
                    refLines.push('- [' + r.n + '] ' + (r.title ? r.title + ' ' : '') + r.url);
                });
                body += '\n' + refLines.join('\n');
            }
            return body;
        },

        toMarkdownData: function(data) {
            var self = this;
            // A API devolve o turno mais recente primeiro: inverte para ordem cronológica
            var turns = (data.turns || []).slice().reverse();
            if (!turns.length) throw new Error('Nenhuma mensagem encontrada na conversa do Gemini.');

            var messages = [];
            turns.forEach(function(turn) {
                if (!turn) return;

                var ts = '';
                var t4 = turn[4];
                if (Array.isArray(t4) && typeof t4[0] === 'number') {
                    ts = formatMessageTimestamp(t4[0] * 1000 + Math.floor((t4[1] || 0) / 1e6));
                }

                var user = turn[2];
                if (user && Array.isArray(user[0])) {
                    var userText = (typeof user[0][0] === 'string') ? self._cleanText(user[0][0]) : '';
                    var attLines = self._userAttachments(user).map(function(a) { return self._attachmentLine(a); });
                    if (userText || attLines.length > 0) {
                        var userContent = attLines.join('\n') + (attLines.length && userText ? '\n\n' : '') + userText;
                        messages.push({ sender: '👤 Você', timestamp: ts, isUser: true, content: userContent });
                    }
                }

                var asst = turn[3];
                if (asst && Array.isArray(asst[0])) {
                    var blocks = asst[0];
                    for (var b = 0; b < blocks.length; b++) {
                        if (!Array.isArray(blocks[b]) || !Array.isArray(blocks[b][1])) continue;
                        var asstText = self._buildAssistantText(blocks[b]);
                        if (asstText) {
                            messages.push({ sender: '🤖 Gemini', timestamp: ts, isUser: false, content: asstText });
                            break; // usa apenas a primeira resposta (candidata) do turno
                        }
                    }
                }
            });

            if (messages.length === 0) throw new Error('Nenhuma mensagem legível foi extraída do Gemini.');
            return { title: data.title || 'Conversa Gemini', source: 'Gemini', messages: messages };
        }
    };

    // 3.8.22: DIAGNÓSTICO (só Gemini, pelo menu do Tampermonkey). Salva a ESTRUTURA dos dados da conversa,
    // com textos cortados, para descobrirmos onde a API do Gemini guarda anexos/imagens. Não altera a exportação normal.
    async function geminiDiagnostic() {
        try {
            var id = GeminiAdapter.getCurrentConversationId();
            if (!id) throw new Error('Abra uma conversa salva no Gemini (endereço com /app/...).');
            var raw = await GeminiAdapter.getConversationDetails(id);

            var redact = function(v, depth) {
                if (typeof v === 'string') {
                    var lim = /^https?:/i.test(v) ? 90 : 60;
                    return v.length > lim ? v.slice(0, lim) + '…[' + v.length + ' caracteres]' : v;
                }
                if (Array.isArray(v)) {
                    if (depth > 14) return '[…]';
                    return v.map(function(x) { return redact(x, depth + 1); });
                }
                if (v && typeof v === 'object') {
                    var o = {};
                    Object.keys(v).forEach(function(k) { o[k] = redact(v[k], depth + 1); });
                    return o;
                }
                return v;
            };

            var turns = raw.turns || [];
            var out = {
                aviso: 'Textos cortados em 60 caracteres (links em 90). Revise antes de compartilhar.',
                totalTurnos: turns.length,
                turnosIncluidos: Math.min(turns.length, 30),
                turnos: redact(turns.slice(0, 30), 0)
            };

            var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json;charset=utf-8' });
            var a = document.createElement('a');
            a.download = 'gemini-diagnostico_' + formatTimestampForFilename(new Date()) + '.json';
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do Gemini: ' + (err.message || err));
        }
    }

    async function exportGemini(includeImages) {
        var chatId = GeminiAdapter.getCurrentConversationId();
        if (!chatId) throw new Error('Abra uma conversa salva no Gemini (endereço com /app/...).');
        var raw = await GeminiAdapter.getConversationDetails(chatId);
        return GeminiAdapter.toMarkdownData(raw);
    }

    // ==========================================
    // ORQUESTRADOR
    // ==========================================
    async function startExportProcess() {
        var href = window.location.href;
        var button = document.getElementById('export-markdown-button-float');
        if (button) { button.disabled = true; setButtonLabel(button, '⏳ Baixando...'); }

        try {
            var includeImages = confirm("Deseja incluir links e referências de anexos?");
            var result;

            if (href.includes('gemini.google.com')) result = await exportGemini(includeImages);
            else if (href.includes('claude.ai')) result = await exportClaude(includeImages);
            else if (href.includes('chatgpt.com') || href.includes('chat.openai.com')) result = await exportChatGPT(includeImages);
            else if (href.includes('perplexity.ai')) result = await exportPerplexity(includeImages);
            else if (href.includes('x.com/i/grok') || href.includes('grok.com')) result = await exportGrok();
            else if (href.includes('lumo.proton.me') || href.includes('lumo')) result = await exportLumo();
            else throw new Error('Plataforma não suportada.');

            var lines = [];
            var timestampSuffix = formatTimestampForFilename(new Date());
            var displayDate = timestampSuffix.split('_')[0];

            lines.push('# ' + result.title + '\n');
            var headerDate = '**Data:** ' + displayDate;
            if (result.source === 'Lumo' || result.source === 'Grok') {
                headerDate = '**Exportado em:** ' + formatMessageTimestamp(new Date()) + ' *(o ' + result.source + ' não informa data/hora por mensagem)*';
            }
            if (result.source === 'Perplexity' && result.headerTime) {
                headerDate = '**Conversa em:** ' + result.headerTime + ' *(o Perplexity informa uma única data para toda a conversa)*';
            }
            lines.push(headerDate + ' | **Fonte:** [' + result.source + '](' + window.location.href + ') | **Exportador:** ' + SCRIPT_NAME_VERSION + '\n');
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
            if (button) { button.disabled = false; setButtonLabel(button, '📥 Exportar Chat'); }
        }
    }

    setInterval(createFloatingButton, 1500);
})();

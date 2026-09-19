// ==UserScript==
// @name         Universal AI Chat Exporter
// @namespace    https://github.com/sandroaguiar/exportfullchat2md-v3.6.3
// @version      3.6.3
// @description  Exporta conversas do ChatGPT, Claude, Perplexity (API) e Lumo (DOM com filtro refinado de elementos de interface).
// @author       Sandro Aguiar & Collaborator
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://lumo.proton.me/*
// @match        https://*.lumo.proton.me/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var SCRIPT_NAME_VERSION = 'Universal AI Chat Exporter 3.6.3';

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
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|blob:https?:\/\/[^\s)]+)\)/g;
        
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

        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, function(match, mathCode) {
            return '\n$$\n' + mathCode.trim() + '\n$$\n';
        });
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, function(match, mathCode) {
            return '$' + mathCode.trim() + '$';
        });

        return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // ==========================================
    // MÓDULOS DE API (ChatGPT, Claude, Perplexity)
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
        var orgId = orgsRes[0].uuid;
        var chatRes = await fetch('/api/organizations/' + orgId + '/chat_conversations/' + chatId + '?tree=true');
        var data = await chatRes.json();
        var orderedMessages = [];
        (data.chat_messages || []).forEach(function(m) {
            var fmt = formatClaudeMessage(m, includeImages);
            if (fmt.content) orderedMessages.push(fmt);
        });
        return { title: data.name || 'Conversa Claude', messages: orderedMessages, source: 'Claude' };
    }

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
    // MÓDULO LUMO (DOM - Ajustado para evitar ruídos de UI)
    // ==========================================
    function parseNodeToMarkdown(node, indentLevel = 0) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        var tag = node.tagName.toLowerCase();
        
        if (node.classList.contains('file-card-group') || node.classList.contains('file-card') || node.querySelector('.file-card-info-text') || node.matches('[class*="file-card"]')) {
            var titleEl = node.querySelector('.file-card-info-text p, p, span');
            var fileName = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : 'Anexo';
            fileName = fileName.trim().replace(/\s+/g, ' ');
            
            var imgEl = node.querySelector('img');
            var fileUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';
            
            if (fileUrl) {
                return ` [📎 ${fileName}](${fileUrl}) `;
            }
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
        if (tag === 'ul' || tag === 'ol') return '\n' + innerContent + '\n';
        if (tag === 'li') {
            var indent = '    '.repeat(Math.max(0, indentLevel));
            return indent + '- ' + innerContent.trim() + '\n';
        }

        return innerContent;
    }

    function convertLumoNodeToMarkdown(element) {
        if (!element) return '';
        var clone = element.cloneNode(true);
        return cleanRawText(parseNodeToMarkdown(clone, 0));
    }

    async function exportLumo() {
        var titleEl = document.querySelector('h1, header h2, title');
        var title = titleEl ? titleEl.textContent.trim().replace(/^Lumo:\s*/i, '') : 'Conversa Lumo';
        var messages = [];
        var currentTimestamp = formatMessageTimestamp(new Date());

        // Restrito apenas a itens legítimos de chat para ignorar painéis laterais e menus
        var messageNodes = document.querySelectorAll('div.lumo-chat-item, main div[data-message-role]');

        messageNodes.forEach(function(node) {
            var roleAttr = node.getAttribute('data-message-role') || '';
            var classList = node.className ? node.className.toLowerCase() : '';
            var isUser = roleAttr === 'user' || classList.includes('user-msg') || classList.includes('human');
            
            var textContainer = node.querySelector('.lumo-markdown, .workspace-markdown, div[class*="markdown"]') || node;
            var text = convertLumoNodeToMarkdown(textContainer);

            if (!text || text.length < 2) return;
            
            // Filtros rígidos contra textos de interface do Lumo
            if (
                text.includes('O Lumo pode cometer erros') || 
                text.includes('Conversa criptografada') || 
                text.includes('Ferramentas') || 
                text.includes('Mostrar barra lateral') || 
                text.includes('Mostrar painel de conhecimento') || 
                text.includes('Bate-papo atual:') ||
                text === title
            ) {
                return;
            }

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

// ==UserScript==
// @name         Universal AI Chat Exporter (Clean API v3.0.20)
// @namespace    https://github.com/sandroaguiar/exportfullchat2md
// @version      3.0.20
// @description  Exporta conversas com timestamps limpos, hora exata no arquivo e suporte completo a anexos (PDFs, imagens).
// @author       Sandro Aguiar
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=claude.ai
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;

        var button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        button.innerHTML = '📥 Export MD';
        button.style.cssText = 'position: fixed; top: 12px; right: 80px; z-index: 999999; padding: 8px 14px; border-radius: 8px; background-color: #10a37f; color: white; border: none; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0px 2px 6px rgba(0,0,0,0.3); transition: opacity 0.2s;';

        if (window.location.hostname.indexOf('claude.ai') !== -1) {
            button.style.backgroundColor = '#da7756';
        }

        button.addEventListener('mouseover', function() { button.style.opacity = '0.8'; });
        button.addEventListener('mouseout', function() { button.style.opacity = '1'; });
        button.addEventListener('click', startExportProcess);

        document.body.appendChild(button);
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

    function cleanRawText(text) {
        if (!text) return '';
        text = text.replace(/This block is not supported on your current device yet\.?/gi, '');
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uEF00-\uEFFF]/g, '');
        text = text.replace(/```[\s\n]*```/g, '');
        text = text.replace(/\$\$\s*\n\}\s*/g, '$$\n');
        text = text.replace(/N?\s*genui[^\n]*/gi, '');
        text = text.replace(/^N\s*$/gm, '');
        text = text.replace(/^Ô\s*$/gm, '');
        text = text.replace(/entity\[[\s\S]*?\]/gi, '');

        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, function(match, mathCode) {
            return '\n$$\n' + mathCode.trim() + '\n$$\n';
        });
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, function(match, mathCode) {
            return '$' + mathCode.trim() + '$';
        });

        text = text.replace(/```[\s\n]*```/g, '');
        return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // --- FUNÇÃO AUXILIAR DE EXTRATÉGIA DE ANEXOS DO CHATGPT ---
    function extractChatGPTTextFromParts(parts, includeImages, attachments) {
        var textSegments = [];
        var imageCounter = 1;

        if (attachments && attachments.length > 0) {
            attachments.forEach(function(att) {
                var fileName = att.name || 'Arquivo_Anexo';
                var fileUrl = att.url || '#';
                textSegments.push('Anexo: ' + fileName + '\n');
            });
        }

        parts.forEach(function(part) {
            if (typeof part === 'string') {
                textSegments.push(part);
            } else if (typeof part === 'object' && part !== null) {
                if (part.content_type === 'image_asset_pointer') {
                    if (includeImages) {
                        textSegments.push('\n![Imagem ' + imageCounter + '](imagem_' + imageCounter + '.png)\n');
                        imageCounter++;
                    }
                } else if (part.content_type === 'file_asset_pointer' || part.asset_pointer) {
                    var fileName = part.filename || part.name || 'Anexo.pdf';
                    textSegments.push('\nAnexo: ' + fileName + '\n');
                } else if (part.text) {
                    textSegments.push(part.text);
                }
            }
        });

        var fullText = textSegments.join('\n');

        if (!includeImages) {
            fullText = fullText.replace(/!\[.*?\]\((.*?)\)/g, '');
            fullText = fullText.replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g, '');
        }

        return cleanRawText(fullText);
    }

    // --- MODULO CHATGPT ---
    async function exportChatGPT(includeImages) {
        var match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
        var conversationId = match ? match[1] : null;
        if (!conversationId) throw new Error('Abra uma conversa salva na barra lateral do ChatGPT.');

        var sessionRes = await fetch('/api/auth/session').then(function(r) { return r.json(); });
        var token = sessionRes ? sessionRes.accessToken : null;
        if (!token) throw new Error('Nao foi possivel obter a sessao do ChatGPT.');

        var response = await fetch('/backend-api/conversation/' + conversationId, {
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        var data = await response.json();
        var title = data.title || 'Conversa ChatGPT';
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

        return { title: title, messages: orderedMessages, source: 'ChatGPT' };
    }

    // --- FUNCAO AUXILIAR CLAUDE ---
    function formatClaudeMessage(msg, includeImages) {
        var isUser = (msg.sender === 'human');
        var sender = isUser ? '👤 Você' : '🤖 Claude';
        var timestamp = formatMessageTimestamp(msg.created_at || msg.updated_at);

        var contentSegments = [];
        var i = 0;
        var c = null;
        var fileName = '';
        var allFiles = [];
        var fileItem = null;

        if (includeImages) {
            allFiles = [].concat(msg.attachments || [], msg.files || []);
            for (i = 0; i < allFiles.length; i++) {
                fileItem = allFiles[i];
                fileName = fileItem.file_name || fileItem.filename || fileItem.name || 'Arquivo_Anexo';
                contentSegments.push('📎 **Anexo:** [[' + fileName + ']]');
            }
        }

        if (msg.content && Array.isArray(msg.content)) {
            for (i = 0; i < msg.content.length; i++) {
                c = msg.content[i];
                if (c.type === 'text' && typeof c.text === 'string') {
                    contentSegments.push(c.text);
                } else if ((c.type === 'file' || c.type === 'attachment') && includeImages) {
                    fileName = c.name || c.file_name || 'Arquivo';
                    contentSegments.push('📎 **Arquivo:** [[' + fileName + ']]');
                }
            }
        } else if (typeof msg.text === 'string') {
            contentSegments.push(msg.text);
        }

        var rawContent = contentSegments.join('\n\n');
        return {
            sender: sender,
            timestamp: timestamp,
            isUser: isUser,
            content: cleanRawText(rawContent)
        };
    }

    // --- MODULO CLAUDE.AI ---
    async function exportClaude(includeImages) {
        var match = window.location.pathname.match(/\/chat\/([a-f0-9-]+)/);
        var chatId = match ? match[1] : null;
        if (!chatId) throw new Error('Abra uma conversa salva no Claude.ai.');

        var orgsRes = await fetch('/api/organizations').then(function(r) { return r.json(); });
        if (!orgsRes || orgsRes.length === 0) throw new Error('Nao foi possivel identificar a organizacao no Claude.');
        var orgId = orgsRes[0].uuid;

        var chatRes = await fetch('/api/organizations/' + orgId + '/chat_conversations/' + chatId + '?tree=true');
        if (!chatRes.ok) throw new Error('Erro ao buscar conversa no Claude (' + chatRes.status + ')');
        var data = await chatRes.json();

        var title = data.name || 'Conversa Claude';
        var chatMessages = data.chat_messages || [];

        var orderedMessages = [];
        for (var i = 0; i < chatMessages.length; i++) {
            var formatted = formatClaudeMessage(chatMessages[i], includeImages);
            if (formatted.content.length > 0) {
                orderedMessages.push(formatted);
            }
        }

        return { title: title, messages: orderedMessages, source: 'Claude' };
    }

    // --- PROCESSO PRINCIPAL ---
    async function startExportProcess() {
        var isClaude = window.location.hostname.indexOf('claude.ai') !== -1;
        var isChatGPT = window.location.hostname.indexOf('chatgpt.com') !== -1 || window.location.hostname.indexOf('chat.openai.com') !== -1;

        var button = document.getElementById('export-markdown-button-float');
        if (button) button.innerHTML = '⏳ Baixando...';

        try {
            var includeImages = confirm("Deseja incluir marcadores de arquivos e anexos?");
            var result;

            if (isClaude) {
                result = await exportClaude(includeImages);
            } else if (isChatGPT) {
                result = await exportChatGPT(includeImages);
            } else {
                throw new Error('Plataforma nao suportada no momento.');
            }

            var lines = [];
            var timestampSuffix = formatTimestampForFilename(new Date());
            var displayDate = timestampSuffix.split('_')[0];
            var url = window.location.href;

            lines.push('# ' + result.title + '\n');
            lines.push('**Data:** ' + displayDate + ' | **Fonte:** [' + result.source + '](' + url + ')\n');
            lines.push('---\n');

            result.messages.forEach(function(msg) {
                var timeTag = msg.timestamp ? '*(' + msg.timestamp + ')*' : '';

                if (msg.isUser) {
                    lines.push('**' + msg.sender + ':** ' + timeTag + '\n');
                    lines.push(msg.content);
                } else {
                    lines.push('**' + msg.sender + ':**\n');
                    lines.push(msg.content);
                    if (timeTag) {
                        lines.push('\n' + timeTag);
                    }
                }
                lines.push('\n---\n');
            });

            var markdown = lines.join('\n').trim();
            markdown = markdown.replace(/```[\s\n]*```/g, '').replace(/\n{3,}/g, '\n\n');

            var blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            var a = document.createElement('a');
            a.download = result.title.replace(/[/\\?%*:|"<>]/g, '_') + '_' + timestampSuffix + '.md';
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            alert('Falha ao exportar conversa: ' + (err.message || err));
        } finally {
            if (button) button.innerHTML = '📥 Export MD';
        }
    }

    setInterval(createFloatingButton, 2000);
})();
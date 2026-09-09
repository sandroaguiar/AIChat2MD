// ==UserScript==
// @name         Universal AI Chat Exporter Pro (v3.2.1 - Hybrid Auto-Scroll)
// @namespace    https://github.com/sandroaguiar/exportfullchat2md
// @version      3.2.1
// @description  Exporta chats longos do Perplexity, ChatGPT e Claude usando Auto-Scroll Dinâmico + Timestamps por mensagem.
// @author       Sandro Aguiar (Inspirado no AfterChat Engine)
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      perplexity.ai
// @connect      www.perplexity.ai
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar Chat Completo (.md)", startExportProcess);
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;

        var button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        button.innerHTML = '📥 Export MD';
        button.style.cssText = 'position: fixed; top: 12px; right: 80px; z-index: 999999; padding: 8px 14px; border-radius: 8px; background-color: #10a37f; color: white; border: none; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0px 2px 6px rgba(0,0,0,0.3); transition: opacity 0.2s;';

        var hostname = window.location.hostname;
        if (hostname.indexOf('claude.ai') !== -1) {
            button.style.backgroundColor = '#da7756';
        } else if (hostname.indexOf('perplexity.ai') !== -1) {
            button.style.backgroundColor = '#22b8cf';
        }

        button.addEventListener('mouseover', function() { button.style.opacity = '0.8'; });
        button.addEventListener('mouseout', function() { button.style.opacity = '1'; });
        button.addEventListener('click', startExportProcess);

        document.body.appendChild(button);
    }

    function formatDate(date) {
        if (!date) date = new Date();
        return date.toISOString().split('T')[0];
    }

    function formatMessageTimestamp(dateInput) {
        var d = dateInput ? new Date(dateInput) : new Date();
        if (isNaN(d.getTime())) d = new Date();

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
        text = text.split('\x60\x60\x60 \x60\x60\x60').join('');
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

        return text.replace(/\n{3,}/g, '\n\n').trim();
    }

    // --- ROLAGEM AUTOMÁTICA PARA CAPTURAR CHATS LONGOS (ESTRATÉGIA AFTERCHAT) ---
    async function autoScrollAndCollect() {
        var scrollContainer = document.querySelector('main') || document.documentElement || document.body;
        var totalHeight = scrollContainer.scrollHeight;
        var currentScroll = 0;
        var step = Math.floor(window.innerHeight * 0.8);

        // Rola até o topo primeiro
        window.scrollTo(0, 0);
        await new Promise(function(r) { setTimeout(r, 200); });

        // Rola de cima para baixo de forma suave/rápida para forçar a renderização
        while (currentScroll < totalHeight) {
            currentScroll += step;
            window.scrollTo(0, currentScroll);
            await new Promise(function(r) { setTimeout(r, 100); });
            totalHeight = scrollContainer.scrollHeight;
        }

        // Retorna ao final
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(function(r) { setTimeout(r, 300); });
    }

    // --- EXTRAÇÃO NO PERPLEXITY AI ---
    async function exportPerplexity() {
        var button = document.getElementById('export-markdown-button-float');
        if (button) button.innerHTML = '⏳ Varrendo Chat...';

        await autoScrollAndCollect();

        var title = document.title.replace('- Perplexity', '').trim() || 'Conversa Perplexity';
        var orderedMessages = [];
        var nowTimestamp = formatMessageTimestamp(new Date());

        // Captura pares de Pergunta e Resposta pelos containers da árvore DOM do Perplexity
        var containers = document.querySelectorAll('.group\\/query, [class*="query"], main > div > div');

        if (containers.length === 0) {
            containers = document.querySelectorAll('main div');
        }

        // Seleção primária usando classes de prosa e bloco do Perplexity
        var queries = Array.from(document.querySelectorAll('div.font-medium, h1, [class*="query-text"]'));
        var answers = Array.from(document.querySelectorAll('.prose, [class*="prose"], .markdown'));

        var maxItems = Math.max(queries.length, answers.length);

        for (var i = 0; i < maxItems; i++) {
            if (queries[i]) {
                var qText = cleanRawText(queries[i].textContent);
                if (qText.length > 1) {
                    orderedMessages.push({
                        sender: '👤 Você',
                        timestamp: nowTimestamp,
                        isUser: true,
                        content: qText
                    });
                }
            }

            if (answers[i]) {
                var aText = cleanRawText(answers[i].textContent);
                if (aText.length > 1) {
                    orderedMessages.push({
                        sender: '🤖 Perplexity',
                        timestamp: nowTimestamp,
                        isUser: false,
                        content: aText
                    });
                }
            }
        }

        // Filtro para eliminar redundâncias de capturas sobrepostas
        var uniqueMessages = [];
        var seenContent = new Set();

        orderedMessages.forEach(function(msg) {
            var key = msg.sender + '_' + msg.content.substring(0, 50);
            if (!seenContent.has(key)) {
                seenContent.add(key);
                uniqueMessages.push(msg);
            }
        });

        if (uniqueMessages.length === 0) {
            throw new Error('Nenhuma mensagem visível pôde ser capturada.');
        }

        return { title: title, messages: uniqueMessages, source: 'Perplexity' };
    }

    // --- CHATGPT ---
    async function exportChatGPT(includeImages) {
        var match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
        var conversationId = match ? match[1] : null;
        if (!conversationId) throw new Error('Abra uma conversa salva no ChatGPT.');

        var sessionRes = await fetch('/api/auth/session').then(function(r) { return r.json(); });
        var token = sessionRes ? sessionRes.accessToken : null;
        if (!token) throw new Error('Sessão não encontrada.');

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
                    var text = parts.map(function(p) { return typeof p === 'string' ? p : (p.text || ''); }).join('\n');
                    text = cleanRawText(text);
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

    // --- CLAUDE ---
    async function exportClaude(includeImages) {
        var match = window.location.pathname.match(/\/chat\/([a-f0-9-]+)/);
        var chatId = match ? match[1] : null;
        if (!chatId) throw new Error('Abra uma conversa salva no Claude.ai.');

        var orgsRes = await fetch('/api/organizations').then(function(r) { return r.json(); });
        var orgId = orgsRes[0].uuid;

        var chatRes = await fetch('/api/organizations/' + orgId + '/chat_conversations/' + chatId + '?tree=true');
        var data = await chatRes.json();

        var title = data.name || 'Conversa Claude';
        var chatMessages = data.chat_messages || [];

        var orderedMessages = [];
        for (var i = 0; i < chatMessages.length; i++) {
            var msg = chatMessages[i];
            var isUser = (msg.sender === 'human');
            var sender = isUser ? '👤 Você' : '🤖 Claude';
            var timestamp = formatMessageTimestamp(msg.created_at || msg.updated_at);

            var contentSegments = [];
            if (msg.content && Array.isArray(msg.content)) {
                for (var j = 0; j < msg.content.length; j++) {
                    var c = msg.content[j];
                    if (c.type === 'text' && typeof c.text === 'string') {
                        contentSegments.push(c.text);
                    }
                }
            } else if (typeof msg.text === 'string') {
                contentSegments.push(msg.text);
            }

            var textFormatted = cleanRawText(contentSegments.join('\n\n'));
            if (textFormatted.length > 0) {
                orderedMessages.push({
                    sender: sender,
                    timestamp: timestamp,
                    isUser: isUser,
                    content: textFormatted
                });
            }
        }

        return { title: title, messages: orderedMessages, source: 'Claude' };
    }

    // --- EXECUÇÃO DO PROCESSO ---
    async function startExportProcess() {
        var hostname = window.location.hostname;
        var isClaude = hostname.indexOf('claude.ai') !== -1;
        var isChatGPT = hostname.indexOf('chatgpt.com') !== -1 || hostname.indexOf('chat.openai.com') !== -1;
        var isPerplexity = hostname.indexOf('perplexity.ai') !== -1;

        var button = document.getElementById('export-markdown-button-float');
        if (button) button.innerHTML = '⏳ Processando...';

        try {
            var includeImages = confirm("Deseja incluir marcadores de anexos/imagens?");
            var result;

            if (isClaude) {
                result = await exportClaude(includeImages);
            } else if (isChatGPT) {
                result = await exportChatGPT(includeImages);
            } else if (isPerplexity) {
                result = await exportPerplexity();
            } else {
                throw new Error('Plataforma não suportada.');
            }

            var lines = [];
            var date = formatDate();
            var url = window.location.href;

            lines.push('# ' + result.title + '\n');
            lines.push('**Data:** ' + date + ' | **Fonte:** [' + result.source + '](' + url + ')\n');
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
            markdown = markdown.replace(/\n{3,}/g, '\n\n');

            var blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            var a = document.createElement('a');
            a.download = result.title.replace(/[/\\?%*:|"<>]/g, '_') + '_' + date + '.md';
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
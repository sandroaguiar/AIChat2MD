// ==UserScript==
// @name         AIChat2MD
// @namespace    https://github.com/sandroaguiar/AIChat2MD
// @version      3.8.38
// @description  Tampermonkey userscript that exports AI chats (ChatGPT, Claude, Gemini, Google AI Studio, Perplexity, Grok, Lumo) to Markdown for Obsidian: full history via API where available, attachment links, and per-message timestamps where the platform provides them.
// @description:pt-BR  Userscript do Tampermonkey que exporta conversas de IA (ChatGPT, Claude, Gemini, Google AI Studio, Perplexity, Grok, Lumo) para Markdown, para uso no Obsidian: histórico completo via API quando disponível, links de anexos e hora por mensagem quando a plataforma fornece.
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
// @match        https://aistudio.google.com/*
// @icon         https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/assets/icon-128.png
// @downloadURL  https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/AIChat2MD.user.js
// @updateURL    https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/AIChat2MD.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @noframes
// @connect      lh3.googleusercontent.com
// @connect      googleusercontent.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var SCRIPT_NAME_VERSION = 'AI Chat to MD 3.8.38';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
        if (window.location.hostname === 'gemini.google.com') {
            GM_registerMenuCommand("🔍 Gemini: salvar diagnóstico de anexos", geminiDiagnostic);
            GM_registerMenuCommand("🔍 Gemini: testar download de imagens", geminiImageTest);
        }
        if (window.location.hostname === 'claude.ai') {
            GM_registerMenuCommand("🔍 Claude: salvar diagnóstico (referências, anexos e arquivos)", claudeDiagnostic);
        }
    }

    function isGeminiHost() {
        // 3.8.35: além do Gemini, o AI Studio também bloqueia innerHTML (Trusted Types), mesmo tratamento.
        var h = window.location.hostname;
        return h === 'gemini.google.com' || h === 'aistudio.google.com';
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
        } else if (href.includes('aistudio.google.com')) {
            bgColor = '#722F37';
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
    // 3.8.29: linha de anexo do Claude. Imagens -> ![[nome]]; demais arquivos -> 📎 **[[nome]]**; texto colado (sem nome) -> descrição.
    function claudeAttachmentLine(name, kind, sizeBytes) {
        name = (name || '').replace(/\s+/g, ' ').trim();
        if (!name) {
            var kb = sizeBytes ? ' *(' + Math.max(1, Math.round(sizeBytes / 1024)) + ' KB)*' : '';
            return '📎 **Texto colado**' + kb;
        }
        var isImage = (kind === 'image') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
        return isImage ? '![[' + name + ']]' : '📎 **[[' + name + ']]**';
    }

    function formatClaudeMessage(msg, includeImages) {
        var isUser = (msg.sender === 'human');

        // Arquivos enviados (msg.files: imagens e arquivos) e anexos de texto (msg.attachments), sem repetir nomes
        var attachLines = [];
        if (includeImages) {
            var seen = {};
            if (Array.isArray(msg.files)) {
                msg.files.forEach(function(f) {
                    if (!f || f.success === false) return;
                    var line = claudeAttachmentLine(f.file_name, f.file_kind, f.size_bytes);
                    if (!seen[line]) { seen[line] = true; attachLines.push(line); }
                });
            }
            if (Array.isArray(msg.attachments)) {
                msg.attachments.forEach(function(att) {
                    if (!att) return;
                    var line = claudeAttachmentLine(att.file_name, '', att.file_size);
                    if (!seen[line]) { seen[line] = true; attachLines.push(line); }
                });
            }
        }

        // 3.8.30: com o formato completo da conversa, a resposta vem em blocos. Texto entra como antes; os arquivos que o Claude
        // apresentou ao usuário (ferramenta present_files, itens "local_resource") viram links, na posição em que foram apresentados.
        // Blocos "thinking" e chamadas de ferramentas (bash, memória etc.) não entram no arquivo.
        var parts = [];
        if (msg.content && Array.isArray(msg.content)) {
            msg.content.forEach(function(c) {
                if (!c) return;
                if (c.type === 'text') {
                    var t = cleanRawText(c.text || '');
                    if (t) parts.push(t);
                } else if (c.type === 'tool_result' && c.name === 'present_files' && !c.is_error && Array.isArray(c.content)) {
                    var fileLines = [];
                    c.content.forEach(function(r) {
                        if (r && r.type === 'local_resource' && r.file_path) {
                            var fileName = String(r.file_path).split('/').pop();
                            var fl = claudeAttachmentLine(fileName, '', 0);
                            if (fileLines.indexOf(fl) === -1) fileLines.push(fl);
                        }
                    });
                    if (fileLines.length > 0) parts.push(fileLines.join('\n'));
                }
            });
        } else if (typeof msg.text === 'string') {
            var t2 = cleanRawText(msg.text);
            if (t2) parts.push(t2);
        }
        var body = parts.join('\n\n');
        var content = attachLines.join('\n') + (attachLines.length && body ? '\n\n' : '') + body;

        return {
            sender: isUser ? '👤 Você' : '🤖 Claude',
            timestamp: formatMessageTimestamp(msg.created_at),
            isUser: isUser,
            content: content
        };
    }

    // 3.8.28: DIAGNÓSTICO (só Claude, pelo menu do Tampermonkey). Funciona em conversas longas: salva um CENSO dos tipos de
    // conteúdo da conversa inteira e a ESTRUTURA (textos cortados, identificadores trocados por uuid#1, uuid#2...) de algumas
    // mensagens que contêm blocos diferentes de texto, arquivos, anexos ou citações. Serve para descobrirmos onde a API do
    // Claude guarda referências (links), anexos e arquivos/figuras gerados. Não altera a exportação normal.
    async function claudeDiagnostic() {
        try {
            var match = window.location.pathname.match(/\/chat\/([a-f0-9-]+)/);
            if (!match) throw new Error('Abra uma conversa salva no Claude.ai (endereço com /chat/...).');

            var orgsRes = await fetch('/api/organizations').then(function(r) { return r.json(); });
            if (!orgsRes || orgsRes.length === 0) throw new Error('Organização do Claude não encontrada.');
            var orgId = orgsRes[0].uuid;

            var baseUrl = '/api/organizations/' + orgId + '/chat_conversations/' + match[1];
            var urlUsada = baseUrl + '?tree=true&rendering_mode=messages&render_all_tools=true';
            var chatRes = await fetch(urlUsada);
            var data = chatRes.ok ? await chatRes.json() : null;
            if (!data || !(data.chat_messages || data.messages)) {
                urlUsada = baseUrl + '?tree=true';
                chatRes = await fetch(urlUsada);
                data = await chatRes.json();
            }

            var uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
            var uuidMap = {};
            var uuidCount = 0;
            var maskUuids = function(str) {
                return str.replace(uuidRe, function(u) {
                    var k = u.toLowerCase();
                    if (!uuidMap[k]) { uuidCount++; uuidMap[k] = 'uuid#' + uuidCount; }
                    return uuidMap[k];
                });
            };

            var redact = function(v, depth) {
                if (typeof v === 'string') {
                    var t = maskUuids(v);
                    var lim = /^(https?:|\/)/i.test(t) ? 100 : 60;
                    return t.length > lim ? t.slice(0, lim) + '…[' + t.length + ' caracteres]' : t;
                }
                if (Array.isArray(v)) {
                    if (depth > 14) return '[…]';
                    var arr = v.slice(0, 12).map(function(x) { return redact(x, depth + 1); });
                    if (v.length > 12) arr.push('…[+' + (v.length - 12) + ' itens]');
                    return arr;
                }
                if (v && typeof v === 'object') {
                    if (depth > 14) return { '…': 'profundidade máxima' };
                    var o = {};
                    Object.keys(v).forEach(function(k) { o[k] = redact(v[k], depth + 1); });
                    return o;
                }
                return v;
            };

            var allMsgs = data.chat_messages || data.messages || [];
            var copy = Object.assign({}, data);
            delete copy.chat_messages;
            delete copy.messages;

            // Assinaturas: tipos de bloco de conteúdo, ferramentas usadas e listas não vazias no nível da mensagem
            var census = { chavesDeMensagem: {}, blocos: {}, listasNaMensagem: {}, listasPorRemetente: {} };
            var selected = [];
            var selectedIdx = {};
            var sigSeen = {};

            allMsgs.forEach(function(m, i) {
                var sigs = [];
                Object.keys(m || {}).forEach(function(k) {
                    census.chavesDeMensagem[k] = (census.chavesDeMensagem[k] || 0) + 1;
                    if (k !== 'content' && Array.isArray(m[k]) && m[k].length > 0) {
                        census.listasNaMensagem[k] = (census.listasNaMensagem[k] || 0) + 1;
                        var rk = k + ' / ' + (m.sender || m.role || '?');
                        census.listasPorRemetente[rk] = (census.listasPorRemetente[rk] || 0) + 1;
                        sigs.push('msg.' + k);
                    }
                });
                var blocks = Array.isArray(m && m.content) ? m.content : [];
                blocks.forEach(function(b) {
                    if (!b || typeof b !== 'object') return;
                    var key = String(b.type || 'sem-tipo');
                    if (typeof b.name === 'string') key += ':' + b.name;
                    if (b.type === 'text' && Array.isArray(b.citations) && b.citations.length > 0) key = 'text+citations';
                    census.blocos[key] = (census.blocos[key] || 0) + 1;
                    if (key !== 'text') sigs.push('bloco.' + key);
                });
                var wanted = false;
                sigs.forEach(function(sg) {
                    sigSeen[sg] = (sigSeen[sg] || 0) + 1;
                    if (sigSeen[sg] <= 2) wanted = true;
                });
                if (wanted && selected.length < 14 && !selectedIdx[i]) {
                    selectedIdx[i] = true;
                    selected.push({ indice: i, remetente: m.sender || m.role || '?', mensagem: redact(m, 0) });
                }
            });

            var out = {
                aviso: 'Textos cortados em 60 caracteres (links em 100), listas em 12 itens, identificadores trocados por marcas. Revise antes de compartilhar.',
                parametrosDaRequisicao: urlUsada.replace(baseUrl, ''),
                totalMensagens: allMsgs.length,
                censo: census,
                conversa: redact(copy, 0),
                mensagensSelecionadas: selected
            };

            var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json;charset=utf-8' });
            var a = document.createElement('a');
            a.download = 'claude-diagnostico_' + formatTimestampForFilename(new Date()) + '.json';
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do Claude: ' + (err.message || err));
        }
    }

    async function exportClaude(includeImages) {
        var match = window.location.pathname.match(/\/chat\/([a-f0-9-]+)/);
        var chatId = match ? match[1] : null;
        if (!chatId) throw new Error('Abra uma conversa salva no Claude.ai.');
        
        var orgsRes = await fetch('/api/organizations').then(function(r) { return r.json(); });
        if (!orgsRes || orgsRes.length === 0) throw new Error('Organização do Claude não encontrada.');
        var orgId = orgsRes[0].uuid;

        var chatBase = '/api/organizations/' + orgId + '/chat_conversations/' + chatId;
        var chatRes = await fetch(chatBase + '?tree=true&rendering_mode=messages&render_all_tools=true');
        var data = chatRes.ok ? await chatRes.json() : null;
        if (!data || !(data.chat_messages || data.messages)) {
            chatRes = await fetch(chatBase + '?tree=true');
            data = await chatRes.json();
        }
        
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

        // 3.8.31: imagens e arquivos GERADOS pelo Gemini. No texto da resposta aparecem só marcadores (por exemplo
        // http://googleusercontent.com/image_generation_content/0_587 ou [file-tag: code-generated-file-...]); os dados do
        // arquivo (nome, tipo) ficam em block[12], como [marcador, null, ANEXO] ou [[null,null,null,ANEXO],[marcador,...]].
        // ANEXO = [null, tipo, nome, url, ..., mime no índice 11]. Cada marcador é trocado por ![[nome]] (imagem) ou 📎 **[[nome]]**.
        _collectGenerated: function(block) {
            var markerRe = /^\[?(?:https?:\/\/googleusercontent\.com\/|file-tag:)/;
            var isAtt = function(a) {
                return Array.isArray(a) && a[0] === null && typeof a[1] === 'number' && a[1] > 0 &&
                       typeof a[2] === 'string' && a[2].length < 200 && /\.[A-Za-z0-9]{1,6}$/.test(a[2]) &&
                       !/^thought_signature/i.test(a[2]) && !/\.pb$/i.test(a[2]);
            };
            var list = [];
            var byName = {};
            var byMarker = {};
            var addAtt = function(a) {
                if (byName[a[2]]) return byName[a[2]];
                var att = { name: a[2], mime: (typeof a[11] === 'string') ? a[11] : '', url: (typeof a[3] === 'string') ? a[3] : '' };
                byName[a[2]] = att;
                list.push(att);
                return att;
            };
            var walk = function(v, depth) {
                if (v === null || typeof v !== 'object' || depth > 16) return;
                if (Array.isArray(v)) {
                    if (isAtt(v)) addAtt(v);
                    if (typeof v[0] === 'string' && markerRe.test(v[0]) && isAtt(v[2])) {
                        byMarker[v[0]] = addAtt(v[2]);
                    }
                    if (Array.isArray(v[0]) && isAtt(v[0][3]) && Array.isArray(v[1]) &&
                        typeof v[1][0] === 'string' && markerRe.test(v[1][0])) {
                        byMarker[v[1][0]] = addAtt(v[0][3]);
                    }
                    for (var i = 0; i < v.length; i++) walk(v[i], depth + 1);
                } else {
                    Object.keys(v).forEach(function(k) { walk(v[k], depth + 1); });
                }
            };
            walk(block, 0);
            return { list: list, byMarker: byMarker };
        },

        _generatedLine: function(att) {
            var name = att.name.replace(/\s+/g, ' ').trim();
            var isImage = /^image\//i.test(att.mime) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return isImage ? '![[' + name + ']]' : '📎 **[[' + name + ']]**';
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

            // 3.8.31: troca os marcadores de imagens/arquivos gerados por links; o que não tiver marcador vai ao fim da resposta
            var self = this;
            var gen = this._collectGenerated(block);
            var usedNames = {};
            Object.keys(gen.byMarker).forEach(function(mk) {
                var att = gen.byMarker[mk];
                if (body.indexOf(mk) !== -1) {
                    body = body.split(mk).join('\n\n' + self._generatedLine(att) + '\n\n');
                    usedNames[att.name] = true;
                }
            });
            // marcadores sem dados correspondentes não têm significado fora do Gemini
            body = body.replace(/\[file-tag:\s*[^\]]+\]/g, '')
                       .replace(/\[?https?:\/\/googleusercontent\.com\/(?:image_generation_content|generated_image)\/[^\s\]]*\]?/g, '');
            // o Gemini grava o código executado como ```python?code_reference&code_event_index=1; deixa só a linguagem
            body = body.replace(/```(\w+)\?code_(?:reference|stdout|stderr)[^\n]*/g, '```$1');
            var extraLines = [];
            gen.list.forEach(function(att) {
                if (!usedNames[att.name]) extraLines.push(self._generatedLine(att));
                var isImg = /^image\//i.test(att.mime) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(att.name);
                if (isImg && /^https:\/\//i.test(att.url) && self._assets) self._assets[att.name] = att.url;
            });
            if (extraLines.length > 0) body += '\n\n' + extraLines.join('\n');

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
            self._assets = {};
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
            var assets = Object.keys(self._assets || {}).map(function(n) { return { name: n, url: self._assets[n] }; });
            return { title: data.title || 'Conversa Gemini', source: 'Gemini', messages: messages, assets: assets };
        }
    };

    // ==========================================
    // 3.8.35: ADAPTADOR AI STUDIO (módulo isolado, não usado por nenhuma outra plataforma)
    // ==========================================
    // Baseado no ADAPTER[aistudio] do AfterChat. Usa gRPC-web (JSON+protobuf) via XHR direto no
    // contexto da página (credenciais por cookie), sem GM_xmlhttpRequest. Não trata anexos, imagens/
    // arquivos gerados nem referências com link (mesma limitação do adaptador original).
    var AIStudioAdapter = {
        _sapisid: '',
        _apiKey: '',

        getCurrentConversationId: function() {
            // 3.8.37: revertido o /app/ da 3.8.36 — a URL real confirmada é /u/<n>/prompts/<id> ou /prompts/<id>,
            // sem /app/ no meio (o teste da 3.8.36 só "funcionou" porque a página era new_chat, sem ID real).
            var m1 = window.location.pathname.match(/^\/u\/\d+\/prompts\/([^\/?]+)/);
            var m2 = window.location.pathname.match(/^\/prompts\/([^\/?]+)/);
            var m = m1 || m2;
            if (!m || m[1] === 'new_chat' || m[1] === 'new_data') return null;
            return m[1];
        },

        _authUserFromUrl: function() {
            var m = window.location.pathname.match(/^\/u\/(\d+)\//);
            return m ? m[1] : '0';
        },

        _getSAPISID: function() {
            if (this._sapisid) return this._sapisid;
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var c = cookies[i].trim();
                if (c.indexOf('SAPISID=') === 0) { this._sapisid = c.substring(8); return this._sapisid; }
            }
            return '';
        },

        _computeSAPISIDHash: async function() {
            var sapisid = this._getSAPISID();
            if (!sapisid) throw new Error('Cookie SAPISID não disponível. Faça login novamente no AI Studio.');
            var ts = Math.floor(Date.now() / 1000);
            var msg = ts + ' ' + sapisid + ' ' + 'https://aistudio.google.com';
            var buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(msg));
            var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
            return ts + '_' + hash;
        },

        _getApiKey: function() {
            if (this._apiKey) return this._apiKey;
            var scripts = document.scripts;
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].type === 'application/json') {
                    try {
                        var data = JSON.parse(scripts[i].textContent);
                        if (data && data.WIu0Nc) { this._apiKey = data.WIu0Nc; return this._apiKey; }
                    } catch (e) { /* ignora */ }
                }
            }
            throw new Error('Chave de API do AI Studio não encontrada na página. Recarregue a página (F5) e tente novamente.');
        },

        _rpc: async function(method, body) {
            var sapisidHash = await this._computeSAPISIDHash();
            var apiKey = this._getApiKey();
            var self = this;
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/' + method);
                xhr.withCredentials = true;
                xhr.setRequestHeader('Content-Type', 'application/json+protobuf');
                xhr.setRequestHeader('X-Goog-Api-Key', apiKey);
                xhr.setRequestHeader('X-Goog-AuthUser', self._authUserFromUrl());
                xhr.setRequestHeader('Authorization', 'SAPISIDHASH ' + sapisidHash);
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try { resolve(JSON.parse(xhr.responseText)); }
                        catch (e) { reject(new Error('Resposta do AI Studio não pôde ser interpretada: ' + e.message)); }
                    } else {
                        reject(new Error('API do AI Studio retornou HTTP ' + xhr.status));
                    }
                };
                xhr.onerror = function() { reject(new Error('Erro de rede ao chamar a API do AI Studio.')); };
                xhr.send(JSON.stringify(body));
            });
        },

        getConversationDetails: async function(id) {
            var raw = await this._rpc('ResolveDriveResource', [id]);
            return this._parseConversation(raw, id);
        },

        // Detecta se o texto (em negrito, primeira linha) indica raciocínio interno ("thought"),
        // pela mesma heurística de palavras-chave do adaptador original.
        _isThought: function(text) {
            if (!/^\s*\*\*/.test(text)) return false;
            var firstLine = text.split('\n')[0].replace(/\*\*/g, '').trim().toLowerCase();
            return /^(assess|evaluat|analyz|consider|classify|identif|defin|determin|reflect|break down|dissect|categoriz|think|thought)/.test(firstLine);
        },

        _parseConversation: function(raw, id) {
            var arr = Array.isArray(raw) ? raw : [];
            if (arr.length === 1 && Array.isArray(arr[0])) arr = arr[0];

            var modelName = 'Gemini';
            if (Array.isArray(arr[3]) && typeof arr[3][2] === 'string') modelName = arr[3][2].replace('models/', '');

            var title = (Array.isArray(arr[4]) && typeof arr[4][0] === 'string') ? arr[4][0] : '';

            var systemPrompt = Array.isArray(arr[12]) ? arr[12].filter(function(s) { return typeof s === 'string'; }) : [];
            var parsed = [];
            if (systemPrompt.length > 0) parsed.push({ role: 'system', type: 'text', text: systemPrompt.join('\n\n') });

            var turnGroups = Array.isArray(arr[13]) ? arr[13] : [];
            var self = this;
            turnGroups.forEach(function(group) {
                if (!Array.isArray(group)) return;
                group.forEach(function(msgArr) {
                    if (!Array.isArray(msgArr)) return;
                    var text = (typeof msgArr[0] === 'string') ? msgArr[0].trim() : '';
                    if (!text || text.length < 2) return;
                    var role = msgArr[8] === 'user' ? 'user' : 'model';
                    var type = (role === 'model' && self._isThought(text)) ? 'thought' : 'text';
                    parsed.push({ role: role, type: type, text: text });
                });
            });

            if (parsed.length === 0) throw new Error('Nenhuma mensagem encontrada nesta conversa do AI Studio.');
            return { parsed: parsed, modelName: modelName, title: title, promptId: id };
        },

        // # título -> **negrito**, pulando o conteúdo de blocos ```código``` (bug herdado do
        // adaptador original: ele dizia que não convertia dentro de código, mas convertia).
        _convertHeadings: function(text) {
            var lines = text.split('\n');
            var inCode = false;
            for (var i = 0; i < lines.length; i++) {
                if (/^\s*```/.test(lines[i])) { inCode = !inCode; continue; }
                if (!inCode) {
                    lines[i] = lines[i].replace(/^(#{1,6})\s+(.+)$/, function(m, hashes, content) { return '**' + content.trim() + '**'; });
                }
            }
            return lines.join('\n');
        },

        toMarkdownData: function(data) {
            var self = this;
            var messages = [];
            var buffer = null;

            function flush() {
                if (buffer) { messages.push({ sender: buffer.sender, timestamp: '', isUser: buffer.isUser, content: buffer.lines.join('\n\n') }); buffer = null; }
            }

            data.parsed.forEach(function(m) {
                var text = self._convertHeadings(m.text).trim();
                if (!text) return;

                if (m.role === 'user') {
                    flush();
                    messages.push({ sender: '👤 Você', timestamp: '', isUser: true, content: text });
                } else if (m.role === 'system') {
                    flush();
                    messages.push({ sender: '⚙️ Sistema', timestamp: '', isUser: false, content: text });
                } else {
                    if (!buffer || buffer.role !== 'model') {
                        flush();
                        buffer = { role: 'model', sender: '🤖 AI Studio', isUser: false, lines: [] };
                    }
                    if (m.type === 'thought') buffer.lines.push('#### 🤔 Processo de raciocínio\n\n' + text);
                    else if (buffer.lines.length > 0) buffer.lines.push('#### 💡 Resposta\n\n' + text);
                    else buffer.lines.push(text);
                }
            });
            flush();

            if (messages.length === 0) throw new Error('Nenhuma mensagem legível foi extraída do AI Studio.');
            return { title: data.title || 'Conversa AI Studio', source: 'AI Studio', messages: messages, assets: [] };
        }
    };

    async function exportAIStudio() {
        var id = AIStudioAdapter.getCurrentConversationId();
        if (!id) throw new Error('Abra um prompt salvo no AI Studio (endereço com /prompts/...).');
        var raw = await AIStudioAdapter.getConversationDetails(id);
        return AIStudioAdapter.toMarkdownData(raw);
    }

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

    // 3.8.33: TESTE (só Gemini, pelo menu do Tampermonkey). O download das imagens geradas retornou HTTP 403; este comando testa
    // variações do pedido (com/sem Referer, com sufixos de tamanho, pela página) e salva só os códigos de resposta em um .json,
    // para descobrirmos qual funciona. Não altera a exportação normal.
    async function geminiImageTest() {
        try {
            var chatId = GeminiAdapter.getCurrentConversationId();
            if (!chatId) throw new Error('Abra uma conversa salva no Gemini (endereço com /app/...).');
            if (typeof GM_xmlhttpRequest === 'undefined') throw new Error('GM_xmlhttpRequest indisponível.');
            var raw = await GeminiAdapter.getConversationDetails(chatId);
            var data = GeminiAdapter.toMarkdownData(raw);
            var assets = (data.assets || []).slice(0, 2);
            if (assets.length === 0) throw new Error('Nenhuma imagem gerada com endereço nesta conversa.');

            var shortUrl = function(u) {
                return u.length > 100 ? u.slice(0, 60) + '…' + u.slice(-30) + ' [' + u.length + ' caracteres]' : u;
            };
            var gmTry = function(url, headers) {
                return new Promise(function(resolve) {
                    GM_xmlhttpRequest({
                        method: 'GET', url: url, headers: headers || {}, responseType: 'blob', timeout: 30000,
                        onload: function(r) {
                            resolve({
                                status: r.status,
                                bytes: r.response ? r.response.size : null,
                                tipo: r.response ? r.response.type : null,
                                cabecalhos: String(r.responseHeaders || '').split(/\r?\n/).filter(function(h) {
                                    return /^(content-type|content-length|www-authenticate|cache-control|location|server)/i.test(h);
                                })
                            });
                        },
                        onerror: function() { resolve({ erro: 'rede ou domínio não permitido' }); },
                        ontimeout: function() { resolve({ erro: 'tempo esgotado' }); }
                    });
                });
            };

            var resultados = [];
            for (var i = 0; i < assets.length; i++) {
                var cands = [assets[i].url].concat(imageCandidates(assets[i].url));
                for (var j = 0; j < cands.length; j++) {
                    var item = { imagem: assets[i].name, tentativa: j, url: shortUrl(cands[j]) };
                    item.resposta = await gmTry(cands[j]);
                    resultados.push(item);
                }
            }

            var imgsNaPagina = Array.prototype.slice.call(document.querySelectorAll('img')).filter(function(im) {
                return /googleusercontent\.com/.test(im.src || '');
            }).slice(0, 5).map(function(im) {
                return { src: shortUrl(im.src), largura: im.naturalWidth, altura: im.naturalHeight, crossorigin: im.getAttribute('crossorigin') };
            });

            var out = { aviso: 'Endereços encurtados; só constam códigos de resposta.', imagensTestadas: assets.map(function(a) { return a.name; }), resultados: resultados, imagensNaPagina: imgsNaPagina };
            saveBlobAs(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json;charset=utf-8' }), 'gemini-teste-imagens_' + formatTimestampForFilename(new Date()) + '.json');
        } catch (err) {
            console.error(err);
            alert('Falha no teste de imagens do Gemini: ' + (err.message || err));
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
    // 3.8.32: baixa arquivos (imagens geradas) com o mesmo nome usado no link do Markdown.
    function fetchBlobViaGM(url) {
        return new Promise(function(resolve, reject) {
            if (typeof GM_xmlhttpRequest === 'undefined') { reject(new Error('GM_xmlhttpRequest indisponível')); return; }
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                timeout: 60000,
                onload: function(r) {
                    if (r.status >= 200 && r.status < 300 && r.response) resolve(r.response);
                    else reject(new Error('HTTP ' + r.status));
                },
                onerror: function() { reject(new Error('erro de rede ou domínio não permitido')); },
                ontimeout: function() { reject(new Error('tempo esgotado')); }
            });
        });
    }

    function saveBlobAs(blob, fileName) {
        var link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 3.8.34: as imagens do Gemini só abrem com o número da conta na URL (?authuser=N, o mesmo de /u/N/ no endereço da página);
    // sem ele o servidor responde HTTP 403 quando há várias contas Google logadas. Tenta, em ordem: tamanho original, download,
    // tamanho 1600 e o endereço que a própria página usou para exibir a imagem.
    function imageCandidates(baseUrl) {
        if (!/googleusercontent\.com\/gg\//i.test(baseUrl)) return [baseUrl];
        var m = window.location.pathname.match(/^\/u\/(\d+)\//);
        var q = m ? '?authuser=' + m[1] : '';
        var cands = [baseUrl + '=s0' + q, baseUrl + '=d' + q, baseUrl + '=s1600' + q];
        try {
            var imgs = document.querySelectorAll('img');
            for (var i = 0; i < imgs.length; i++) {
                var src = imgs[i].src || '';
                if (src.indexOf(baseUrl) === 0 && cands.indexOf(src) === -1) { cands.push(src); break; }
            }
        } catch (e) { /* ignora */ }
        return cands;
    }

    async function fetchImageBlob(baseUrl) {
        var cands = imageCandidates(baseUrl);
        var errs = [];
        for (var i = 0; i < cands.length; i++) {
            try {
                var blob = await fetchBlobViaGM(cands[i]);
                if (blob && blob.size > 0 && /^image\//i.test(blob.type || '')) return blob;
                errs.push('resposta sem imagem');
            } catch (e) {
                errs.push(String(e && e.message || e));
            }
        }
        throw new Error('todas as ' + cands.length + ' tentativas falharam (' + errs.join('; ') + ')');
    }

    async function downloadAssets(assets) {
        var failed = [];
        for (var i = 0; i < assets.length; i++) {
            try {
                var blob = await fetchImageBlob(assets[i].url);
                saveBlobAs(blob, assets[i].name);
            } catch (e) {
                console.error('Falha ao baixar ' + assets[i].name, e);
                failed.push(assets[i].name + ' (' + (e.message || e) + ')');
            }
            await new Promise(function(res) { setTimeout(res, 500); });
        }
        if (failed.length > 0) {
            alert('O Markdown foi salvo, mas não foi possível baixar ' + failed.length + ' imagem(ns):\n\n' + failed.join('\n'));
        }
    }

    async function startExportProcess() {
        var href = window.location.href;
        var button = document.getElementById('export-markdown-button-float');
        if (button) { button.disabled = true; setButtonLabel(button, '⏳ Baixando...'); }

        try {
            var includeImages = confirm("Deseja incluir links e referências de anexos?");
            var result;

            if (href.includes('gemini.google.com')) result = await exportGemini(includeImages);
            else if (href.includes('aistudio.google.com')) result = await exportAIStudio();
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
            if (result.source === 'Lumo' || result.source === 'Grok' || result.source === 'AI Studio') {
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

            if (includeImages && result.assets && result.assets.length > 0) {
                await downloadAssets(result.assets);
            }

        } catch (err) {
            console.error(err);
            alert('Falha ao exportar: ' + (err.message || err));
        } finally {
            if (button) { button.disabled = false; setButtonLabel(button, '📥 Exportar Chat'); }
        }
    }

    setInterval(createFloatingButton, 1500);
})();

// ==UserScript==
// @name         Universal AI Chat Exporter 3.1.22
// @namespace    https://github.com/sandroaguiar/exportfullchat2md-v3.1
// @version      3.1.22
// @description  Exporta conversas do ChatGPT, Claude e Perplexity com botão flutuante seguro, sanitização de links e cores dedicadas por plataforma.
// @author       Sandro Aguiar & Collaborator
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;

        var button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        // Ajustado para "Exportar Chat" conforme o padrão visual da versão 3.1.10 (sem número de versão)
        button.innerHTML = '📥 Exportar Chat';
        
        var baseStyles = 'position: fixed !important; bottom: 20px !important; right: 180px !important; z-index: 2147483647 !important; padding: 10px 16px !important; border-radius: 6px !important; color: #ffffff !important; border: none !important; cursor: pointer !important; font-size: 13px !important; font-weight: bold !important; box-shadow: 0px 4px 6px rgba(0,0,0,0.1) !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important;';

        var href = window.location.href;
        var bgColor = '#10a37f'; // Verde padrão (ChatGPT)

        if (href.includes('claude.ai')) {
            bgColor = '#e07a5f'; // Salmão / Terracota (Claude)
        } else if (href.includes('perplexity.ai')) {
            bgColor = '#00bcd4'; // Ciano (Perplexity)
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
        
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        
        let cleaned = markdownContent.replace(mdLinkRegex, function(match, text, url) {
            if (url.length > 120 || url.includes('amazonaws.com') || url.includes('token=')) {
                let cleanLabel = (text && text.length < 50 && !text.includes('http')) ? text : '🔗 Fonte / Arquivo Anexo';
                return `[${cleanLabel}](${url})`;
            }
            return match;
        });

        const rawUrlRegex = /<https?:\/\/[^\s>]{120,}>/g;
        cleaned = cleaned.replace(rawUrlRegex, function(match) {
            let innerUrl = match.slice(1, -1);
            return `[🔗 Link de Referência](${innerUrl})`;
        });

        return cleaned;
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
                if (part.content_type === 'image_asset_pointer') {
                    if (includeImages) {
                        textSegments.push('\n![Imagem ' + imageCounter + '](imagem_' + imageCounter + '.png)\n');
                        imageCounter++;
                    }
                } else if (part.content_type === 'file_asset_pointer' || part.asset_pointer) {
                    var fileName = part.filename || part.name || 'Anexo.pdf';
                    textSegments.push('\n📎 **Anexo:** [[' + fileName + ']]\n');
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

    const PerplexityAdapter = {
        getCurrentConversationId: function() {
            const match = window.location.pathname.match(/^\/search\/([^\/?]+)/);
            return match ? match[1] : null;
        },

        _threadHeaders: function(url) {
            const fullUrl = url ? (url.startsWith('http') ? url : window.location.origin + url) : '';
            const headers = {
              'accept': 'application/json',
              'x-app-apiclient': 'default',
              'x-app-apiversion': '2.18',
              'x-request-id': typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36),
              'x-perplexity-request-reason': 'view-thread',
              'x-perplexity-request-endpoint': fullUrl,
            };
            try {
              const activeAccount = sessionStorage.getItem('pplx-active-account');
              if (activeAccount) headers['x-pplx-account'] = activeAccount;
            } catch (_) {}
            return headers;
        },

        _threadQuery: function(limit, offset, fromFirst) {
            const p = new URLSearchParams();
            p.set('with_parent_info', 'true');
            p.set('with_schematized_response', 'true');
            p.set('version', '2.18');
            p.set('source', 'default');
            p.set('limit', String(limit));
            p.set('offset', String(offset));
            p.set('from_first', String(fromFirst));
            p.set('with_first_entry', 'false');
            p.set('with_latest_entry', 'false');
            for (const uc of ['answer_modes', 'search_result_widgets', 'preserve_latex']) {
                p.append('supported_block_use_cases', uc);
            }
            return p;
        },

        _parseDate: function(str) {
            if (!str) return null;
            const hasTz = /(?:Z|[+-]\d{2}:\d{2})$/.test(str);
            const d = new Date(hasTz ? str : str + 'Z');
            return isNaN(d.getTime()) ? null : d;
        },

        getConversationDetails: async function(id) {
            const limit = 50;
            const allEntries = [];
            let body = null;
            let offset = 0;
            let fromFirst = true;

            for (let i = 0; i < 200; i++) {
                const url = `/rest/thread/${id}?` + this._threadQuery(limit, offset, fromFirst);
                const r = await fetch(url, {
                    headers: this._threadHeaders(url),
                    credentials: 'include',
                });
                if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
                body = await r.json();
                allEntries.push(...(body.entries || []));
                if (!body.has_next_page || !body.next_cursor) break;
                offset = body.next_cursor;
                fromFirst = false;
                await sleep(300);
            }

            return {
                ...body,
                entries: allEntries,
                title: body?.thread_metadata?.title || allEntries[0]?.thread_title || '',
            };
        },

        toMarkdownData: function(data, title, includeImages) {
            const meta = data?.thread_metadata || {};
            const entries = data?.entries || [];
            const stripHashes = (s) => s.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');
            const messages = [];

            const globalTimeFormatted = meta.created_at ? formatMessageTimestamp(this._parseDate(meta.created_at)) : '';

            for (const entry of entries) {
                const rawTime = entry?.created_at || entry?.updated_at || meta.created_at;
                const formattedTime = formatMessageTimestamp(this._parseDate(rawTime)) || globalTimeFormatted;

                const userText = entry?.query_str || '';
                let userContent = userText;

                const files = entry?.files || entry?.attachments || [];
                if (includeImages && files.length > 0) {
                    const fileLinks = files.map(f => {
                        let name = f.name || f.filename || '';
                        if (!name && f.url) {
                            try {
                                const urlObj = new URL(f.url);
                                const segments = urlObj.pathname.split('/');
                                name = decodeURIComponent(segments[segments.length - 1] || 'Arquivo_Anexo');
                            } catch(e) {
                                name = 'Arquivo_Anexo';
                            }
                        }
                        return `📎 **Anexo:** [[${name || 'Arquivo_Anexo'}]]`;
                    }).join('\n');
                    userContent = fileLinks + '\n\n' + userContent;
                }

                if (userContent) {
                    messages.push({
                        sender: '👤 Você',
                        timestamp: formattedTime,
                        isUser: true,
                        content: cleanRawText(stripHashes(userContent))
                    });
                }

                const mb = entry?.blocks?.find((b) => b.markdown_block && b.intended_usage === 'ask_text');
                const answer = mb?.markdown_block?.answer || '';
                if (!answer) continue;

                let assistantContent = stripHashes(answer);

                const wrBlock = entry?.blocks?.find((b) => b.web_result_block);
                const webResults = wrBlock?.web_result_block?.web_results || [];
                const citedNums = [...new Set(
                    [...answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]))
                )].filter((n) => Number.isInteger(n) && n >= 1 && n <= webResults.length)
                  .sort((a, b) => a - b);

                if (citedNums.length > 0) {
                    assistantContent += '\n\n---\n\n### References\n\n';
                    for (const n of citedNums) {
                        const w = webResults[n - 1];
                        if (w?.url) {
                            let cleanUrl = w.url.trim();
                            let linkName = `[${n}]`;
                            
                            if (cleanUrl.includes('amazonaws.com')) {
                                try {
                                    const parsedUrl = new URL(cleanUrl);
                                    const pathParts = parsedUrl.pathname.split('/');
                                    const extractedName = pathParts[pathParts.length - 1];
                                    if (extractedName) {
                                        linkName = `[${n}] [[${decodeURIComponent(extractedName)}]]`;
                                    }
                                } catch(e) {}
                            }
                            
                            assistantContent += `- ${linkName}: <${cleanUrl}>\n`;
                        }
                    }
                }

                messages.push({
                    sender: '🤖 Perplexity',
                    timestamp: formattedTime,
                    isUser: false,
                    content: cleanRawText(assistantContent)
                });
            }

            return {
                title: title || meta.title || 'Conversa Perplexity',
                source: 'Perplexity',
                messages: messages
            };
        }
    };

    async function exportPerplexity(includeImages) {
        var chatId = PerplexityAdapter.getCurrentConversationId();
        if (!chatId) throw new Error('Abra uma conversa salva no Perplexity.');
        var rawData = await PerplexityAdapter.getConversationDetails(chatId);
        return PerplexityAdapter.toMarkdownData(rawData, rawData.title, includeImages);
    }

    async function startExportProcess() {
        var href = window.location.href;
        var isClaude = href.includes('claude.ai');
        var isChatGPT = href.includes('chatgpt.com') || href.includes('chat.openai.com');
        var isPerplexity = href.includes('perplexity.ai');

        var button = document.getElementById('export-markdown-button-float');
        if (button) {
            button.disabled = true;
            button.innerHTML = '⏳ Baixando...';
        }

        try {
            var includeImages = confirm("Deseja incluir marcadores de arquivos e anexos?");
            var result;

            if (isClaude) {
                result = await exportClaude(includeImages);
            } else if (isChatGPT) {
                result = await exportChatGPT(includeImages);
            } else if (isPerplexity) {
                result = await exportPerplexity(includeImages);
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

            markdown = sanitizeMarkdownLinks(markdown);

            var safeTitle = (result.title || 'chat')
                .replace(/[/\\?%*:|"<>]/g, '_')
                .trim();
            if (safeTitle.length > 20) {
                safeTitle = safeTitle.substring(0, 20).trim();
            }

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
            alert('Falha ao exportar conversa: ' + (err.message || err));
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = '📥 Exportar Chat';
            }
        }
    }

    setInterval(createFloatingButton, 1500);
})();
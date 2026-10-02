// ==UserScript==
// @name         AIChat2MD
// @namespace    https://github.com/sandroaguiar/AIChat2MD
// @version      3.8.69
// @description  Tampermonkey userscript that exports AI chats (ChatGPT, Claude, Gemini, Google AI Studio, Google AI Mode, Perplexity, Grok, Lumo) to Markdown for Obsidian: full history via API where available, attachment links, and per-message timestamps where the platform provides them.
// @description:pt-BR  Userscript do Tampermonkey que exporta conversas de IA (ChatGPT, Claude, Gemini, Google AI Studio, Google AI Mode, Perplexity, Grok, Lumo) para Markdown, para uso no Obsidian: histórico completo via API quando disponível, links de anexos e hora por mensagem quando a plataforma fornece.
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
// @match        https://www.google.com/search*
// @match        https://www.google.com/ai*
// @icon         https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/assets/icon-128.png
// @downloadURL  https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/AIChat2MD.user.js
// @updateURL    https://raw.githubusercontent.com/sandroaguiar/AIChat2MD/main/AIChat2MD.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @noframes
// @connect      lh3.googleusercontent.com
// @connect      googleusercontent.com
// @connect      usercontent.google.com
// @connect      cloudfront.net
// @connect      drive.google.com
// @connect      drive.usercontent.google.com
// @connect      assets.grok.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var SCRIPT_NAME_VERSION = 'AI Chat to MD 3.8.69';

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📥 Exportar para Markdown", startExportProcess);
        if (window.location.hostname === 'gemini.google.com') {
            GM_registerMenuCommand("🔍 Gemini: salvar diagnóstico de anexos", geminiDiagnostic);
            GM_registerMenuCommand("🔍 Gemini: testar download de imagens", geminiImageTest);
        }
        if (window.location.hostname === 'claude.ai') {
            GM_registerMenuCommand("🔍 Claude: salvar diagnóstico (referências, anexos e arquivos)", claudeDiagnostic);
        }
        if (window.location.href.indexOf('x.com/i/grok') !== -1 || window.location.hostname.indexOf('grok.com') !== -1) {
            GM_registerMenuCommand("🔍 Grok: salvar diagnóstico (estrutura, anexos e arquivos)", grokDiagnostic);
        }
        if (window.location.hostname === 'aistudio.google.com') {
            GM_registerMenuCommand("🔍 AI Studio: salvar diagnóstico (estrutura, anexos e arquivos)", aistudioDiagnostic);
        }
        if (window.location.hostname === 'chatgpt.com' || window.location.hostname === 'chat.openai.com') {
            GM_registerMenuCommand("🔍 ChatGPT: salvar diagnóstico (referências, anexos, imagens e arquivos)", chatgptDiagnostic);
        }
        if (window.location.hostname.indexOf('perplexity.ai') !== -1) {
            GM_registerMenuCommand("🔍 Perplexity: salvar diagnóstico (estrutura, fontes e anexos)", perplexityDiagnostic);
        }
    }

    function isGeminiHost() {
        // 3.8.35/3.8.39: Gemini, AI Studio e AI Mode (todas páginas do Google) bloqueiam innerHTML (Trusted Types).
        var h = window.location.hostname;
        return h === 'gemini.google.com' || h === 'aistudio.google.com' || h === 'www.google.com';
    }

    // 3.8.39: www.google.com/search também serve buscas comuns — só é AI Mode com udm=50 (ou /ai de entrada).
    function isAIModePage() {
        if (window.location.hostname !== 'www.google.com') return false;
        var p = window.location.pathname;
        if (p.indexOf('/ai') === 0) return true;
        if (p.indexOf('/search') === 0) {
            return new URLSearchParams(window.location.search).get('udm') === '50';
        }
        return false;
    }

    // No Gemini (Trusted Types) innerHTML é bloqueado; nas demais plataformas o comportamento original é mantido.
    function setButtonLabel(btn, label) {
        if (isGeminiHost()) { btn.textContent = label; } else { btn.innerHTML = label; }
    }

    function createFloatingButton() {
        if (document.getElementById('export-markdown-button-float')) return;
        // 3.8.39: em www.google.com, só mostra o botão se a página for realmente AI Mode (udm=50 ou /ai).
        if (window.location.hostname === 'www.google.com' && !isAIModePage()) return;

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
        } else if (isAIModePage()) {
            bgColor = '#FBBC05';
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

    // 3.8.46: removida a função sanitizeMarkdownLinks (herdada da 3.7.4): a regex tinha \vert{} no lugar de |,
    // nunca reconhecia nenhum link e não fazia nada. Os links saem exatamente como a plataforma os fornece.

    // 3.8.45: cleanRawText não apaga mais as palavras "Copiar"/"Copy code" em nenhuma plataforma (podem ser
    // conteúdo real da conversa). Os rótulos de botão do Grok são tratados em stripGrokCodeHeaders().
    function cleanRawText(text) {
        if (!text) return '';
        text = text.replace(/This block is not supported on your current device yet\.?/gi, '');
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uEF00-\uEFFF]/g, '');
        text = text.replace(/```[\s\n]*```/g, '');

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
    // 3.8.60: o texto das respostas com pesquisa na web traz marcadores invisíveis (caracteres U+E200..U+E201) como "citeturn0search9",
    // "url<título><endereço>" e "image_group{...}". A lista metadata.content_references diz o que cada marcador (matched_text) vira:
    // o campo "alt" já é Markdown pronto ("([Python.org](url))", "[título](url)"). Carrossel de imagens e rodapé de fontes somem.
    // Marcadores que sobrarem sem correspondência são removidos. Só considera matched_text que contenha o caractere de marcação
    // (nunca um texto comum, como o " " do rodapé de fontes).
    function chatgptCleanUtm(str) {
        return str.replace(/\?utm_source=chatgpt\.com&/g, '?').replace(/[?&]utm_source=chatgpt\.com/g, '');
    }

    function chatgptApplyReferences(str, refs) {
        if (typeof str !== 'string') return str;
        if (Array.isArray(refs)) {
            refs.forEach(function(r) {
                if (!r || typeof r.matched_text !== 'string' || !/[\uE000-\uF8FF]/.test(r.matched_text)) return;
                var rep = '';
                if (r.type !== 'image_group' && r.type !== 'sources_footnote' && typeof r.alt === 'string') rep = chatgptCleanUtm(r.alt);
                str = str.split(r.matched_text).join(rep);
            });
        }
        return str.replace(/\uE200[^\uE201]*\uE201/g, '');
    }

    function extractChatGPTTextFromParts(parts, includeImages, attachments, refs) {
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
                textSegments.push(chatgptApplyReferences(part, refs));
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

    // 3.8.60: arquivos gerados pelo ChatGPT (planilhas, scripts, imagens do Python...). O texto traz [Baixar x.xlsx](sandbox:/mnt/data/x.xlsx);
    // a página pede /backend-api/conversation/<id>/interpreter/download?message_id=...&sandbox_path=... e recebe
    // {status:'success', download_url, file_name}; o download_url (estuary/content, já assinado) devolve o arquivo. O link vira
    // 📎 **[[nome]]** (ou ![[nome]] se for imagem) e o arquivo é baixado junto, com a opção de incluir anexos. Se falhar: só o nome.
    async function chatgptFetchGeneratedFile(conversationId, msgId, sandboxPath, token) {
        var path = sandboxPath;
        try { path = decodeURIComponent(sandboxPath); } catch (e0) { path = sandboxPath; }
        var du = '/backend-api/conversation/' + conversationId + '/interpreter/download?message_id=' + encodeURIComponent(msgId) + '&sandbox_path=' + encodeURIComponent(path);
        var dr = await fetch(du, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!dr.ok) throw new Error('HTTP ' + dr.status);
        var info = await dr.json();
        if (!info || info.status !== 'success' || typeof info.download_url !== 'string') throw new Error('resposta sem endereço de download');
        var name = String(info.file_name || path.split('/').pop() || 'arquivo').replace(/[\\/:*?"<>|]/g, '_').trim();
        var blob = null;
        var tries = [{ credentials: 'include' }, { headers: { 'Authorization': 'Bearer ' + token } }];
        for (var i = 0; i < tries.length && !blob; i++) {
            try {
                var fr = await fetch(info.download_url, tries[i]);
                if (fr.ok) {
                    var b = await fr.blob();
                    if (b && b.size > 0 && (/\.html?$/i.test(name) || !/^text\/html/i.test(b.type || ''))) blob = b;
                }
            } catch (e1) { /* tenta a próxima forma */ }
        }
        return { name: name, url: info.download_url, blob: blob };
    }

    async function chatgptResolveSandboxLinks(text, msgId, conversationId, token, includeImages, state) {
        var re = /(!?)\[([^\]]*)\]\(sandbox:([^)\s]+)\)/g;
        var found = [];
        var m;
        while ((m = re.exec(text)) !== null) found.push({ whole: m[0], path: m[3] });
        for (var i = 0; i < found.length; i++) {
            var f = found[i];
            var base = f.path.split('/').pop();
            try { base = decodeURIComponent(base); } catch (e0) { /* mantém */ }
            var line;
            if (!includeImages) {
                line = '📎 **' + base + '**';
            } else {
                var key = msgId + '|' + f.path;
                var info = state.cache[key];
                if (!info) {
                    try {
                        info = await chatgptFetchGeneratedFile(conversationId, msgId, f.path, token);
                        // nomes repetidos entre respostas ganham " (2)", " (3)"...
                        var orig = info.name, n = 1;
                        while (state.used[info.name.toLowerCase()]) {
                            n++;
                            var dot = orig.lastIndexOf('.');
                            info.name = dot > 0 ? orig.slice(0, dot) + ' (' + n + ')' + orig.slice(dot) : orig + ' (' + n + ')';
                        }
                        state.used[info.name.toLowerCase()] = true;
                        state.assets.push({ name: info.name, url: info.url, kind: 'file', blob: info.blob });
                    } catch (e2) {
                        console.warn('ChatGPT: falha ao obter o arquivo gerado ' + base, e2);
                        info = { failed: true, name: base };
                    }
                    state.cache[key] = info;
                }
                line = info.failed ? '📎 **' + info.name + '** *(arquivo não pôde ser baixado)*' : claudeAttachmentLine(info.name, '', 0);
            }
            text = text.split(f.whole).join(line);
        }
        return text;
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

        // 3.8.60: monta a cadeia em ordem cronológica antes de processar (arquivos repetidos numerados do mais antigo ao mais novo)
        var chain = [];
        var currentNodeId = data.current_node;
        var guard = 0;
        while (currentNodeId && guard++ < 10000) {
            var cnode = mapping[currentNodeId];
            if (!cnode) break;
            chain.unshift(cnode);
            currentNodeId = cnode.parent;
        }

        var fileState = { cache: {}, assets: [], used: {} };
        for (var ci = 0; ci < chain.length; ci++) {
            var node = chain[ci];
            if (node && node.message) {
                var role = node.message.author.role;
                if (role === 'user' || role === 'assistant') {
                    var parts = (node.message.content && node.message.content.parts) || [];
                    var attachments = (node.message.metadata && node.message.metadata.attachments) || [];
                    var refs = (node.message.metadata && node.message.metadata.content_references) || null;
                    var text = extractChatGPTTextFromParts(parts, includeImages, attachments, refs);
                    if (role === 'assistant' && text.indexOf('(sandbox:') !== -1) {
                        try {
                            text = await chatgptResolveSandboxLinks(text, node.message.id || node.id, conversationId, token, includeImages, fileState);
                        } catch (e) { console.warn('ChatGPT: arquivos gerados indisponíveis', e); }
                    }
                    var timeFormatted = formatMessageTimestamp(node.message.create_time * 1000);
                    if (text.length > 0) {
                        orderedMessages.push({
                            sender: role === 'user' ? '👤 Você' : '🤖 ChatGPT',
                            timestamp: timeFormatted,
                            isUser: role === 'user',
                            content: text
                        });
                    }
                }
            }
        }
        return { title: data.title || 'Conversa ChatGPT', messages: orderedMessages, source: 'ChatGPT', assets: fileState.assets };
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

    // 3.8.52: referências da pesquisa na web. Cada bloco "text" traz "citations"; cada citação tem "sources" [{title, url}]
    // (as páginas realmente usadas na frase) e, como reserva, "url" e "metadata.preview_title". Lista sem repetir URLs, na ordem
    // em que aparecem. Só entram links http(s). Os resultados brutos da busca (tool_result) não entram: só o que foi citado.
    function claudeCollectReferences(content) {
        var refs = [];
        var seen = {};
        var add = function(title, url) {
            if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || seen[url]) return;
            seen[url] = true;
            title = (typeof title === 'string' ? title : '').replace(/\s+/g, ' ').replace(/[\[\]]/g, '').trim();
            refs.push({ title: title || url, url: url });
        };
        if (!Array.isArray(content)) return refs;
        content.forEach(function(c) {
            if (!c || c.type !== 'text' || !Array.isArray(c.citations)) return;
            c.citations.forEach(function(ct) {
                if (!ct) return;
                if (Array.isArray(ct.sources) && ct.sources.length > 0) {
                    ct.sources.forEach(function(src) { if (src) add(src.title, src.url); });
                } else {
                    add((ct.metadata && ct.metadata.preview_title) || ct.title, ct.url);
                }
            });
        });
        return refs;
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
        var claudeRefs = claudeCollectReferences(msg.content);
        if (claudeRefs.length > 0 && body) {
            body += '\n\n**Referências:**\n\n' + claudeRefs.map(function(r) {
                return '- [' + r.title + '](' + r.url.replace(/\)/g, '%29') + ')';
            }).join('\n');
        }
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
    // 3.8.54/3.8.55: referências do Perplexity. O texto da resposta traz marcadores [1][2]... que apontam, em ordem (1 = primeiro
    // item), para entry.blocks[].web_result_block.web_results[] (name, url). 3.8.55: no MarkText/Obsidian "[1][2]" virava link de
    // referência quebrado (sobrava só o "1") e "- [1] ..." virava caixa de seleção; por isso, no texto, cada marcador citado vira
    // um número sobrescrito que é link para a fonte (¹ ²), e a lista final usa "- **1.** [título](url)". Marcadores dentro de código
    // (arr[1]) ficam como estão.
    function perplexityResults(entry) {
        var results = [];
        (Array.isArray(entry && entry.blocks) ? entry.blocks : []).forEach(function(b) {
            if (b && b.web_result_block && Array.isArray(b.web_result_block.web_results)) results = results.concat(b.web_result_block.web_results);
        });
        return results;
    }

    function perplexitySuperscript(n) {
        var sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        return String(n).split('').map(function(d) { return sup[d]; }).join('');
    }

    function perplexityValidUrl(r) {
        return (r && typeof r.url === 'string' && /^https?:\/\//i.test(r.url)) ? r.url.replace(/\)/g, '%29') : '';
    }

    // Troca os marcadores [n] (n dentro da lista de fontes) pelo número sobrescrito com link; devolve também os números citados.
    function perplexityAnswerWithLinks(answer, entry) {
        var results = perplexityResults(entry);
        var cited = [];
        if (!results.length || typeof answer !== 'string') return { text: answer, cited: cited };
        var parts = answer.split(/(```[\s\S]*?```|`[^`\n]*`)/);
        for (var i = 0; i < parts.length; i += 2) {
            parts[i] = parts[i].replace(/\[(\d{1,3})\](?!\()/g, function(whole, d) {
                var n = parseInt(d, 10);
                if (n < 1 || n > results.length) return whole;
                if (cited.indexOf(n) === -1) cited.push(n);
                var url = perplexityValidUrl(results[n - 1]);
                return url ? '[' + perplexitySuperscript(n) + '](' + url + ')' : perplexitySuperscript(n);
            });
        }
        cited.sort(function(a, b) { return a - b; });
        return { text: parts.join(''), cited: cited };
    }

    function perplexityReferenceList(cited, entry) {
        var results = perplexityResults(entry);
        var lines = [];
        cited.forEach(function(n) {
            var r = results[n - 1];
            var url = perplexityValidUrl(r);
            if (!url) return;
            var title = (typeof r.name === 'string' ? r.name : '').replace(/\s+/g, ' ').replace(/[\[\]]/g, '').trim() || r.url;
            lines.push('- **' + n + '.** [' + title + '](' + url + ')');
        });
        return lines.length ? '\n\n**Referências:**\n\n' + lines.join('\n') : '';
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
        toMarkdownData: function(data, filesByEntry) {
            const meta = data?.thread_metadata || {};
            filesByEntry = filesByEntry || {};
            const assets = [];
            const messages = [];
            const globalTime = meta.created_at ? formatMessageTimestamp(new Date(meta.created_at)) : '';
            (data?.entries || []).forEach(function(entry) {
                if (entry?.query_str) {
                    messages.push({ sender: '👤 Você', timestamp: '', isUser: true, content: cleanRawText(entry.query_str) });
                }
                const mb = entry?.blocks?.find((b) => b.markdown_block && b.intended_usage === 'ask_text');
                if (mb?.markdown_block?.answer) {
                    messages.push({ sender: '🤖 Perplexity', timestamp: '', isUser: false, content: (function() {
                        var ans = perplexityAnswerWithLinks(cleanRawText(mb.markdown_block.answer), entry);
                        // 3.8.57: arquivos gerados (artefatos) da entrada, acima do texto, como na página
                        var files = filesByEntry[entry.backend_uuid] || [];
                        var fileLines = files.map(function(f) { assets.push({ name: f.name, url: f.url, kind: 'file' }); return claudeAttachmentLine(f.name, '', 0); });
                        return (fileLines.length ? fileLines.join('\n') + '\n\n' : '') + ans.text + perplexityReferenceList(ans.cited, entry);
                    })() });
                }
            });
            // 3.8.24: o Perplexity informa uma única data para a conversa toda; ela vai para o cabeçalho (headerTime), não para cada mensagem.
            return { title: meta.title || 'Conversa Perplexity', source: 'Perplexity', messages: messages, headerTime: globalTime, assets: assets };
        }
    };

    // 3.8.57: arquivos gerados pelo Perplexity (planilhas, scripts etc., "artefatos"). Não vêm na conversa: a página os busca em
    // /rest/thread/<id da entrada>/entry-metadata -> artifact_entries[].assets[].download_info[] ({filename, url, is_exportable}),
    // com endereço já assinado (CloudFront). Os parâmetros (?source=...&version=...) são copiados do pedido que a própria página
    // fez; se não houver, tenta sem parâmetros. Qualquer falha é ignorada: a exportação segue sem os arquivos.
    function perplexityCollectFiles(meta) {
        var out = [];
        ((meta && meta.artifact_entries) || []).forEach(function(ae) {
            ((ae && ae.assets) || []).forEach(function(a) {
                if (!a) return;
                var di = Array.isArray(a.download_info) ? a.download_info.filter(function(d) { return d && d.url && d.is_exportable !== false; })[0] : null;
                var inner = null;
                Object.keys(a).forEach(function(k) {
                    if (!inner && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) && typeof a[k].url === 'string') inner = a[k];
                });
                var url = di ? di.url : (inner ? inner.url : '');
                var name = (di && di.filename) || (inner && (inner.filename || inner.name)) || '';
                name = String(name).replace(/[\\/:*?"<>|]/g, '_').trim();
                if (name && /^https:\/\//i.test(url)) out.push({ name: name, url: url });
            });
        });
        return out;
    }

    async function perplexityFetchFiles(entries) {
        var byEntry = {};
        var usedNames = {};
        try {
            var perf = performance.getEntriesByType('resource').map(function(r) { return String(r.name || ''); });
            var qs = '';
            var modelo = perf.filter(function(u) { return /\/rest\/thread\/[^\/?]+\/entry-metadata/.test(u); })[0] || '';
            if (modelo.indexOf('?') !== -1) {
                qs = modelo.slice(modelo.indexOf('?'));
            } else {
                var any = perf.filter(function(u) { return u.indexOf('perplexity.ai/rest/') !== -1 && /[?&]version=/.test(u); })[0] || '';
                var ver = any.match(/[?&]version=([^&]+)/);
                var src = any.match(/[?&]source=([^&]+)/);
                if (ver) qs = '?source=' + (src ? src[1] : 'default') + '&version=' + ver[1];
            }
            var suffixes = qs ? [qs, ''] : [''];
            for (var i = 0; i < entries.length; i++) {
                var id = entries[i] && entries[i].backend_uuid;
                if (!id) continue;
                for (var j = 0; j < suffixes.length; j++) {
                    try {
                        var r = await fetch('/rest/thread/' + id + '/entry-metadata' + suffixes[j], { credentials: 'include' });
                        if (!r.ok) continue;
                        var files = perplexityCollectFiles(await r.json());
                        // nomes repetidos entre respostas (ex.: o mesmo arquivo gerado de novo) ganham " (2)", " (3)"...
                        files.forEach(function(f) {
                            var base = f.name, n = 1;
                            while (usedNames[f.name.toLowerCase()]) {
                                n++;
                                var dot = base.lastIndexOf('.');
                                f.name = dot > 0 ? base.slice(0, dot) + ' (' + n + ')' + base.slice(dot) : base + ' (' + n + ')';
                            }
                            usedNames[f.name.toLowerCase()] = true;
                        });
                        if (files.length) byEntry[id] = files;
                        break;
                    } catch (e1) { console.warn('Perplexity: falha ao ler os arquivos de uma resposta', e1); }
                }
            }
        } catch (e) { console.warn('Perplexity: arquivos gerados indisponíveis', e); }
        return byEntry;
    }

    async function exportPerplexity(includeImages) {
        var chatId = PerplexityAdapter.getCurrentConversationId();
        if (!chatId) throw new Error('Abra uma conversa salva no Perplexity.');
        var rawData = await PerplexityAdapter.getConversationDetails(chatId);
        var filesByEntry = includeImages ? await perplexityFetchFiles(rawData.entries || []) : {};
        return PerplexityAdapter.toMarkdownData(rawData, filesByEntry);
    }

    // 3.8.53: ferramentas de DIAGNÓSTICO genéricas (usadas pelas plataformas novas; o Claude e o Gemini mantêm as suas).
    // diagMakeRedactor: devolve redact(valor) que corta textos em 60 caracteres (links em 100), listas em 12 itens e troca
    // identificadores (uuid) por marcas uuid#1, uuid#2... Revise o arquivo antes de compartilhar.
    function diagMakeRedactor() {
        var uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        var uuidMap = {};
        var uuidCount = 0;
        var maskUuids = function(str) {
            return str.replace(uuidRe, function(u) {
                var k = u.toLowerCase();
                if (!uuidMap[k]) { uuidCount++; uuidMap[k] = 'uuid#' + uuidCount; }
                return uuidMap[k];
            }).replace(/[A-Za-z0-9_-]{28,}/g, function(w) {
                // 3.8.62: identificadores longos (ex.: arquivos do Google Drive) viram marcas id#1, id#2...
                if (!/\d/.test(w) || !/[A-Za-z]/.test(w)) return w;
                if (!uuidMap[w]) { uuidCount++; uuidMap[w] = 'id#' + uuidCount; }
                return uuidMap[w];
            });
        };
        var redact = function(v, depth) {
            if (typeof v === 'string') {
                if (/^ya29\./.test(v)) return '[token omitido]';
                if (/googleusercontent\.com\/a\//.test(v)) return '[foto de perfil omitida]';
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
                Object.keys(v).forEach(function(k) {
                    // 3.8.54: campos que identificam a pessoa ou dão acesso à conversa não vão para o arquivo
                    if (/token|secret|password|username|email|avatar|author_image/i.test(k) && v[k]) o[k] = '[omitido]';
                    else o[k] = redact(v[k], depth + 1);
                });
                return o;
            }
            return v;
        };
        redact.mask = maskUuids;
        return redact;
    }

    function diagSaveJson(prefix, obj) {
        var blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json;charset=utf-8' });
        var a = document.createElement('a');
        a.download = prefix + '-diagnostico_' + formatTimestampForFilename(new Date()) + '.json';
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // 3.8.58: endereços que a página já consultou (sem arquivos estáticos, sem valores de parâmetros, identificadores trocados por
    // marcas). Ajuda a achar onde a plataforma busca arquivos, imagens e fontes. Recarregar a página (F5) antes enche essa lista.
    function diagPageRequests(redact) {
        var out = {};
        try {
            performance.getEntriesByType('resource').forEach(function(r) {
                var u = String(r.name || '');
                if (/\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|ico|mp4|webm)(\?|$)/i.test(u)) return;
                var k = redact.mask(u.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'));
                if (k.length > 160) k = k.slice(0, 160) + '…';
                out[k] = (out[k] || 0) + 1;
            });
        } catch (e) { out = { erro: String(e && e.message || e) }; }
        return out;
    }

    // 3.8.58: DIAGNÓSTICO do ChatGPT (pelo menu do Tampermonkey). Faz o mesmo pedido da exportação e salva um CENSO dos papéis,
    // tipos de conteúdo, tipos de parte e chaves de metadados da ramificação atual da conversa, mais a ESTRUTURA redigida de algumas
    // mensagens diferentes entre si (textos cortados, identificadores trocados por marcas). Serve para descobrirmos onde o ChatGPT
    // guarda referências/links, anexos, imagens e arquivos gerados, e quais mensagens (ferramentas, código) a exportação ignora hoje.
    async function chatgptDiagnostic() {
        try {
            var match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
            if (!match) throw new Error('Abra uma conversa salva na barra lateral do ChatGPT (endereço com /c/...).');
            var sessionRes = await fetch('/api/auth/session').then(function(r) { return r.json(); });
            var token = sessionRes ? sessionRes.accessToken : null;
            var response = await fetch('/backend-api/conversation/' + match[1], {
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('O ChatGPT respondeu HTTP ' + response.status + '.');
            var data = await response.json();
            var mapping = data.mapping || {};
            var redact = diagMakeRedactor();

            var path = [];
            var nid = data.current_node;
            var guard = 0;
            while (nid && mapping[nid] && guard++ < 5000) { path.unshift(mapping[nid]); nid = mapping[nid].parent; }

            var interesting = /attach|citation|reference|search|file|image|aggregate|asset|sandbox|canvas|gizmo|tool|invoked|tether|content_ref|download|dalle|n7jupd/i;
            var census = { papeis: {}, tiposDeConteudo: {}, tiposDeParte: {}, destinatarios: {}, chavesDeMetadados: {} };
            var selected = [];
            var sigSeen = {};
            var bump = function(o, k) { o[k] = (o[k] || 0) + 1; };

            path.forEach(function(node, i) {
                var m = node && node.message;
                if (!m) return;
                var role = (m.author && m.author.role) || '?';
                var ctype = (m.content && m.content.content_type) || 'sem-tipo';
                bump(census.papeis, role);
                bump(census.tiposDeConteudo, role + ' / ' + ctype);
                if (m.recipient && m.recipient !== 'all') bump(census.destinatarios, role + ' -> ' + m.recipient);
                var sigs = [role + ' / ' + ctype];
                ((m.content && Array.isArray(m.content.parts)) ? m.content.parts : []).forEach(function(p) {
                    var pt = (typeof p === 'string') ? 'texto' : ((p && p.content_type) || 'objeto');
                    if (pt !== 'texto') { bump(census.tiposDeParte, pt); sigs.push('parte.' + pt); }
                });
                var md = m.metadata || {};
                Object.keys(md).forEach(function(k) {
                    var v = md[k];
                    var filled = Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object') ? Object.keys(v).length > 0 : (v !== null && v !== undefined && v !== '' && v !== false);
                    if (!filled) return;
                    bump(census.chavesDeMetadados, k);
                    if (interesting.test(k)) sigs.push('meta.' + k);
                });
                var wanted = false;
                sigs.forEach(function(sg) {
                    sigSeen[sg] = (sigSeen[sg] || 0) + 1;
                    if (sigSeen[sg] <= 2) wanted = true;
                });
                if (wanted && selected.length < 16) selected.push({ posicaoNoCaminho: i, mensagem: redact(m, 0) });
            });

            // 3.8.59: (1) links "sandbox:" nos textos (arquivos gerados) e a resposta do pedido que a própria página faz para
            // baixá-los (/interpreter/download?message_id=...&sandbox_path=...); (2) amostra do texto bruto das respostas com
            // referências, com os caracteres invisíveis de marcação mostrados como ⟦U+XXXX⟧. Só leitura; valores de parâmetros omitidos.
            var maskQuery = function(str) { return str.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'); };
            var sandboxLinks = [];
            var amostras = [];
            path.forEach(function(node) {
                var m = node && node.message;
                if (!m || !m.content || !Array.isArray(m.content.parts)) return;
                m.content.parts.forEach(function(p) {
                    if (typeof p !== 'string') return;
                    var re = /sandbox:[^\s)\]"']+/g;
                    var mm;
                    while ((mm = re.exec(p)) !== null && sandboxLinks.length < 6) {
                        sandboxLinks.push({ idDaMensagem: m.id || node.id, caminho: mm[0], trecho: redact.mask(p.slice(Math.max(0, mm.index - 60), mm.index + mm[0].length + 20)) });
                    }
                    var refs = m.metadata && m.metadata.content_references;
                    if (amostras.length < 2 && Array.isArray(refs) && refs.length > 0) {
                        amostras.push({ idDaMensagem: m.id || node.id, inicioDoTexto: redact.mask(p.slice(0, 500).replace(/[\uE000-\uF8FF]/g, function(c) { return '⟦U+' + c.charCodeAt(0).toString(16).toUpperCase() + '⟧'; })) });
                    }
                });
            });
            var downloads = [];
            for (var si = 0; si < sandboxLinks.length && si < 3; si++) {
                var lk = sandboxLinks[si];
                var item = { arquivo: lk.caminho };
                try {
                    var du = '/backend-api/conversation/' + match[1] + '/interpreter/download?message_id=' + encodeURIComponent(lk.idDaMensagem) + '&sandbox_path=' + encodeURIComponent(lk.caminho.replace(/^sandbox:/, ''));
                    var dr = await fetch(du, { headers: { 'Authorization': 'Bearer ' + token } });
                    item.status = dr.status;
                    var dt = await dr.text();
                    try { item.resposta = JSON.parse(maskQuery(JSON.stringify(redact(JSON.parse(dt), 0)))); } catch (e1) { item.respostaTexto = redact.mask(dt.slice(0, 300)); }
                } catch (e2) { item.erro = String(e2 && e2.message || e2); }
                downloads.push(item);
            }

            var copy = Object.assign({}, data);
            delete copy.mapping;
            diagSaveJson('chatgpt', {
                aviso: 'Textos cortados em 60 caracteres (links em 100), listas em 12 itens, identificadores trocados por marcas, campos de usuário/token omitidos. Revise antes de compartilhar.',
                totalDeNosNaConversa: Object.keys(mapping).length,
                totalDeNosNoCaminhoAtual: path.length,
                censo: census,
                conversa: redact(copy, 0),
                mensagensSelecionadas: selected,
                linksDeArquivosGerados: sandboxLinks,
                respostaDoPedidoDeDownload: downloads,
                amostrasDeTextoBruto: amostras,
                enderecosConsultadosPelaPagina: diagPageRequests(redact)
            });
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do ChatGPT: ' + (err.message || err));
        }
    }

    // 3.8.53: DIAGNÓSTICO do Perplexity (pelo menu do Tampermonkey). Faz o mesmo pedido da exportação e salva um CENSO das chaves
    // de cada entrada (pergunta/resposta) e dos tipos de bloco, mais a ESTRUTURA redigida de algumas entradas diferentes entre si.
    // Serve para descobrirmos onde o Perplexity guarda fontes/links, anexos, imagens e arquivos. Não altera a exportação normal.
    async function perplexityDiagnostic() {
        try {
            var chatId = PerplexityAdapter.getCurrentConversationId();
            if (!chatId) throw new Error('Abra uma conversa salva no Perplexity (endereço com /search/...).');
            var data = await PerplexityAdapter.getConversationDetails(chatId);
            if (!data || typeof data !== 'object') throw new Error('Resposta inesperada do Perplexity.');
            var redact = diagMakeRedactor();
            var entries = Array.isArray(data.entries) ? data.entries : [];

            var census = { chavesDeNivelSuperior: Object.keys(data), chavesDeEntrada: {}, blocos: {}, listasNaEntrada: {} };
            var selected = [];
            var sigSeen = {};
            entries.forEach(function(e, i) {
                var sigs = [];
                Object.keys(e || {}).forEach(function(k) {
                    census.chavesDeEntrada[k] = (census.chavesDeEntrada[k] || 0) + 1;
                    var val = e[k];
                    if (Array.isArray(val) && val.length > 0 && k !== 'blocks') {
                        census.listasNaEntrada[k] = (census.listasNaEntrada[k] || 0) + 1;
                        sigs.push('entrada.' + k);
                    }
                });
                (Array.isArray(e && e.blocks) ? e.blocks : []).forEach(function(b) {
                    if (!b || typeof b !== 'object') return;
                    var inner = Object.keys(b).filter(function(k) { return /_block$/.test(k); }).join('+') || 'sem-bloco';
                    var key = String(b.intended_usage || '?') + ' / ' + inner;
                    census.blocos[key] = (census.blocos[key] || 0) + 1;
                    sigs.push('bloco.' + key);
                });
                var wanted = false;
                sigs.forEach(function(sg) {
                    sigSeen[sg] = (sigSeen[sg] || 0) + 1;
                    if (sigSeen[sg] <= 2) wanted = true;
                });
                if (wanted && selected.length < 8) selected.push({ indice: i, entrada: redact(e, 0) });
            });

            var copy = Object.assign({}, data);
            delete copy.entries;

            // 3.8.55: de onde vêm os cartões de arquivo (ex.: planilha e script gerados)? (1) endereços que a página já consultou
            // (sem valores de parâmetros, sem arquivos estáticos); (2) trechos da página com botões/links de download ou com
            // textos como "Planilha"/"Python". Identificadores trocados por marcas; valores de parâmetros omitidos.
            var maskQuery = function(str) { return str.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'); };
            var requisicoes = {};
            try {
                performance.getEntriesByType('resource').forEach(function(r) {
                    var u = String(r.name || '');
                    if (/\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|ico|mp4|webm)(\?|$)/i.test(u)) return;
                    var k = redact.mask(maskQuery(u));
                    if (k.length > 160) k = k.slice(0, 160) + '…';
                    requisicoes[k] = (requisicoes[k] || 0) + 1;
                });
            } catch (e) { requisicoes = { erro: String(e && e.message || e) }; }

            // 3.8.56: a página consulta /rest/thread/<id da entrada>/entry-metadata logo depois de carregar a conversa. Repete o mesmo
            // pedido (mesmos parâmetros que a própria página usou) para as primeiras entradas e salva a estrutura redigida da resposta:
            // é o provável lugar dos cartões de arquivo (artefatos). Nada é enviado, só leitura.
            var metadados = [];
            try {
                var modelo = '';
                performance.getEntriesByType('resource').forEach(function(r) {
                    if (!modelo && /\/rest\/thread\/[^\/?]+\/entry-metadata/.test(String(r.name || ''))) modelo = String(r.name);
                });
                if (!modelo) {
                    metadados.push({ aviso: 'A página não fez o pedido entry-metadata desde que foi carregada. Recarregue (F5) e rode de novo.' });
                } else {
                    for (var ei = 0; ei < entries.length && ei < 3; ei++) {
                        var eid = entries[ei] && entries[ei].backend_uuid;
                        if (!eid) continue;
                        var u2 = modelo.replace(/\/rest\/thread\/[^\/?]+\/entry-metadata/, '/rest/thread/' + eid + '/entry-metadata');
                        var item = { entrada: ei, pedido: redact.mask(maskQuery(u2.replace(window.location.origin, ''))) };
                        try {
                            var rr = await fetch(u2, { credentials: 'include' });
                            item.status = rr.status;
                            var txt = await rr.text();
                            try { item.resposta = JSON.parse(maskQuery(JSON.stringify(redact(JSON.parse(txt), 0)))); } catch (e1) { item.respostaTexto = redact.mask(txt.slice(0, 300)); }
                        } catch (e2) { item.erro = String(e2 && e2.message || e2); }
                        metadados.push(item);
                    }
                }
            } catch (e) { metadados = [{ erro: String(e && e.message || e) }]; }

            var candidatos = [];
            try {
                var seenEl = [];
                var describe = function(el) {
                    var node = el;
                    for (var up = 0; up < 3 && node.parentElement && node.parentElement !== document.body; up++) node = node.parentElement;
                    if (seenEl.indexOf(node) !== -1) return;
                    seenEl.push(node);
                    var html = node.outerHTML.replace(/<svg[\s\S]*?<\/svg>/gi, '<svg…/>').replace(/\s+(style|d|viewBox|fill|stroke)="[^"]*"/gi, '');
                    html = redact.mask(maskQuery(html));
                    candidatos.push({ tag: node.tagName.toLowerCase(), html: html.length > 1500 ? html.slice(0, 1500) + '…[' + html.length + ' caracteres]' : html });
                };
                document.querySelectorAll('a[download], a[href*="download" i], a[href*="asset" i], a[href*="file" i], button[aria-label*="ownload" i], button[aria-label*="baix" i], [data-testid*="file" i], [data-testid*="asset" i], [data-testid*="attachment" i]').forEach(function(el) {
                    if (candidatos.length < 12) describe(el);
                });
                if (candidatos.length < 12) {
                    document.querySelectorAll('div, span, a, button').forEach(function(el) {
                        if (candidatos.length >= 12 || el.children.length > 0) return;
                        var t = (el.textContent || '').trim();
                        if (t.length > 0 && t.length < 40 && /planilha|spreadsheet|excel|python|csv|baixar|download/i.test(t)) describe(el);
                    });
                }
            } catch (e) { candidatos = [{ erro: String(e && e.message || e) }]; }

            diagSaveJson('perplexity', {
                aviso: 'Textos cortados em 60 caracteres (links em 100), listas em 12 itens, identificadores trocados por marcas, campos de usuário/token omitidos. Revise antes de compartilhar.',
                totalEntradas: entries.length,
                censo: census,
                conversa: redact(copy, 0),
                entradasSelecionadas: selected,
                enderecosConsultadosPelaPagina: requisicoes,
                metadadosDasEntradas: metadados,
                trechosDaPaginaComArquivos: candidatos
            });
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do Perplexity: ' + (err.message || err));
        }
    }

    // 3.8.65: ferramentas de DIAGNÓSTICO para plataformas que são lidas da PÁGINA (DOM). diagDomSkeleton devolve o "esqueleto" de um
    // elemento: tag, classes, atributos úteis (data-*, aria-label, href/src sem valores de parâmetros), texto próprio cortado em 60
    // caracteres e filhos (até 12 por nível, até 9 níveis, orçamento total de nós), sem o interior de <svg>.
    function diagDomSkeleton(el, redact, depth, budget) {
        if (!el || el.nodeType !== 1 || budget.n <= 0) return null;
        budget.n--;
        var maskUrl = function(v) {
            if (/^data:/i.test(v)) return 'data:…[' + v.length + ' caracteres]';
            var t = redact.mask(String(v).replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'));
            return t.length > 100 ? t.slice(0, 100) + '…' : t;
        };
        var o = { t: el.tagName.toLowerCase() };
        var cls = (typeof el.className === 'string') ? el.className.trim().replace(/\s+/g, ' ') : '';
        if (cls) o.c = cls.length > 90 ? cls.slice(0, 90) + '…' : cls;
        ['id', 'role', 'aria-label', 'aria-haspopup', 'download', 'type', 'alt', 'title', 'target', 'name'].forEach(function(a) {
            var v = el.getAttribute(a);
            if (v) o[a] = redact(v, 0);
        });
        ['href', 'src'].forEach(function(a) {
            var v = el.getAttribute(a);
            if (v) o[a] = maskUrl(v);
        });
        for (var ai = 0; ai < el.attributes.length; ai++) {
            var an = el.attributes[ai].name;
            if (an.indexOf('data-') === 0) o[an] = redact(el.attributes[ai].value, 0);
        }
        var own = '';
        for (var ci = 0; ci < el.childNodes.length; ci++) {
            if (el.childNodes[ci].nodeType === 3) own += el.childNodes[ci].nodeValue;
        }
        own = own.replace(/\s+/g, ' ').trim();
        if (own) o.x = redact(own, 0);
        if (o.t !== 'svg' && depth < 9 && el.children.length > 0) {
            var kids = [];
            for (var ki = 0; ki < el.children.length && ki < 12; ki++) {
                var k = diagDomSkeleton(el.children[ki], redact, depth + 1, budget);
                if (k) kids.push(k);
            }
            if (el.children.length > 12) kids.push({ '…': '+' + (el.children.length - 12) + ' filhos' });
            if (kids.length) o.f = kids;
        }
        return o;
    }

    // Inventário da página inteira: valores de data-testid, botões (aria-label), imagens, links por domínio, mídia.
    function diagDomInventory(redact) {
        var census = function(list, getKey, limit) {
            var out = {};
            list.forEach(function(el) {
                var k = getKey(el);
                if (k) out[k] = (out[k] || 0) + 1;
            });
            var keys = Object.keys(out).sort(function(a, b) { return out[b] - out[a]; }).slice(0, limit);
            var res = {};
            keys.forEach(function(k) { res[k] = out[k]; });
            return res;
        };
        var all = function(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
        var hostOf = function(u) { try { return new URL(u, window.location.href).hostname; } catch (e) { return '?'; } };
        var imgs = all('img').slice(0, 25).map(function(im) {
            var src = im.getAttribute('src') || '';
            var up = im.closest('[data-testid]');
            return {
                src: /^data:/i.test(src) ? 'data:…[' + src.length + ' caracteres]' : redact.mask(src.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…')).slice(0, 100),
                alt: redact(im.getAttribute('alt') || '', 0),
                tamanho: (im.naturalWidth || 0) + 'x' + (im.naturalHeight || 0),
                testidAcima: up ? up.getAttribute('data-testid') : null
            };
        });
        return {
            valoresDeDataTestid: census(all('[data-testid]'), function(e) { return e.getAttribute('data-testid'); }, 60),
            botoesPorAriaLabel: census(all('button, [role="button"]'), function(e) { return e.getAttribute('aria-label') ? redact(e.getAttribute('aria-label'), 0) : null; }, 40),
            linksPorDominio: census(all('a[href]'), function(e) { return hostOf(e.getAttribute('href')); }, 25),
            imagens: imgs,
            contagens: {
                img: all('img').length, svg: all('svg').length, canvas: all('canvas').length, video: all('video').length,
                audio: all('audio').length, iframe: all('iframe').length, table: all('table').length, pre: all('pre').length,
                comAtributoDownload: all('[download]').length
            }
        };
    }

    // 3.8.65: DIAGNÓSTICO do Grok (pelo menu do Tampermonkey). O Grok é lido da página: salva (1) quantos elementos cada seletor da
    // exportação encontra, (2) o esqueleto de algumas mensagens diferentes entre si (usuário/Grok, com imagem, link, código, tabela,
    // botão...), (3) o inventário da página e (4) os endereços que a página consultou (o Grok pode ter uma API com a conversa inteira,
    // com fontes, imagens e arquivos). Textos cortados; identificadores omitidos. Não altera a exportação normal.
    async function grokDiagnostic() {
        try {
            var redact = diagMakeRedactor();
            var seletores = ['div[data-testid="chat-message"]', 'div.message-row', 'article', 'div[class*="message"]'];
            var contagem = {};
            seletores.forEach(function(sel) { contagem[sel] = document.querySelectorAll(sel).length; });

            var nodes = Array.prototype.slice.call(document.querySelectorAll(seletores.join(', ')));
            var selected = [];
            var seen = {};
            var checks = { img: 'img', link: 'a[href]', codigo: 'pre, code', tabela: 'table', botao: 'button[aria-label]', lista: 'ul, ol', video: 'video, canvas', download: '[download], a[href*="download"]' };
            nodes.forEach(function(node, i) {
                var low = (node.textContent || '').toLowerCase();
                if (low.indexOf('grok can make mistakes') !== -1 || low.indexOf('grok pode cometer erros') !== -1 || low.indexOf('terms of service') !== -1) return;
                var isUser = node.getAttribute('data-is-user') === 'true' || String(node.className || '').toLowerCase().indexOf('user') !== -1 ||
                    node.querySelector('div[data-testid="fruit-user-avatar"], img[alt*="Avatar"]') !== null;
                var sigs = [isUser ? 'usuario' : 'grok'];
                Object.keys(checks).forEach(function(k) { if (node.querySelector(checks[k])) sigs.push((isUser ? 'usuario.' : 'grok.') + k); });
                node.querySelectorAll('[data-testid]').forEach(function(e) { sigs.push('testid.' + e.getAttribute('data-testid')); });
                var wanted = false;
                sigs.forEach(function(sg) {
                    seen[sg] = (seen[sg] || 0) + 1;
                    if (seen[sg] <= 1) wanted = true;
                });
                if (wanted && selected.length < 7) {
                    selected.push({ indice: i, papel: isUser ? 'usuario' : 'grok', sinais: sigs.filter(function(x, p) { return sigs.indexOf(x) === p; }).slice(0, 25), esqueleto: diagDomSkeleton(node, redact, 0, { n: 160 }) });
                }
            });

            // 3.8.66: o Grok tem API própria. Repete (só leitura, mesmo domínio, com a sessão) os pedidos que a própria página fez para
            // a conversa, a lista de arquivos e os ativos, usando os mesmos endereços e parâmetros, e salva a estrutura redigida das respostas.
            var chamadas = {};
            var perfUrls = [];
            try { perfUrls = performance.getEntriesByType('resource').map(function(r) { return String(r.name || ''); }); } catch (e0) { perfUrls = []; }
            var maskQuery = function(str) { return str.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'); };
            var alvos = {
                'conversa (conversations_v2)': /\/rest\/app-chat\/conversations_v2\/[^\/?]+(\?|$)/,
                'nos das respostas (response-node)': /\/rest\/app-chat\/conversations\/[^\/?]+\/response-node/,
                'arquivos da conversa (files/list)': /\/rest\/conversations\/files\/list\?/,
                'ativos do usuario (assets)': /\/rest\/assets\?/
            };
            for (var nomeAlvo in alvos) {
                var achados = perfUrls.filter(function(u) { return alvos[nomeAlvo].test(u); });
                if (achados.length === 0) { chamadas[nomeAlvo] = { aviso: 'a página não fez esse pedido desde que foi carregada (recarregue com F5 e rode de novo)' }; continue; }
                var item = { pedido: redact.mask(maskQuery(achados[0].replace(window.location.origin, ''))) };
                try {
                    var rr = await fetch(achados[0], { credentials: 'include' });
                    item.status = rr.status;
                    var txt = await rr.text();
                    try { item.resposta = JSON.parse(maskQuery(JSON.stringify(redact(JSON.parse(txt), 0)))); } catch (e1) { item.respostaTexto = redact.mask(maskQuery(txt.slice(0, 300))); }
                } catch (e2) { item.erro = String(e2 && e2.message || e2); }
                chamadas[nomeAlvo] = item;
            }

            // 3.8.67: as mensagens não vêm de conversations_v2 (só título e datas). Palpite: GET .../conversations/<id>/response-node lista os
            // nós das respostas e POST .../load-responses {responseIds:[...]} traz o conteúdo (texto, fontes, imagens, arquivos). Só leitura.
            var probe = async function(method, url, body) {
                var item = { pedido: method + ' ' + redact.mask(maskQuery(url)) };
                var json = null;
                try {
                    var opts = { method: method, credentials: 'include' };
                    if (body) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
                    var r = await fetch(url, opts);
                    item.status = r.status;
                    var t = await r.text();
                    try { json = JSON.parse(t); item.resposta = JSON.parse(maskQuery(JSON.stringify(redact(json, 0)))); } catch (e1) { item.respostaTexto = redact.mask(maskQuery(t.slice(0, 300))); }
                } catch (e2) { item.erro = String(e2 && e2.message || e2); }
                return { item: item, json: json };
            };
            var cidM = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
            if (cidM) {
                var baseUrl = '/rest/app-chat/conversations/' + cidM[1];
                var rn = await probe('GET', baseUrl + '/response-node', null);
                chamadas['response-node (feito pelo diagnóstico)'] = rn.item;
                var rids = [];
                var coletar = function(v) {
                    if (rids.length >= 30 || v === null || typeof v !== 'object') return;
                    if (Array.isArray(v)) { v.forEach(coletar); return; }
                    Object.keys(v).forEach(function(k) {
                        if (/^responseId$/i.test(k) && typeof v[k] === 'string' && rids.indexOf(v[k]) === -1) rids.push(v[k]);
                        else coletar(v[k]);
                    });
                };
                coletar(rn.json);
                if (rids.length > 0) {
                    var lr = await probe('POST', baseUrl + '/load-responses', { responseIds: rids });
                    chamadas['load-responses (feito pelo diagnóstico)'] = lr.item;
                    // 3.8.68: detalhes que o corte de 60 caracteres escondia: marcas <grok:render> no texto, cartões (cardAttachmentsJson),
                    // resultados de pesquisa e passos de cada resposta do Grok (textos até 200 caracteres; identificadores omitidos).
                    var corta = function(v, lim) {
                        if (typeof v === 'string') { var t = redact.mask(maskQuery(v)); return t.length > lim ? t.slice(0, lim) + '…[' + t.length + ']' : t; }
                        if (Array.isArray(v)) return v.slice(0, 8).map(function(x) { return corta(x, lim); });
                        if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function(k) { o[k] = /token|secret|username|email|avatar/i.test(k) ? '[omitido]' : corta(v[k], lim); }); return o; }
                        return v;
                    };
                    var detalhes = [];
                    ((lr.json && lr.json.responses) || []).forEach(function(r) {
                        if (!r || r.sender !== 'assistant') return;
                        var tags = String(r.message || '').match(/<grok:render[\s\S]*?<\/grok:render>/g) || [];
                        var cards = [];
                        (r.cardAttachmentsJson || []).slice(0, 6).forEach(function(c) { try { cards.push(corta(JSON.parse(c), 200)); } catch (e3) { cards.push(corta(String(c), 300)); } });
                        detalhes.push({
                            inicioDoTextoBruto: corta(String(r.message || '').slice(0, 700), 700),
                            quantasMarcasNoTexto: tags.length,
                            marcasNoTexto: tags.slice(0, 6).map(function(t) { return corta(t, 300); }),
                            cartoes: cards,
                            quantosResultadosDePesquisa: (r.webSearchResults || []).length,
                            resultadosDePesquisa: (r.webSearchResults || []).slice(0, 3).map(function(w) { return corta(w, 120); }),
                            passos: (r.steps || []).slice(0, 8).map(function(st) { return { tags: st.tags, quantosResultadosWeb: (st.webSearchResults || []).length, cartoesDeFerramenta: (st.toolUsageCards || []).length, textoInicial: corta((st.text || []).join(' ').slice(0, 200), 200) }; }),
                            anexos: corta(r.fileAttachmentsMetadata || [], 120)
                        });
                    });
                    chamadas['detalhes das respostas do Grok'] = detalhes;
                } else {
                    chamadas['load-responses (feito pelo diagnóstico)'] = { aviso: 'nenhum responseId encontrado em response-node' };
                }
            }

            var h1 = document.querySelector('h1, header h2');
            diagSaveJson('grok', {
                aviso: 'Textos cortados em 60 caracteres (links em 100), identificadores trocados por marcas, campos de usuário/token omitidos. Revise antes de compartilhar.',
                endereco: redact.mask(window.location.pathname),
                tituloDaConversa: h1 ? redact(h1.textContent.trim(), 0) : null,
                quantosElementosPorSeletor: contagem,
                mensagensSelecionadas: selected,
                inventarioDaPagina: diagDomInventory(redact),
                chamadasDeApi: chamadas,
                enderecosConsultadosPelaPagina: diagPageRequests(redact)
            });
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do Grok: ' + (err.message || err));
        }
    }

    // ==========================================
    // MÓDULO GROK (Corrigido para blocos de código limpos)
    // ==========================================
    // 3.8.45: no Grok o cabeçalho de cada bloco de código ("Python" + botão "Copiar"/"Copiado") vazava para o texto.
    // Remove só esse padrão (linha do idioma + linha Copiar/Copiado imediatamente antes de uma cerca ```) e usa o
    // idioma do cabeçalho na cerca, que antes era sempre ```python.
    function stripGrokCodeHeaders(text) {
        var re = /(?:^|\n)[ \t]*(?:([A-Za-z][A-Za-z0-9+#.\-]*(?:[ \t][A-Za-z0-9+#.\-]+)?)[ \t]*\n+)?[ \t]*(?:Copiar|Copy)[ \t]*(?:Copiado|Copied)?[ \t]*\n+[ \t]*```[^\n]*\n/g;
        return text.replace(re, function(m, label) {
            var lang = label ? label.toLowerCase().replace(/\s+/g, '') : 'python';
            if (lang === 'plaintext') lang = 'text';
            return '\n```' + lang + '\n';
        });
    }

    // 3.8.47: listas do Grok. O parser antigo não tratava <ul>/<ol>/<li>, então os itens saíam como linhas soltas,
    // sem marcador. Espelha o renderizador de listas do Lumo (marcadores "-", numeração com o atributo start,
    // sublistas indentadas), chamando o parser do Grok para o conteúdo de cada item.
    function grokRenderListItems(listNode, level) {
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
                out += parseGrokNodeToMarkdown(child, false);
                continue;
            }
            var marker = ordered ? (counter++) + '. ' : '- ';
            var inline = '';
            var nested = '';
            for (var j = 0; j < child.childNodes.length; j++) {
                var sub = child.childNodes[j];
                var subTag = (sub.nodeType === Node.ELEMENT_NODE) ? sub.tagName.toLowerCase() : '';
                if (subTag === 'ul' || subTag === 'ol') {
                    nested += grokRenderListItems(sub, level + 1);
                } else {
                    inline += parseGrokNodeToMarkdown(sub, false);
                }
            }
            inline = inline.trim().replace(/\n\s*\n/g, '\n').replace(/\n/g, '\n' + indent + '    ');
            out += indent + marker + inline + '\n' + nested;
        }
        return out;
    }

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
        // 3.8.47: o contêiner de uma mensagem que tem um bloco de código conta como "código" (querySelector('code') abaixo)
        // e contaminava tudo dentro dele. Para lista, título e negrito/itálico, o que vale é estar DENTRO de um código de verdade.
        var insideRealCode = !!node.closest('pre, code, .code-block');
        if ((tag === 'ul' || tag === 'ol') && !insideRealCode) {
            return '\n' + grokRenderListItems(node, 0) + '\n';
        }
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
        if (/^h[1-6]$/.test(tag) && !insideRealCode) {
            return '\n\n' + '#'.repeat(parseInt(tag.charAt(1), 10)) + ' ' + innerContent.trim().replace(/\s*\n\s*/g, ' ') + '\n\n';
        }
        if ((tag === 'strong' || tag === 'b') && !insideRealCode) return '**' + innerContent.trim() + '**';
        if ((tag === 'em' || tag === 'i') && !insideRealCode) return '*' + innerContent.trim() + '*';

        return innerContent;
    }

    // 3.8.69: Grok pela API própria (confirmada por diagnóstico), em vez de ler a página. GET /rest/app-chat/conversations_v2/<id> (título),
    // GET .../conversations/<id>/response-node (árvore: responseId, sender, parentResponseId) e POST .../load-responses {responseIds}
    // (cada resposta: message em Markdown com marcas <grok:render>, createTime, webSearchResults, cardAttachmentsJson, fileAttachmentsMetadata).
    // As marcas viram: citação -> número sobrescrito com link (url do cartão); arquivo gerado -> 📎; imagem gerada -> ![[imagem]].
    // Imagens e arquivos ficam em https://assets.grok.com/<chave> (lidos com a sessão do navegador). Se a API falhar, usa a leitura da página.
    async function exportGrok(includeImages) {
        var m = window.location.pathname.match(/\/c\/([0-9a-fA-F-]{20,})/);
        if (window.location.hostname.indexOf('grok.com') !== -1 && m) {
            try {
                return await exportGrokApi(m[1], includeImages);
            } catch (e) {
                console.warn('Grok: API indisponível, usando a leitura da página', e);
            }
        }
        return await exportGrokDom();
    }

    async function exportGrokApi(convId, includeImages) {
        var base = '/rest/app-chat/conversations/' + convId;
        var title = '';
        try {
            var cr = await fetch('/rest/app-chat/conversations_v2/' + convId + '?includeWorkspaces=true&includeTaskResult=true', { credentials: 'include' });
            if (cr.ok) { var cj = await cr.json(); title = (cj && cj.conversation && cj.conversation.title) || ''; }
        } catch (e0) { /* usa o título da página */ }
        if (!title) {
            var titleEl = document.querySelector('h1, header h2, title');
            title = titleEl ? titleEl.textContent.trim().replace(/^Grok:\s*/i, '') : 'Conversa Grok';
        }

        var nr = await fetch(base + '/response-node', { credentials: 'include' });
        if (!nr.ok) throw new Error('response-node HTTP ' + nr.status);
        var nodes = (await nr.json()).responseNodes || [];
        if (!nodes.length) throw new Error('conversa sem respostas');

        var byId = {};
        for (var i = 0; i < nodes.length; i += 40) {
            var ids = nodes.slice(i, i + 40).map(function(n) { return n.responseId; });
            var lr = await fetch(base + '/load-responses', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ responseIds: ids }) });
            if (!lr.ok) throw new Error('load-responses HTTP ' + lr.status);
            ((await lr.json()).responses || []).forEach(function(r) { byId[r.responseId] = r; });
        }

        // ramificação ativa: a folha mais recente e seus ancestrais
        var isParent = {};
        nodes.forEach(function(n) { if (n.parentResponseId) isParent[n.parentResponseId] = true; });
        var leaf = null;
        nodes.forEach(function(n) {
            if (isParent[n.responseId] || !byId[n.responseId]) return;
            if (!leaf || String(byId[n.responseId].createTime) > String(byId[leaf.responseId].createTime)) leaf = n;
        });
        var nodeById = {};
        nodes.forEach(function(n) { nodeById[n.responseId] = n; });
        var chain = [];
        var cur = leaf;
        var guard = 0;
        while (cur && guard++ < 5000) {
            if (byId[cur.responseId]) chain.unshift(byId[cur.responseId]);
            cur = cur.parentResponseId ? nodeById[cur.parentResponseId] : null;
        }

        var state = { items: [], byKey: {}, used: {}, imageCount: 0 };
        var tokenOf = function(key, name, kind) {
            if (!state.byKey[key]) {
                state.byKey[key] = { index: state.items.length, key: key, name: name, kind: kind };
                state.items.push(state.byKey[key]);
            }
            return '@@GROKFILE' + state.byKey[key].index + '@@';
        };

        var messages = chain.map(function(r) {
            var isUser = r.sender === 'human';
            var raw = typeof r.message === 'string' ? r.message : '';
            var cards = {};
            (r.cardAttachmentsJson || []).forEach(function(c) { try { var o = JSON.parse(c); if (o && o.id) cards[o.id] = o; } catch (e) { /* ignora */ } });
            var referenced = {};
            var cited = [];
            var text = raw.replace(/<grok:render\b([^>]*)>[\s\S]*?<\/grok:render>/g, function(whole, attrs) {
                var id = (attrs.match(/card_id="([^"]+)"/) || [])[1];
                var type = (attrs.match(/(?:^|\s)type="([^"]+)"/) || [])[1];
                var card = id ? cards[id] : null;
                if (!card) return '';
                if (type === 'render_inline_citation') {
                    if (typeof card.url !== 'string' || !/^https?:\/\//i.test(card.url)) return '';
                    var idx = cited.indexOf(card.url);
                    if (idx === -1) { cited.push(card.url); idx = cited.length - 1; }
                    return '[' + perplexitySuperscript(idx + 1) + '](' + card.url.replace(/\)/g, '%29') + ')';
                }
                if (type === 'render_file' && card.url) {
                    referenced[card.url] = true;
                    return '\n\n' + tokenOf(card.url, card.file_name || card.url.split('/').pop(), 'file') + '\n\n';
                }
                if (type === 'render_generated_image' && card.image_chunk && card.image_chunk.imageUrl) {
                    referenced[card.image_chunk.imageUrl] = true;
                    return '\n\n' + tokenOf(card.image_chunk.imageUrl, '', 'image') + '\n\n';
                }
                return '';
            });
            // imagens que a resposta cita por código e que não vieram nos cartões não podem ser baixadas: fica só o texto alternativo
            text = text.replace(/!\[([^\]]*)\]\(([A-Za-z0-9_-]{3,16})\)/g, function(w, alt) { return alt ? '*(imagem não disponível: ' + alt + ')*' : ''; });
            text = cleanRawText(text).trim();

            // anexos do usuário (e arquivos da resposta que nenhuma marca citou)
            var lines = [];
            (r.fileAttachmentsMetadata || []).forEach(function(f) {
                if (!f || !f.fileUri || referenced[f.fileUri]) return;
                lines.push(tokenOf(f.fileUri, f.fileName || f.fileUri.split('/').pop(), /^image\//i.test(f.fileMimeType || '') && !isUser ? 'image' : 'file'));
            });
            if (lines.length) text = isUser ? lines.join('\n') + (text ? '\n\n' + text : '') : (text ? text + '\n\n' : '') + lines.join('\n');

            if (cited.length) {
                var results = r.webSearchResults || [];
                var refLines = cited.map(function(u, k) {
                    var hit = results.filter(function(w) { return w && w.url === u; })[0];
                    var label = (hit && hit.title) ? String(hit.title).replace(/\s+/g, ' ').replace(/[\[\]]/g, '').trim() : u.replace(/^https?:\/\//i, '').split('/')[0];
                    return '- **' + (k + 1) + '.** [' + label + '](' + u.replace(/\)/g, '%29') + ')';
                });
                text += '\n\n**Referências:**\n\n' + refLines.join('\n');
            }
            var t = Date.parse(r.createTime);
            return { sender: isUser ? '👤 Você' : '🤖 Grok', timestamp: isNaN(t) ? '' : formatMessageTimestamp(t), isUser: isUser, content: text };
        }).filter(function(msg) { return msg.content && msg.content.trim().length > 0; });

        if (messages.length === 0) throw new Error('nenhuma mensagem legível');

        // arquivos e imagens: nomes únicos, download opcional, troca dos marcadores
        var assets = [];
        var lineFor = {};
        for (var k = 0; k < state.items.length; k++) {
            var it = state.items[k];
            var ext = (it.key.split('.').pop() || '').split('?')[0].toLowerCase();
            var name = it.name;
            if (it.kind === 'image' && !name) { state.imageCount++; name = 'grok_imagem_' + state.imageCount + '.' + (ext || 'jpg'); }
            else if (it.kind === 'image' && /^image\.[a-z0-9]+$/i.test(name)) { state.imageCount++; name = 'grok_imagem_' + state.imageCount + '.' + (ext || 'jpg'); }
            name = String(name || 'arquivo').replace(/[\\/:*?"<>|]/g, '_').trim();
            var orig = name, n = 1;
            while (state.used[name.toLowerCase()]) {
                n++;
                var dot = orig.lastIndexOf('.');
                name = dot > 0 ? orig.slice(0, dot) + ' (' + n + ')' + orig.slice(dot) : orig + ' (' + n + ')';
            }
            state.used[name.toLowerCase()] = true;
            if (!includeImages) { lineFor[k] = '📎 **' + name + '**'; continue; }
            try {
                var url = /^https?:\/\//i.test(it.key) ? it.key : 'https://assets.grok.com/' + it.key.replace(/^\//, '');
                var blob = await fetchFileBlob(url, name);
                assets.push({ name: name, url: url, kind: 'file', blob: blob });
                lineFor[k] = claudeAttachmentLine(name, '', 0);
            } catch (e) {
                console.warn('Grok: falha ao baixar ' + name, e);
                lineFor[k] = '📎 **' + name + '** *(não pôde ser baixado)*';
            }
        }
        messages.forEach(function(msg) {
            msg.content = msg.content.replace(/@@GROKFILE(\d+)@@/g, function(w, d) { return lineFor[d] || ''; });
        });

        return { title: title || 'Conversa Grok', source: 'Grok', messages: messages, assets: assets };
    }

    async function exportGrokDom() {
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

            var text = cleanRawText(stripGrokCodeHeaders(parseGrokNodeToMarkdown(node, false)));
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
        if (tag === 'code') {
            // 3.8.45: código dentro de <pre> ou com várias linhas vira bloco com cerca ```; antes saía entre crases
            // simples, e as linhas iniciadas por # viravam títulos no Obsidian. Código curto na mesma linha continua inline.
            var rawCode = node.textContent.replace(/^\n+|\s+$/g, '');
            if (node.closest('pre') || rawCode.indexOf('\n') !== -1) {
                var langMatch = (node.className + ' ' + (node.closest('pre') ? node.closest('pre').className : '')).match(/language-([A-Za-z0-9+#-]+)/);
                return '\n\n```' + (langMatch ? langMatch[1] : '') + '\n' + rawCode + '\n```\n\n';
            }
            return '`' + innerContent.trim() + '`';
        }
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

        // 3.8.50: escapa marcadores de início de linha que o Markdown leria como bloco
        // (título, citação, lista, linha horizontal, cerca de código) no texto BRUTO do usuário.
        // A API do Gemini não distingue código colado de texto normal na mensagem do usuário
        // (confirmado por diagnóstico: vem tudo como uma única string, sem cercas nem linguagem) —
        // sem isso, uma linha como "# comentário" dentro de um código colado virava título de
        // verdade no Obsidian, e o recolher/expandir desse "título" espúrio misturava trechos
        // de partes bem diferentes da conversa.
        _escapeUserMarkdown: function(text) {
            if (!text) return text;
            return text.split('\n').map(function(line) {
                var indent = (line.match(/^ {0,3}/) || [''])[0];
                var rest = line.slice(indent.length);
                if (/^#{1,6}(\s|$)/.test(rest)) return indent + '\\' + rest;
                if (/^>/.test(rest)) return indent + '\\' + rest;
                if (/^[*+-](\s|$)/.test(rest)) return indent + '\\' + rest;
                if (/^\d{1,9}[.)](\s|$)/.test(rest)) return indent + rest.replace(/^(\d{1,9})([.)])/, '$1\\$2');
                if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(rest)) return indent + '\\' + rest;
                if (/^`{3,}/.test(rest)) return indent + '\\' + rest;
                return line;
            }).join('\n');
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
                var att = { name: a[2], mime: (typeof a[11] === 'string') ? a[11] : '', url: (typeof a[3] === 'string') ? a[3] : '',
                            // 3.8.51: arquivos gerados não-imagem trazem a URL de download em a[7][1] (a[7] = [miniatura, download, envio])
                            dl: (Array.isArray(a[7]) && typeof a[7][1] === 'string') ? a[7][1] : '' };
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

        // 3.9.0: código executado pelo Gemini vira callout recolhido do Obsidian;
        // código e saída (stdout/stderr) saem em callouts separados. Saída/erro vazios são descartados.
        _wrapExecutedCode: function(body) {
            var labels = { reference: 'Código executado pelo Gemini', stdout: 'Saída', stderr: 'Erro' };
            return body.replace(/```(\w+)\?code_(reference|stdout|stderr)[^\n]*\n([\s\S]*?)```/g,
                function(match, lang, kind, content) {
                    content = content.replace(/\n$/, '');
                    if ((kind === 'stdout' || kind === 'stderr') && !content.trim()) return '';
                    var quoted = content.split('\n').map(function(l) { return '> ' + l; }).join('\n');
                    return '> [!example]- ' + labels[kind] + '\n>\n> ```' + lang + '\n' + quoted + '\n> ```';
                });
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
            // o Gemini grava o código executado como ```python?code_reference&code_event_index=1;
            // 3.9.0: código e saída viram callouts recolhidos separados (ver _wrapExecutedCode)
            body = this._wrapExecutedCode(body);
            var extraLines = [];
            gen.list.forEach(function(att) {
                if (!usedNames[att.name]) extraLines.push(self._generatedLine(att));
                var isImg = /^image\//i.test(att.mime) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(att.name);
                if (isImg && /^https:\/\//i.test(att.url) && self._assets) self._assets[att.name] = att.url;
                // 3.8.51: arquivo gerado que não é imagem (.xlsx, .js etc.) -> baixa pela URL de download
                else if (!isImg && /^https:\/\//i.test(att.dl) && self._assets) { self._assets[att.name] = att.dl; self._fileNames[att.name] = true; }
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
            self._fileNames = {};
            turns.forEach(function(turn) {
                if (!turn) return;

                var ts = '';
                var t4 = turn[4];
                if (Array.isArray(t4) && typeof t4[0] === 'number') {
                    ts = formatMessageTimestamp(t4[0] * 1000 + Math.floor((t4[1] || 0) / 1e6));
                }

                var user = turn[2];
                if (user && Array.isArray(user[0])) {
                    var userText = (typeof user[0][0] === 'string') ? self._escapeUserMarkdown(self._cleanText(user[0][0])) : '';
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
            var assets = Object.keys(self._assets || {}).map(function(n) { return { name: n, url: self._assets[n], kind: self._fileNames[n] ? 'file' : 'image' }; });
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
                    var role = msgArr[8] === 'user' ? 'user' : 'model';
                    // 3.8.64: hora da mensagem (posição 32 = [segundos, nanossegundos]); anexos do Google Drive (posição 1 = [idDoArquivo, ...]);
                    // fontes da pesquisa na web (posição 15 do modelo = [citações, pesquisas, fontes])
                    var ts = 0;
                    if (Array.isArray(msgArr[32]) && msgArr[32][0] !== null && msgArr[32][0] !== undefined) {
                        var secs = parseInt(msgArr[32][0], 10);
                        if (!isNaN(secs)) ts = secs * 1000 + Math.floor((parseInt(msgArr[32][1], 10) || 0) / 1e6);
                    }
                    var ids = [];
                    if (Array.isArray(msgArr[1])) msgArr[1].forEach(function(x) { if (typeof x === 'string' && x) ids.push(x); });
                    if (ids.length > 0 && role === 'user') parsed.push({ role: 'user', type: 'attachment', ids: ids, ts: ts });
                    if (!text || text.length < 2) return;
                    var type = (role === 'model' && self._isThought(text)) ? 'thought' : 'text';
                    parsed.push({ role: role, type: type, text: text, ts: ts, grounding: (role === 'model' && Array.isArray(msgArr[15])) ? msgArr[15] : null });
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

        // 3.8.64: desfaz o link de redirecionamento do Google ("google.com/url?q=<endereço>") quando houver
        _unwrapGoogleUrl: function(url) {
            if (typeof url !== 'string') return '';
            try {
                var u = new URL(url);
                if (u.hostname === 'www.google.com' && u.pathname === '/url') {
                    var q = u.searchParams.get('q');
                    if (q && /^https?:\/\//i.test(q)) return q;
                }
            } catch (e) { /* mantém o original */ }
            return url;
        },

        // 3.8.64: pesquisas feitas e fontes (grounding) da resposta do modelo; os links vêm do redirecionamento do Google, só com o domínio
        _groundingBlock: function(g) {
            if (!Array.isArray(g)) return '';
            var self = this;
            var queries = Array.isArray(g[1]) ? g[1].filter(function(q) { return typeof q === 'string' && q; }) : [];
            var lines = [];
            (Array.isArray(g[2]) ? g[2] : []).forEach(function(src) {
                if (!Array.isArray(src)) return;
                var url = self._unwrapGoogleUrl(src[1]);
                if (!/^https?:\/\//i.test(url)) return;
                var label = (typeof src[2] === 'string' && src[2]) ? src[2] : url;
                lines.push('- **' + src[0] + '.** [' + label.replace(/[\[\]]/g, '') + '](' + url.replace(/\)/g, '%29') + ')');
            });
            var out = '';
            if (queries.length) out += '\n\n**Pesquisas realizadas:** ' + queries.join('; ');
            if (lines.length) out += '\n\n**Referências:**\n\n' + lines.join('\n');
            return out;
        },

        toMarkdownData: function(data, files) {
            var self = this;
            files = files || {};
            var messages = [];
            var buffer = null;
            var pending = [];
            var pendingTs = 0;
            var fmt = function(ts) { return ts ? formatMessageTimestamp(ts) : ''; };

            function flush() {
                if (buffer) { messages.push({ sender: buffer.sender, timestamp: fmt(buffer.ts), isUser: buffer.isUser, content: buffer.lines.join('\n\n') }); buffer = null; }
            }
            // anexos sem texto (a mensagem do Drive vem separada) ficam esperando o texto do usuário que vem a seguir
            function flushPending() {
                if (pending.length > 0) { messages.push({ sender: '👤 Você', timestamp: fmt(pendingTs), isUser: true, content: pending.join('\n') }); pending = []; pendingTs = 0; }
            }

            data.parsed.forEach(function(m) {
                if (m.type === 'attachment') {
                    flush();
                    m.ids.forEach(function(fid) {
                        var f = files[fid];
                        if (f && f.name) pending.push(claudeAttachmentLine(f.name, '', 0));
                        else if (f && f.failed) pending.push('📎 **Anexo** *(não pôde ser baixado)*');
                        else pending.push('📎 **Anexo**');
                    });
                    if (!pendingTs) pendingTs = m.ts;
                    return;
                }
                var text = self._convertHeadings(m.text).trim();
                if (!text) return;

                if (m.role === 'user') {
                    flush();
                    var userContent = pending.length > 0 ? pending.join('\n') + '\n\n' + text : text;
                    messages.push({ sender: '👤 Você', timestamp: fmt(m.ts || pendingTs), isUser: true, content: userContent });
                    pending = []; pendingTs = 0;
                } else if (m.role === 'system') {
                    flush(); flushPending();
                    messages.push({ sender: '⚙️ Sistema', timestamp: '', isUser: false, content: text });
                } else {
                    flushPending();
                    if (!buffer || buffer.role !== 'model') {
                        flush();
                        buffer = { role: 'model', sender: '🤖 AI Studio', isUser: false, lines: [], ts: m.ts };
                    }
                    if (m.type === 'thought') buffer.lines.push('#### 🤔 Processo de raciocínio\n\n' + text);
                    else if (buffer.lines.length > 0) buffer.lines.push('#### 💡 Resposta\n\n' + text + self._groundingBlock(m.grounding));
                    else buffer.lines.push(text + self._groundingBlock(m.grounding));
                }
            });
            flush();
            flushPending();

            if (messages.length === 0) throw new Error('Nenhuma mensagem legível foi extraída do AI Studio.');
            return { title: data.title || 'Conversa AI Studio', source: 'AI Studio', messages: messages, assets: [] };
        }
    };

    // 3.8.64: lê um anexo do Google Drive com a sessão do navegador (a mesma leitura que o diagnóstico confirmou: tipo, nome e tamanho
    // vêm nos cabeçalhos). O nome é o do cabeçalho Content-Disposition.
    function aistudioFetchDriveFile(fileId, authuser) {
        return new Promise(function(resolve, reject) {
            if (typeof GM_xmlhttpRequest === 'undefined') { reject(new Error('GM_xmlhttpRequest indisponível')); return; }
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId) + '&authuser=' + authuser,
                responseType: 'blob',
                timeout: 60000,
                onload: function(r) {
                    if (r.status < 200 || r.status >= 300 || !r.response || !r.response.size) { reject(new Error('HTTP ' + r.status)); return; }
                    var type = r.response.type || '';
                    if (/^text\/html/i.test(type)) { reject(new Error('o Drive devolveu uma página em vez do arquivo')); return; }
                    var h = String(r.responseHeaders || '');
                    var name = '';
                    var m1 = h.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;\r\n]+)/);
                    var m2 = h.match(/filename\s*=\s*"([^"]+)"/);
                    var m3 = h.match(/filename\s*=\s*([^;\r\n"]+)/);
                    if (m1) { try { name = decodeURIComponent(m1[1].trim()); } catch (e) { name = m1[1].trim(); } }
                    else if (m2) name = m2[1];
                    else if (m3) name = m3[1].trim();
                    resolve({ blob: r.response, name: name, type: type });
                },
                onerror: function() { reject(new Error('erro de rede ou domínio não permitido')); },
                ontimeout: function() { reject(new Error('tempo esgotado')); }
            });
        });
    }

    // 3.8.61/3.8.62: DIAGNÓSTICO do AI Studio (pelo menu do Tampermonkey). A resposta do AI Studio é uma lista posicional (protobuf em
    // JSON), sem nomes de campos; por isso salva (1) o que há em cada posição do nível superior, (2) um CENSO por posição das mensagens,
    // (3) a estrutura redigida de mensagens diferentes entre si, com CADA posição preenchida listada por número (3.8.62; antes as
    // listas eram cortadas e escondiam posições altas) e (4) um TESTE de leitura dos anexos do Google Drive: nome, tipo e tamanho
    // (sem salvar o conteúdo). Textos cortados; identificadores, nomes e fotos de perfil omitidos.
    function aistudioGmProbe(url) {
        return new Promise(function(resolve) {
            if (typeof GM_xmlhttpRequest === 'undefined') { resolve({ erro: 'GM_xmlhttpRequest indisponível' }); return; }
            GM_xmlhttpRequest({
                method: 'GET', url: url, responseType: 'blob', timeout: 60000,
                onload: function(r) {
                    var h = String(r.responseHeaders || '');
                    var pick = function(n) { var m = h.match(new RegExp('^' + n + ':\s*(.*)$', 'im')); return m ? m[1].trim() : ''; };
                    resolve({ status: r.status, enderecoFinal: String(r.finalUrl || ''), tipo: pick('content-type'), disposicao: pick('content-disposition'), tamanhoCabecalho: pick('content-length'), tamanhoRecebido: (r.response && r.response.size) || 0 });
                },
                onerror: function() { resolve({ erro: 'erro de rede ou domínio não permitido' }); },
                ontimeout: function() { resolve({ erro: 'tempo esgotado' }); }
            });
        });
    }

    // 3.8.63: chamada direta (mesmos cabeçalhos do _rpc) que devolve também o corpo do erro, onde o Google costuma explicar o que faltou.
    // Qualquer valor longo na resposta (token, chave) é substituído por um aviso.
    function aistudioRawRpc(method, body) {
        return new Promise(async function(resolve) {
            try {
                var hash = await AIStudioAdapter._computeSAPISIDHash();
                var key = AIStudioAdapter._getApiKey();
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/' + method);
                xhr.withCredentials = true;
                xhr.setRequestHeader('Content-Type', 'application/json+protobuf');
                xhr.setRequestHeader('X-Goog-Api-Key', key);
                xhr.setRequestHeader('X-Goog-AuthUser', AIStudioAdapter._authUserFromUrl());
                xhr.setRequestHeader('Authorization', 'SAPISIDHASH ' + hash);
                xhr.onload = function() {
                    var t = String(xhr.responseText || '').replace(/ya29\.[A-Za-z0-9_.-]+/g, '[token omitido]').replace(/[A-Za-z0-9_.\-]{80,}/g, '[valor longo omitido]');
                    resolve({ status: xhr.status, texto: t.length > 400 ? t.slice(0, 400) + '…[' + t.length + ' caracteres]' : t });
                };
                xhr.onerror = function() { resolve({ erro: 'erro de rede' }); };
                xhr.send(JSON.stringify(body));
            } catch (e) { resolve({ erro: String(e && e.message || e) }); }
        });
    }

    async function aistudioDiagnostic() {
        try {
            var id = AIStudioAdapter.getCurrentConversationId();
            if (!id) throw new Error('Abra um prompt salvo no AI Studio (endereço com /prompts/...).');
            var raw = await AIStudioAdapter._rpc('ResolveDriveResource', [id]);
            var arr = Array.isArray(raw) ? raw : [];
            if (arr.length === 1 && Array.isArray(arr[0])) arr = arr[0];
            var redact = diagMakeRedactor();
            var maskQuery = function(str) { return str.replace(/([?&][^=&"'\s<>]+)=([^&"'\s<>]*)/g, '$1=…'); };
            var tag = function(v) {
                if (v === null || v === undefined) return 'null';
                if (Array.isArray(v)) return 'lista[' + v.length + ']';
                return typeof v;
            };
            // nomes de autor: toda lista [nome, n, fotoDePerfil] perde o nome
            var scrub = function(v) {
                if (!Array.isArray(v)) return;
                if (typeof v[2] === 'string' && /googleusercontent\.com\/a\//.test(v[2]) && typeof v[0] === 'string') v[0] = '[nome omitido]';
                v.forEach(scrub);
            };
            scrub(arr);

            var topo = {};
            arr.forEach(function(v, i) {
                if (v === null || v === undefined || i === 13) return;
                topo[i] = redact(v, 0);
            });

            var groups = Array.isArray(arr[13]) ? arr[13] : [];
            var censo = {};
            var papeis = {};
            var selected = [];
            var seen = {};
            var total = 0;
            var driveIds = [];
            groups.forEach(function(g, gi) {
                if (!Array.isArray(g)) return;
                g.forEach(function(m, mi) {
                    if (!Array.isArray(m)) return;
                    total++;
                    var role = (typeof m[8] === 'string') ? m[8] : '?';
                    papeis[role] = (papeis[role] || 0) + 1;
                    var sigs = ['papel.' + role];
                    m.forEach(function(v, i) {
                        if (v === null || v === undefined) return;
                        var c = censo[i] || (censo[i] = { preenchidas: 0, tipos: {} });
                        c.preenchidas++;
                        var t = tag(v);
                        c.tipos[t] = (c.tipos[t] || 0) + 1;
                        if (i !== 0 && i !== 8) sigs.push('posicao.' + i + '.' + t);
                    });
                    if (Array.isArray(m[1])) m[1].forEach(function(x) { if (typeof x === 'string' && driveIds.length < 3) driveIds.push(x); });
                    var wanted = false;
                    sigs.forEach(function(sg) {
                        seen[sg] = (seen[sg] || 0) + 1;
                        if (seen[sg] <= 2) wanted = true;
                    });
                    if (wanted && selected.length < 14) {
                        var porPosicao = {};
                        m.forEach(function(v, i) { if (v !== null && v !== undefined) porPosicao[i] = redact(v, 0); });
                        selected.push({ grupo: gi, posicao: mi, posicoesPreenchidas: porPosicao });
                    }
                });
            });

            // teste de leitura dos anexos (Google Drive), com os cookies da sessão; só cabeçalhos e tamanho
            var anexos = [];
            for (var di = 0; di < driveIds.length; di++) {
                var fid = driveIds[di];
                var au = AIStudioAdapter._authUserFromUrl();
                var formas = {
                    'drive.google.com/uc': 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fid) + '&authuser=' + au,
                    'drive.usercontent.google.com/download': 'https://drive.usercontent.google.com/download?id=' + encodeURIComponent(fid) + '&export=download&authuser=' + au
                };
                var leituras = {};
                for (var nomeForma in formas) {
                    var um = await aistudioGmProbe(formas[nomeForma]);
                    if (um.enderecoFinal) um.enderecoFinal = redact.mask(maskQuery(um.enderecoFinal));
                    if (um.disposicao) um.disposicao = redact.mask(um.disposicao);
                    leituras[nomeForma] = um;
                }
                anexos.push({ anexo: redact.mask(fid), leituras: leituras });
            }

            // tentativa de obter o token de acesso que a própria página usa (só estrutura; o token nunca é salvo)
            var token = {};
            var variantes = { 'corpo []': [], 'corpo [null]': [null], 'corpo [[]]': [[]], 'corpo [id do prompt]': [id], 'corpo [escopo drive]': ['https://www.googleapis.com/auth/drive'] };
            for (var nomeVar in variantes) {
                token[nomeVar] = await aistudioRawRpc('GenerateAccessToken', variantes[nomeVar]);
            }

            diagSaveJson('aistudio', {
                aviso: 'Textos cortados em 60 caracteres (links em 100), listas em 12 itens, identificadores, nomes, tokens e fotos de perfil omitidos. Revise antes de compartilhar.',
                totalDeGrupos: groups.length,
                totalDeMensagens: total,
                papeis: papeis,
                nivelSuperiorPorPosicao: topo,
                censoPorPosicaoDasMensagens: censo,
                mensagensSelecionadas: selected,
                testeDeLeituraDosAnexos: anexos,
                tentativasDeTokenDeAcesso: token,
                enderecosConsultadosPelaPagina: diagPageRequests(redact)
            });
        } catch (err) {
            console.error(err);
            alert('Falha no diagnóstico do AI Studio: ' + (err.message || err));
        }
    }

    async function exportAIStudio(includeImages) {
        var id = AIStudioAdapter.getCurrentConversationId();
        if (!id) throw new Error('Abra um prompt salvo no AI Studio (endereço com /prompts/...).');
        var raw = await AIStudioAdapter.getConversationDetails(id);

        // 3.8.64: anexos (Google Drive): com a opção de incluir anexos, baixa cada arquivo e o liga no texto
        var files = {};
        var assets = [];
        if (includeImages) {
            var ids = [];
            raw.parsed.forEach(function(p) {
                if (p.type === 'attachment') p.ids.forEach(function(x) { if (ids.indexOf(x) === -1) ids.push(x); });
            });
            var used = {};
            var extByType = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf', 'text/plain': 'txt' };
            for (var i = 0; i < ids.length; i++) {
                try {
                    var got = await aistudioFetchDriveFile(ids[i], AIStudioAdapter._authUserFromUrl());
                    var name = String(got.name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
                    if (!name) name = 'anexo_aistudio_' + (i + 1) + '.' + (extByType[got.type] || 'bin');
                    var orig = name, n = 1;
                    while (used[name.toLowerCase()]) {
                        n++;
                        var dot = orig.lastIndexOf('.');
                        name = dot > 0 ? orig.slice(0, dot) + ' (' + n + ')' + orig.slice(dot) : orig + ' (' + n + ')';
                    }
                    used[name.toLowerCase()] = true;
                    files[ids[i]] = { name: name };
                    assets.push({ name: name, url: '', kind: 'file', blob: got.blob });
                } catch (e) {
                    console.warn('AI Studio: falha ao ler um anexo do Drive', e);
                    files[ids[i]] = { failed: true };
                }
            }
        }
        var result = AIStudioAdapter.toMarkdownData(raw, files);
        result.assets = assets;
        return result;
    }

    // ==========================================
    // 3.8.39: ADAPTADOR AI MODE (módulo isolado, não usado por nenhuma outra plataforma)
    // ==========================================
    // Baseado no ADAPTER[gaim] do AfterChat, simplificado: só exporta a conversa aberta na tela,
    // lendo direto do DOM da página atual (sem API JSON para conteúdo — só existe para listar
    // histórico, que não usamos). Não trata anexos nem imagens/arquivos gerados.
    // Estrutura real: cada turno é um div.CKgc1d (só os de nível mais externo); a pergunta do
    // usuário é h2.iMqumd; a resposta são um ou mais div.pWvJNd dentro do turno, com blocos de
    // conteúdo (div.n6owBd.awi2gc parágrafo / div.otQkpb título / ul.KsbFXc lista / table.NRefec
    // tabela); referências são chips span.WBgIic com links a.PMDqCb.
    var AIModeAdapter = {
        getCurrentConversationId: function() {
            return new URLSearchParams(window.location.search).get('mtid') || null;
        },

        _formatLatex: function(raw) {
            if (!raw) return '';
            var latex = String(raw)
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
            latex = latex.replace(/\\\^\{([^}]+)\}/g, '\\hat{$1}');
            return latex;
        },

        // Só texto puro, pulando script/style/svg/math e contêineres de fórmula.
        _textOf: function(el) {
            var self = this;
            var acc = [];
            function walk(n) {
                n.childNodes.forEach(function(c) {
                    if (c.nodeType === 3) { acc.push(c.textContent); return; }
                    if (c.nodeType !== 1) return;
                    var tag = c.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'MATH') return;
                    if ((c.hasAttribute && c.hasAttribute('data-xpm-copy-root')) ||
                        (c.classList && (c.classList.contains('mTEjhd') || c.classList.contains('cPGBZb')))) return;
                    walk(c);
                });
            }
            if (!el) return '';
            walk(el);
            return acc.join('').replace(/\s+/g, ' ').trim();
        },

        // Serialização inline: fórmulas, negrito, código, chip de referência (-> [N] + refs), links, quebras.
        _inline: function(root, refs) {
            var self = this;
            var parts = [];
            function walk(el) {
                el.childNodes.forEach(function(n) {
                    if (n.nodeType === 3) { parts.push(n.textContent); return; }
                    if (n.nodeType !== 1) return;
                    var tag = n.tagName;
                    var cls = String(n.className || '');
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG') return;

                    // Fórmula matemática
                    if (cls.indexOf('mTEjhd') !== -1 || cls.indexOf('cPGBZb') !== -1 ||
                        (n.hasAttribute && (n.hasAttribute('data-xpm-copy-root') || n.hasAttribute('data-xpm-latex')))) {
                        var img = (n.hasAttribute && n.hasAttribute('data-xpm-latex')) ? n : n.querySelector('[data-xpm-latex]');
                        if (img) {
                            var latex = self._formatLatex(img.getAttribute('data-xpm-latex') || '');
                            var isBlock = cls.indexOf('cPGBZb') !== -1 ||
                                (n.style && n.style.display && n.style.display.indexOf('flex') !== -1 && cls.indexOf('mTEjhd') === -1) ||
                                /\\begin\{(aligned|matrix|cases|gather|align)\}/.test(latex);
                            parts.push(isBlock ? ('\n\n$$\n' + latex + '\n$$\n\n') : ('$' + latex + '$'));
                            return;
                        }
                    }
                    if (tag === 'MATH') {
                        var texAnno = n.querySelector && n.querySelector('annotation[encoding="application/x-tex"], annotation[encoding="LaTeX"]');
                        if (texAnno && texAnno.textContent) parts.push('$' + self._formatLatex(texAnno.textContent) + '$');
                        return;
                    }
                    if (tag === 'CODE') { var ct = self._textOf(n); if (ct) parts.push('`' + ct + '`'); return; }
                    if (tag === 'STRONG' || tag === 'B') {
                        // 3.8.40: usa _inline (não _textOf) para não perder fórmulas matemáticas dentro do negrito
                        // (_textOf ignora de propósito nós mTEjhd/cPGBZb/data-xpm-*, pensados só para texto puro).
                        var bt = self._inline(n, refs);
                        if (bt && !/^[\s\p{P}\p{S}]+$/u.test(bt)) parts.push('**' + bt + '**'); else parts.push(bt);
                        return;
                    }
                    if (tag === 'SPAN' && cls.indexOf('WBgIic') !== -1) {
                        var label = self._textOf(n.querySelector('.QNca8b'));
                        n.querySelectorAll('a.PMDqCb').forEach(function(a) {
                            var href = (a.getAttribute('href') || '').split('#')[0];
                            if (!href) return;
                            refs.push({ n: refs.length + 1, title: label, url: href });
                            parts.push('[' + refs.length + ']');
                        });
                        return;
                    }
                    if (tag === 'A') { var at = self._textOf(n); if (at) parts.push(at); return; }
                    if (tag === 'BR') { parts.push('\n'); return; }
                    walk(n);
                });
            }
            walk(root);
            var s = parts.join('');
            s = s.replace(/[^\S\r\n]+/g, ' ');
            s = s.split('\n').map(function(l) { return l.trim(); }).join('\n');
            s = s.replace(/\n{3,}/g, '\n\n');
            s = s.replace(/ +(?=\[\d+\])/g, '');
            return s.trim();
        },

        _tableMd: function(table, refs) {
            var self = this;
            var grids = Array.from(table.querySelectorAll('tr')).map(function(tr) {
                return Array.from(tr.children).map(function(td) { return self._inline(td, refs).replace(/\|/g, '\\|'); });
            });
            var cols = Math.max(0, ...grids.map(function(r) { return r.length; }));
            var g = grids.map(function(r) { var a = r.slice(); while (a.length < cols) a.push(''); return a; });
            if (g.length === 0) return '';
            var lines = ['| ' + g[0].join(' | ') + ' |', '| ' + Array(cols).fill('---').join(' | ') + ' |'];
            for (var i = 1; i < g.length; i++) lines.push('| ' + g[i].join(' | ') + ' |');
            return lines.join('\n');
        },

        _listMd: function(ul, depth, refs) {
            var self = this;
            var lines = [];
            var pad = '  '.repeat(depth);
            Array.from(ul.children).forEach(function(li) {
                if (li.tagName !== 'LI') return;
                var sub = Array.from(li.children).filter(function(c) { return c.tagName === 'UL' || c.tagName === 'OL'; });
                var wrap = document.createElement('span');
                li.childNodes.forEach(function(c) {
                    if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) return;
                    wrap.appendChild(c.cloneNode(true));
                });
                var text = self._inline(wrap, refs);
                if (text) lines.push(pad + '- ' + text);
                sub.forEach(function(s) {
                    var inner = self._listMd(s, depth + 1, refs);
                    if (inner) inner.split('\n').forEach(function(l) { lines.push(l); });
                });
            });
            return lines.join('\n');
        },

        // Blocos de nível superior dentro de um div.pWvJNd (parágrafo/título/lista/tabela).
        _bodyBlocks: function(pWvJNd, refs) {
            var self = this;
            var blocks = [];
            // 3.8.41: ul.XSq4R.KI3fJ (dentro de div.AHmQrc) são as perguntas de continuação sugeridas
            // ao final da resposta — lista com classe diferente da lista de conteúdo normal (ul.KsbFXc).
            var ALLOW = 'div.n6owBd.awi2gc, div.otQkpb, ul.KsbFXc, table.NRefec, ul.XSq4R.KI3fJ';
            pWvJNd.querySelectorAll(ALLOW).forEach(function(el) {
                if (el.closest('.DBd2Wb, .RkJvxe')) return; // UI de copiar/compartilhar/feedback
                if (blocks.some(function(b) { return b.dom && b.dom.contains(el); })) return; // bloco aninhado
                if (el.tagName === 'UL' && el.closest('li')) return; // lista recuperada pelo pai
                if (el.tagName === 'TABLE' && el.closest('li, div.n6owBd')) return;
                if (el.classList.contains('otQkpb') && el.closest('div.n6owBd, li')) return;
                if (el.classList.contains('n6owBd') && el.closest('li')) return;

                var b = null;
                if (el.classList.contains('otQkpb')) {
                    var t = self._inline(el, refs);
                    if (t) { var bold = (t.indexOf('**') === 0 && t.lastIndexOf('**') === t.length - 2) ? t : '**' + t + '**'; b = { type: 'heading', text: bold }; }
                } else if (el.tagName === 'TABLE') {
                    var md = self._tableMd(el, refs);
                    if (md) b = { type: 'table', md: md };
                } else if (el.tagName === 'UL' && el.classList.contains('XSq4R')) {
                    var smd = self._listMd(el, 0, refs);
                    if (smd) b = { type: 'list', md: '**Perguntas sugeridas para continuar:**\n' + smd };
                } else if (el.tagName === 'UL') {
                    var lmd = self._listMd(el, 0, refs);
                    if (lmd) b = { type: 'list', md: lmd };
                } else {
                    var pt = self._inline(el, refs);
                    if (pt) b = { type: 'para', text: pt };
                }
                if (b) { b.dom = el; blocks.push(b); }
            });
            return blocks;
        },

        // Todos os div.pWvJNd de um turno -> markdown, com as referências numeradas ao final.
        _extractAnswerMd: function(turnEl) {
            var self = this;
            var refs = [];
            var blocks = [];
            turnEl.querySelectorAll('div.pWvJNd').forEach(function(pWvJNd) {
                blocks = blocks.concat(self._bodyBlocks(pWvJNd, refs));
            });
            if (blocks.length === 0) return '';
            var chunks = blocks.map(function(b) { return (b.type === 'table' || b.type === 'list') ? b.md : b.text; }).filter(Boolean);
            var md = chunks.join('\n\n').replace(/\n{3,}/g, '\n\n');
            if (refs.length > 0) {
                md += '\n\n### Referências\n\n' + refs.map(function(r) {
                    return r.title ? ('- [' + r.n + '] ' + r.title + ' ' + r.url) : ('- [' + r.n + '] ' + r.url);
                }).join('\n');
            }
            return md.trim();
        },

        // Lê a conversa renderizada na página atual (não navega para outras conversas do histórico).
        getConversationDetails: function() {
            var self = this;
            var messages = [];
            var fallbackQ = new URLSearchParams(window.location.search).get('q') || '';
            document.querySelectorAll('div.CKgc1d').forEach(function(el) {
                if (el.parentElement && el.parentElement.closest('div.CKgc1d')) return; // só o turno mais externo
                var h2 = el.querySelector('h2.iMqumd');
                var userText = h2 ? self._textOf(h2) : '';
                if (!userText && messages.length === 0 && fallbackQ) userText = fallbackQ;
                if (userText) messages.push({ role: 'user', text: userText });
                var bodyMd = self._extractAnswerMd(el);
                if (bodyMd) messages.push({ role: 'model', text: bodyMd });
            });
            if (messages.length === 0) throw new Error('Nenhum conteúdo de conversa encontrado nesta página do AI Mode.');
            var title = fallbackQ || document.title || 'Conversa AI Mode';
            return { messages: messages, title: title };
        },

        toMarkdownData: function(data) {
            var messages = data.messages.map(function(m) {
                return { sender: m.role === 'user' ? '👤 Você' : '🤖 AI Mode', timestamp: '', isUser: m.role === 'user', content: m.text };
            });
            return { title: data.title, source: 'AI Mode', messages: messages, assets: [] };
        }
    };

    async function exportAIMode() {
        if (!isAIModePage()) throw new Error('Esta página do Google não é o AI Mode (procure a URL com "udm=50" ou "/ai").');
        var data = AIModeAdapter.getConversationDetails();
        return AIModeAdapter.toMarkdownData(data);
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
                turnosIncluidos: Math.min(turns.length, 200),
                turnos: redact(turns.slice(0, 200), 0)
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

    // 3.8.51: arquivos gerados que não são imagem (.xlsx, .js...). A URL (contribution.usercontent.google.com/download?c=...) já traz
    // o token; se falhar, tenta de novo com ?authuser=N (número da conta, como nas imagens). Recusa resposta HTML (página de login/erro).
    async function fetchFileBlob(url, name) {
        var cands = [url];
        var m = window.location.pathname.match(/^\/u\/(\d+)\//);
        if (m) cands.push(url + (url.indexOf('?') === -1 ? '?' : '&') + 'authuser=' + m[1]);
        var wantsHtml = /\.html?$/i.test(name || '');
        var errs = [];
        for (var i = 0; i < cands.length; i++) {
            try {
                var blob = await fetchBlobViaGM(cands[i]);
                if (blob && blob.size > 0 && (wantsHtml || !/^text\/html/i.test(blob.type || ''))) return blob;
                errs.push('resposta vazia ou página HTML');
            } catch (e) {
                errs.push(String(e && e.message || e));
            }
        }
        throw new Error('todas as ' + cands.length + ' tentativas falharam (' + errs.join('; ') + ')');
    }

    // 3.8.42: em navegadores Chromium (showDirectoryPicker disponível), pede a pasta UMA vez e escreve os
    // arquivos direto nela, sem caixa de "Salvar como" por imagem. No Firefox e derivados (sem essa API),
    // ou se o usuário cancelar a escolha da pasta, cai no comportamento anterior (um download por imagem).
    async function downloadAssets(assets) {
        var failed = [];
        var dirHandle = null;
        if (assets.length > 0 && typeof window.showDirectoryPicker === 'function') {
            try {
                dirHandle = await window.showDirectoryPicker({ id: 'aichat2md-imagens', mode: 'readwrite' });
            } catch (e) {
                dirHandle = null; // cancelado ou recusado: segue com download normal por imagem
            }
        }

        for (var i = 0; i < assets.length; i++) {
            try {
                var blob = assets[i].blob ? assets[i].blob : ((assets[i].kind === 'file') ? await fetchFileBlob(assets[i].url, assets[i].name) : await fetchImageBlob(assets[i].url));
                if (dirHandle) {
                    var fileHandle = await dirHandle.getFileHandle(assets[i].name, { create: true });
                    var writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } else {
                    saveBlobAs(blob, assets[i].name);
                }
            } catch (e) {
                console.error('Falha ao baixar ' + assets[i].name, e);
                failed.push(assets[i].name + ' (' + (e.message || e) + ')');
            }
            if (!dirHandle) await new Promise(function(res) { setTimeout(res, 500); });
        }
        if (failed.length > 0) {
            alert('O Markdown foi salvo, mas não foi possível baixar ' + failed.length + ' arquivo(s)/imagem(ns):\n\n' + failed.join('\n'));
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
            else if (href.includes('aistudio.google.com')) result = await exportAIStudio(includeImages);
            else if (isAIModePage()) result = await exportAIMode();
            else if (href.includes('claude.ai')) result = await exportClaude(includeImages);
            else if (href.includes('chatgpt.com') || href.includes('chat.openai.com')) result = await exportChatGPT(includeImages);
            else if (href.includes('perplexity.ai')) result = await exportPerplexity(includeImages);
            else if (href.includes('x.com/i/grok') || href.includes('grok.com')) result = await exportGrok(includeImages);
            else if (href.includes('lumo.proton.me') || href.includes('lumo')) result = await exportLumo();
            else throw new Error('Plataforma não suportada.');

            var lines = [];
            var timestampSuffix = formatTimestampForFilename(new Date());
            var displayDate = timestampSuffix.split('_')[0];

            lines.push('# ' + result.title + '\n');
            var headerDate = '**Data:** ' + displayDate;
            if (result.source === 'Lumo' || (result.source === 'Grok' && !result.messages.some(function(m) { return m.timestamp; })) || result.source === 'AI Mode') {
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

            var markdown = lines.join('\n').trim();
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

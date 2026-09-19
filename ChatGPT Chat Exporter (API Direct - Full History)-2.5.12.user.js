// ==UserScript==
// @name         ChatGPT Chat Exporter (API Direct - Full History)
// @namespace    https://github.com/sandroaguiar/exportfullchat2md
// @version      2.5.12
// @description  Exporta o histórico do ChatGPT com suporte limpo a equações LaTeX ($/$$), imagens e anexos sem corrupção de entidades.
// @author       Sandro Aguiar
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
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

        const button = document.createElement('button');
        button.id = 'export-markdown-button-float';
        button.innerHTML = '📥 Export MD';
        button.style.cssText = `
            position: fixed;
            top: 12px;
            right: 80px;
            z-index: 999999;
            padding: 8px 14px;
            border-radius: 8px;
            background-color: #10a37f;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0px 2px 6px rgba(0,0,0,0.3);
            transition: opacity 0.2s;
        `;

        button.addEventListener('mouseover', function() { button.style.opacity = '0.8'; });
        button.addEventListener('mouseout', function() { button.style.opacity = '1'; });
        button.addEventListener('click', startExportProcess);

        document.body.appendChild(button);
    }

    function getAccessToken() {
        return new Promise((resolve, reject) => {
            fetch('/api/auth/session')
                .then(res => res.json())
                .then(data => {
                    if (data && data.accessToken) {
                        resolve(data.accessToken);
                    } else {
                        reject('Não foi possível obter o Token de Sessão.');
                    }
                })
                .catch(err => reject(err));
        });
    }

    function getConversationId() {
        const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
        return match ? match[1] : null;
    }

    function formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    function formatMathAndCleanText(text) {
        if (!text) return '';

        // 1. Remove caracteres invisíveis de controle da OpenAI
        text = text.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\uE000-\uF8FF]/g, '');

        // 2. Processa Widgets de Matemática (genui / math_block_widget)
        text = text.replace(/genui\{"math_block_widget[^"]*":\s*\{"content":"([\s\S]*?)"\}\}/gi, function(match, mathContent) {
            let cleanMath = mathContent
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"')
                .replace(/\\u003c/g, '<')
                .replace(/\\u003e/g, '>');
            return '\n$$\n' + cleanMath.trim() + '\n$$\n';
        });

        // 3. Extração limpa de marcadores de entidade (entity[...]) sem deixar IDs soltos
        text = text.replace(/entity\[([\s\S]*?)\]/gi, function(match, inner) {
            // Tenta extrair a string LaTeX se houver
            const parts = inner.split(',');
            for (let part of parts) {
                part = part.trim().replace(/^"/, '').replace(/"$/, '');
                if (part.includes('\\') || part.includes('_') || part.includes('^')) {
                    let clean = part.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
                    return '$' + clean + '$';
                }
            }
            return ''; // Remove se for apenas ID de controle da OpenAI
        });

        // 4. Limpeza residual de tags proprietárias
        text = text.replace(/entity\[[\s\S]*?\]/gi, '');
        text = text.replace(/genui\{[\s\S]*?\}/gi, '');

        // 5. Padronização de delimitadores LaTeX estilo MathJax / KaTeX
        // Converte \[ ... \] em blocos centralizados ($$)
        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, function(m, content) {
            return '\n$$\n' + content.trim() + '\n$$\n';
        });

        // Converte \( ... \) em equações inline ($)
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, function(m, content) {
            // Se o conteúdo tiver quebras de linha internas, transforma em bloco $$
            if (content.includes('\n')) {
                return '\n$$\n' + content.trim() + '\n$$\n';
            }
            return '$' + content.trim() + '$';
        });

        // 6. Normalização de blocos centralizados ($$) - garante sintaxe limpa para Obsidian
        text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, function(m, content) {
            let cleanContent = content.trim().replace(/^\$+|\$+$/g, ''); // remove $ extras nas pontas
            return '\n$$\n' + cleanContent + '\n$$\n';
        });

        // 7. Corrige quebras de linha excessivas e limpa o resultado
        return text.replace(/\n{3,}/g, '\n\n').trim();
    }

    function extractTextFromParts(parts, includeImages, attachments) {
        let textSegments = [];
        let imageCounter = 1;

        if (attachments && attachments.length > 0) {
            attachments.forEach(att => {
                const fileName = att.name || 'Arquivo_Anexo';
                const fileUrl = att.url || '#';
                textSegments.push(`📎 **Anexo:** [${fileName}](${fileUrl})\n`);
            });
        }

        parts.forEach(part => {
            if (typeof part === 'string') {
                textSegments.push(part);
            } else if (typeof part === 'object' && part !== null) {
                if (part.content_type === 'image_asset_pointer') {
                    if (includeImages) {
                        textSegments.push(`\n![Imagem ${imageCounter}](imagem_${imageCounter}.png)\n`);
                        imageCounter++;
                    }
                } else if (part.content_type === 'file_asset_pointer' || part.asset_pointer) {
                    const fileName = part.filename || part.name || 'Anexo.pdf';
                    textSegments.push(`\n📎 **Arquivo:** [${fileName}](${fileName})\n`);
                } else if (part.text) {
                    textSegments.push(part.text);
                }
            }
        });

        let fullText = textSegments.join('\n');

        if (!includeImages) {
            fullText = fullText.replace(/!\[.*?\]\((.*?)\)/g, '');
            fullText = fullText.replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g, '');
        }

        return formatMathAndCleanText(fullText);
    }

    async function startExportProcess() {
        const conversationId = getConversationId();
        if (!conversationId) {
            alert('Atenção: Abra uma conversa salva na barra lateral para poder exportar.');
            return;
        }

        const includeImages = confirm("Deseja INCLUIR os marcadores de imagens/anexos no arquivo?\n\n- OK: Insere marcadores de imagens e links de arquivos/PDFs.\n- Cancelar: REMOVE referências visuais.");

        const button = document.getElementById('export-markdown-button-float');
        if (button) button.innerHTML = '⏳ Baixando via API...';

        try {
            const token = await getAccessToken();
            const response = await fetch(`/backend-api/conversation/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na API (${response.status})`);
            }

            const data = await response.json();
            const title = data.title || document.title.replace('- ChatGPT', '').trim() || 'Conversa ChatGPT';
            const mapping = data.mapping;

            if (!mapping) {
                throw new Error('Dados da conversa vazios.');
            }

            const orderedMessages = [];
            let currentNodeId = data.current_node;

            while (currentNodeId) {
                const node = mapping[currentNodeId];
                if (node && node.message) {
                    const role = node.message.author.role;
                    if (role === 'user' || role === 'assistant') {
                        const parts = node.message.content?.parts || [];
                        const attachments = node.message.metadata?.attachments || [];
                        const text = extractTextFromParts(parts, includeImages, attachments);

                        if (text.length > 0) {
                            orderedMessages.unshift({
                                sender: role === 'user' ? '👤 Você' : '🤖 ChatGPT',
                                content: text
                            });
                        }
                    }
                }
                currentNodeId = node ? node.parent : null;
            }

            const lines = [];
            const date = formatDate();
            const url = window.location.href;

            lines.push(`# ${title}\n`);
            lines.push(`**Data:** ${date} | **Fonte:** [ChatGPT](${url})\n`);
            lines.push(`---\n`);

            orderedMessages.forEach(msg => {
                if (msg.content) {
                    lines.push(`**${msg.sender}:**\n`);
                    lines.push(msg.content);
                    lines.push('\n---\n');
                }
            });

            const markdown = lines.join('\n').trim();
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const a = document.createElement('a');
            a.download = `${title.replace(/[/\\?%*:|"<>]/g, '_')}_${date}.md`;
            a.href = URL.click ? a.click() : null;
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            alert(`Falha ao exportar conversa: ${err.message || err}`);
        } finally {
            if (button) button.innerHTML = '📥 Export MD';
        }
    }

    setInterval(createFloatingButton, 2000);
})();
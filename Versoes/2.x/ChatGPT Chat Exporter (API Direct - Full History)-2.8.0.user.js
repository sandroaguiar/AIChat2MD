// ==UserScript==
// @name         ChatGPT Chat Exporter (API Direct - Full History)
// @namespace    https://github.com/rashidazarang/chatgpt-chat-exporter
// @version      2.8.0
// @description  Exporta o histórico do ChatGPT limpando artefatos de UI/RichText e gerando LaTeX puro para Obsidian e Typora.
// @author       Rashid Azarang
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

        button.addEventListener('mouseover', () => { button.style.opacity = '0.85'; });
        button.addEventListener('mouseout', () => { button.style.opacity = '1'; });
        button.addEventListener('click', startExportProcess);

        document.body.appendChild(button);
    }

    function getAccessToken() {
        return new Promise((resolve, reject) => {
            fetch('/api/auth/session')
                .then(res => {
                    if (!res.ok) throw new Error(`Sessão inválida (${res.status})`);
                    return res.json();
                })
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

    function sanitizeChatGPTString(text) {
        if (!text) return '';

        // 1. Extrai o conteúdo real dos blocos de equações do Ngenui
        text = text.replace(/[\s\S]*?Ngenui[^{\n]*?\{"math_block_widget_always_prefetch_v2":\s*\{"content":"([\s\S]*?)"\}\}[\s\S]*?/gi, (match, mathContent) => {
            // Desescapa as barras duplas vindas do JSON
            const cleanMath = mathContent
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"');
            return `\n$$\n${cleanMath}\n$$\n`;
        });

        // 2. Remove tags Nentity com qualquer caracter especial ao redor (ex: NentityÖ[...])
        text = text.replace(/[^\s\w,.-]*?Nentity[\s\S]*?\][^\s\w,.-]*/gi, '');

        // 3. Limpa resíduos de Ngenui que não eram widgets de matemática
        text = text.replace(/[^\s\w,.-]*?Ngenui[\s\S]*?\}/gi, '');

        // Protege blocos de código para não interferir nas expressões regulares de LaTeX
        const codeBlocks = [];
        text = text.replace(/```[\s\S]*?```/g, (m) => {
            codeBlocks.push(m);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });

        // Normalização de delimitadores LaTeX padrão
        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '\n$$\n$1\n$$\n');
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$1$');

        // Corrige $1$ isolado gerado em tabelas ou tópicos por artefatos de renderização
        text = text.replace(/(^|\s)\$1\$(\s|$)/g, '$11$2');

        // Restaura blocos de código intactos
        text = text.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[parseInt(idx, 10)]);

        return text.trim();
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
                if (part.text) {
                    textSegments.push(part.text);
                } else if (part.content_type === 'image_asset_pointer' && includeImages) {
                    textSegments.push(`\n![Imagem ${imageCounter}](imagem_${imageCounter}.png)\n`);
                    imageCounter++;
                } else if (part.content_type === 'file_asset_pointer' || part.asset_pointer) {
                    const fileName = part.filename || part.name || 'Anexo.pdf';
                    textSegments.push(`\n📎 **Arquivo:** [${fileName}](${fileName})\n`);
                }
            }
        });

        let fullText = textSegments.join('\n');

        if (!includeImages) {
            fullText = fullText.replace(/!\[.*?\]\((.*?)\)/g, '');
        }

        return sanitizeChatGPTString(fullText);
    }

    async function startExportProcess() {
        const conversationId = getConversationId();
        if (!conversationId) {
            alert('Atenção: Abra uma conversa salva na barra lateral para poder exportar.');
            return;
        }

        const includeImages = confirm("Deseja INCLUIR os marcadores de imagens e anexos?");

        const button = document.getElementById('export-markdown-button-float');
        if (button) {
            button.innerHTML = '⏳ Baixando...';
            button.disabled = true;
        }

        try {
            const token = await getAccessToken();
            const response = await fetch(`/backend-api/conversation/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Erro API (${response.status})`);

            const data = await response.json();
            const title = data.title || document.title.replace('- ChatGPT', '').trim() || 'Conversa ChatGPT';
            const mapping = data.mapping;

            if (!mapping) throw new Error('Dados da conversa vazios.');

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
                                sender: role === 'user' ? 'Você' : 'ChatGPT',
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
            lines.push(`**Data de Exportação:** ${date} | **Fonte:** [Acessar Chat Original](${url})\n`);
            lines.push(`---\n`);

            orderedMessages.forEach(msg => {
                lines.push(`### **${msg.sender}**\n`);
                lines.push(msg.content);
                lines.push('\n---\n');
            });

            const markdown = lines.join('\n').trim();
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const sanitizedTitle = title.replace(/[/\\?%*:|"<>]/g, '_');
            
            const a = document.createElement('a');
            a.download = `${sanitizedTitle}_${date}.md`;
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

        } catch (err) {
            console.error(err);
            alert(`Falha ao exportar conversa: ${err.message || err}`);
        } finally {
            if (button) {
                button.innerHTML = '📥 Export MD';
                button.disabled = false;
            }
        }
    }

    const observer = new MutationObserver(() => {
        if (!document.getElementById('export-markdown-button-float')) {
            createFloatingButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    createFloatingButton();
})();
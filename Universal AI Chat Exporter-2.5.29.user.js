// ==UserScript==
// @name         ChatGPT Chat Exporter (API Direct - Full History)
// @namespace    https://github.com/sandroaguiar/exportfullchat2md
// @version      2.5.29
// @description  Exporta histórico corrigindo widgets de equações, barras duplas e delimitadores LaTeX do Obsidian.
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

    function cleanRawText(text) {
        if (!text) return '';

        // 1. Remove caracteres de controle e faixa Unicode privada da OpenAI (\uE000-\uF8FF)
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uEF00-\uEFFF]/g, '');

        // 2. Extrai a equação limpa dos widgets de matemática e remove chaves de fechamento residuais
        text = text.replace(/(?:N?\s*genui[^{\n]*)?\{[\s\S]*?"content":\s*"([\s\S]*?)"[\s\S]*?\}\s*\}?\s*Ô?/gi, function(match, content) {
            if (content) {
                let mathText = content
                    .replace(/\\\\\\\\/g, '\\')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\"/g, '"');

                return '\n$$\n' + mathText.trim() + '\n$$\n';
            }
            return '';
        });

        // 3. Remove chaves soltas residuais em linhas isoladas logo após equações
        text = text.replace(/\$\$\s*\n\}\s*/g, '$$\n');

        // 4. Remove resíduos de tags genui isoladas e marcadores de entidade/glifos
        text = text.replace(/N?\s*genui[^\n]*/gi, '');
        text = text.replace(/^N\s*$/gm, '');
        text = text.replace(/^Ô\s*$/gm, '');
        text = text.replace(/entity\[[\s\S]*?\]/gi, '');
        text = text.replace(/\$1\$/g, '');

        // 5. Converte delimitadores de bloco \[ ... \] para $$ ... $$
        text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, function(match, mathCode) {
            return '\n$$\n' + mathCode.trim() + '\n$$\n';
        });

        // 6. Converte delimitadores inline \( ... \) para $ ... $
        text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, function(match, mathCode) {
            return '$' + mathCode.trim() + '$';
        });

        // 7. Corrige barras duplas residuais em comandos LaTeX
        text = text.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

        // 8. Normaliza saltos de linha
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

        return cleanRawText(fullText);
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
// ==UserScript==
// @name         Universal AI Chat Exporter
// @namespace    https://github.com/sandroaguiar/Universal-AI-Chat-Exporter2MD
// @version      1.0.0
// @description  Exporta o histórico completo do ChatGPT para Markdown
// @author       Sandro Aguiar & Collaborator
// @match        https://chat.openai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/sandroaguiar/Universal-AI-Chat-Exporter2MD
// @downloadURL https://github.com/sandroaguiar/Universal-AI-Chat-Exporter2MD/blob/main/Universal%20AI%20Chat%20Exporter-1.0.0.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Adicionar um botão à interface do ChatGPT
    function addExportButton() {
        // Verificar se o nosso botão já existe
        if (document.getElementById('export-markdown-button')) return;

        // Encontre um local adequado para inserir o botão
        const targetElement = document.querySelector('nav');
        if (!targetElement) return;

        // Criar o botão
        const button = document.createElement('button');
        button.id = 'export-markdown-button';
        button.innerHTML = 'Export as Markdown';
        button.style.cssText = `
            margin: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: #10a37f;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
            width: calc(100% - 20px);
        `;

        // Adicionar ouvinte de evento de clique
        button.addEventListener('click', exportMarkdown);

        // Adicionar botão à página
        targetElement.appendChild(button);
    }

    function formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    function escapeMarkdown(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/`/g, '\\`')
            .replace(/\n{3,}/g, '\n\n');
    }

    function processMessageContent(element) {
        const clone = element.cloneNode(true);

        // Substituir os blocos <pre><code>
        clone.querySelectorAll('pre').forEach(pre => {
            const code = pre.innerText.trim();
            const langMatch = pre.querySelector('code')?.className?.match(/language-([a-zA-Z0-9]+)/);
            const lang = langMatch ? langMatch[1] : '';
            pre.replaceWith(`\n\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
        });

        // Substituir imagens e canvas por marcadores de lugar
        clone.querySelectorAll('img, canvas').forEach(el => {
            el.replaceWith('[Image or Canvas]');
        });

        // Converter o HTML restante em texto simples no estilo Markdown
        return escapeMarkdown(clone.innerText.trim());
    }

    function exportMarkdown() {
        const messages = document.querySelectorAll('div[class*="group"]');
        const lines = [];

        const title = 'Conversation with ChatGPT';
        const date = formatDate();
        const url = window.location.href;

        lines.push(`# ${title}\n`);
        lines.push(`**Date:** ${date}`);
        lines.push(`**Source:** [chat.openai.com](${url})\n`);
        lines.push(`---\n`);

        messages.forEach(group => {
            const isUser = !!group.querySelector('img');
            const sender = isUser ? 'You' : 'ChatGPT';
            const block = group.querySelector('.markdown, .prose, .whitespace-pre-wrap');

            if (block) {
                const content = processMessageContent(block);
                if (content) {
                    lines.push(`### **${sender}**\n`);
                    lines.push(content);
                    lines.push('\n---\n');
                }
            }
        });

        const markdown = lines.join('\n').trim();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.download = `ChatGPT_Conversation_${date}.md`;
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Adicionar o botão “Exportar” quando o DOM estiver totalmente carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addExportButton);
    } else {
        addExportButton();
    }

    // Verifique periodicamente se o botão precisa ser adicionado (para SPAs como o ChatGPT)
    setInterval(addExportButton, 3000);
})(); 

Aqui está o **README** completo e detalhado documentando a evolução do projeto **Universal AI Chat Exporter** desde a versão `3.1.07` até a versão atual `3.1.22`.

  

# 🚀 Universal AI Chat Exporter - Histórico de Implementação & Changelog

Este documento registra a evolução técnica, correções visuais, ajustes de design e melhorias de engenharia aplicadas ao script **Universal AI Chat Exporter** da versão `3.1.07` até a estabilização na versão `3.1.22`.

  

## 📌 Visão Geral do Projeto

O **Universal AI Chat Exporter** é um script Tampermonkey projetado para extrair conversas completas de assistentes de IA (ChatGPT, Claude e Perplexity) diretamente para arquivos Markdown (`.md`) formatados, limpos e estruturados, mantendo a compatibilidade com ambientes de notas como o Obsidian.

  

## 📋 Histórico de Versões e Evolução (v3.1.07 → v3.1.22)

### 🔹 Versão 3.1.07 - A Base Estrutural

- **Objetivo:** Estabelecer a captura assíncrona robusta para as três principais plataformas de IA.
    
      
    
- **Implementações:**
    
      
    - Criação dos adaptadores de extração nativa de rotas internas (`/backend-api/conversation/` no ChatGPT, `/api/organizations/` no Claude e `/rest/thread/` no Perplexity).
        
          
        
    - Inclusão do suporte a limpeza básica de blocos e remoção de metadados corrompidos.
        
          
        

### 🔹 Versão 3.1.10 - Identidade Visual e Cores Dinâmicas

- **Objetivo:** Consolidar a experiência visual flutuante com cores adaptativas baseadas na plataforma ativa.
    
      
    
- **Implementações:**
    
      
    - Implementação da função `getPlatformThemeColor()` para injetar dinamicamente as cores oficiais da UI de cada IA:
        
          
        - **ChatGPT:** Verde corporativo (`#10a37f`).
            
              
            
        - **Claude:** Salmão / Terracota suave (`#e07a5f`).
            
              
            
        - **Perplexity:** Ciano (`#00bcd4`).
            
              
            
    - Padronização do texto do botão flutuante como **"Exportar Chat (v3.1.10)"**.
        
          
        

### 🔹 Versão 3.1.11 - Tentativas de Compactação (Ajuste de UI)

- **Objetivo:** Reduzir o espaço ocupado pelo botão flutuante na tela.
    
      
    
- **Modificações testadas:**
    
      
    - Alteração do texto para rótulos mais curtos (como "Export MD" ou ícones isolados).
        
          
        
    - _Resultado:_ Gerou desalinhamento visual e afastamento do padrão ergonômico desejado pelo usuário (conforme evidenciado nas comparações visuais das capturas de tela).
        
          
        

### 🔹 Versão 3.1.12 a 3.1.21 - Refinamentos de Sanitização e Correção de Links

- **Objetivo:** Aprimoramento da limpeza de URLs e robustez contra quebras de blocos LaTeX.
    
      
    
- **Implementações:**
    
      
    - **Sanitização Inteligente de Links (`sanitizePerplexityLinks`):** URLs longas, com tokens de sessão ou da AWS S3 passaram a ser encurtadas de forma limpa para evitar poluição visual no Markdown.
        
          
        
    - **Tratamento de LaTeX:** Conversão consistente de blocos matemáticos (`\[ ... \]` para `$$ ... $$` e `\( ... \)` para `$ ... $`).
        
          
        
    - **Remoção de lixo de renderização:** Limpeza automatizada de strings residuais como `This block is not supported on your current device yet` e caracteres de controle invisíveis.
        
          
        

### ⭐ Versão 3.1.22 (Versão Atual Estabilizada)

- **Objetivo:** Retorno ao padrão visual perfeito da v3.1.10 com a estrutura de engenharia de ponta da v3.1.12.
    
      
    
- **Implementações:**
    
      
    - **Botão Flutuante Perfeito:** Restauração do texto clássico **"Exportar Chat"** (exatamente como na v3.1.10, mas **sem o número da versão** no corpo do botão para manter a interface limpa).
        
          
        
    - **Posicionamento & Z-Index blindado:** Garantia de que o botão flutue perfeitamente no canto inferior direito (`bottom: 20px`, `right: 180px`, `z-index: 2147483647`) sem cobrir os controles nativos de envio de mensagem das plataformas.
        
          
        
    - **Cores Contextuais Mantidas:** Aplicação automática do Verde (ChatGPT), Salmão (Claude) e Ciano (Perplexity) conforme a aba do navegador em uso.
        
          
        

## 🛠️ Tecnologias e Recursos Empregados

- **Linguagem:** JavaScript Moderno (ES6+ async/await, Fetch API).
    
      
    
- **Ambiente:** Tampermonkey / Greasemonkey (Userscript).
    
      
    
- **Formatos de Saída:** Markdown estruturado (`.md`) compatível com Obsidian, Notion e editores de texto Markdown.

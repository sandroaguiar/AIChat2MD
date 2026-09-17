# 📋 Changelog - Universal AI Chat Exporter


## [3.7.4] - 2026-09-17

### 🛠️ Correções e Ajustes (Grok)

- **Correção no Parser DOM do Grok:** Ajustado o tratamento de nós dentro de blocos de código (`pre` e `code`) para evitar que títulos ou rótulos de interface fossem convertidos incorretamente em títulos Markdown (`#`).
    
      
    
- **Limpeza de Resíduos Visuais:** Implementada remoção automática de textos duplicados ou lixos de interface injetados pelo DOM (como botões de cópia e rótulos de linguagem flutuantes).
    
      
    

## [3.7.3] - 2026-09-17

### 🚀 Novidades e Mudanças Estruturais

- **Novo Adaptador DOM para o Grok:** Substituição completa da rota de API baseada em requisições de backend do X.com por um extrator direto via DOM (`[x.com/i/grok](https://x.com/i/grok)` e `grok.com`), eliminando erros de requisição (`404` e respostas vazias).
    
      
    
- **Política de Congelamento de Módulos:** Estabelecida a diretriz de blindagem e congelamento total dos adaptadores já estáveis (ChatGPT, Claude, Perplexity e Lumo), garantindo que atualizações em uma plataforma não afetem as demais.
    
      
    

## [3.7.2] - 2026-09-17

### 🔍 Correções Gerais e Estabilidade

- Ajustes de compatibilidade em rotinas de mapeamento de nós e tratamento de caracteres especiais.
    
      
    
- Refinamento na limpeza de textos gerados por IA para preservar blocos de código matemáticos e formatações em LaTeX (`$$` e `$`).
    
      
    

## [3.7.0 / 3.7.1] - 2026-09-17

### ⚙️ Refatoração de Módulos

- Tentativa de unificação estrutural de adaptadores de rede (com posterior revisão de escopo para adotar abordagens isoladas por plataforma).
    
      
    
- Correção de regressões no adaptador do Claude, restaurando integralmente a estabilidade operacional da versão `3.6.3`.

## [v3.6.3] - 2026-09-15

### 🚀 Novidades e Melhorias

- **Suporte Inicial ao Lumo (Proton):** Implementação bem-sucedida de um adaptador DOM dedicado para a plataforma Lumo, permitindo a exportação de conversas de forma limpa e estruturada diretamente para Markdown.
    
      
    
- **Tratamento Avançado de Anexos e Links Blob:** Adição de rotinas para capturar imagens e arquivos anexados no chat do Lumo, convertendo-os em links funcionais para visualização e integração fluida no Obsidian.
    
      
    
- **Filtragem Rigorosa de Elementos de Interface (UI):** Refinamento dos seletores de extração para ignorar ruídos textuais da página do Lumo (como botões de painel lateral, menus de navegação, avisos de termos de uso e mensagens de rodapé do sistema).
    
      
    
- **Padronização Visual por Plataforma:** Mantido o sistema de cores customizadas nos botões flutuantes de exportação de acordo com a plataforma utilizada:
    
      
    - 🟢 **ChatGPT:** Verde (`#10a37f`)
        
          
        
    - 🟠 **Claude:** Salmão (`#e07a5f`)
        
          
        
    - 🔵 **Perplexity:** Ciano (`#00bcd4`)
        
          
        
    - 🟣 **Lumo:** Roxo característico do ecossistema Proton (`#6d4aff`)
        
          
        
- **Preservação de Metadados:** Inclusão de carimbos de data/hora individuais por mensagem (`timestamp`), nome da conversa, link direto para a fonte e versão do exportador no cabeçalho do arquivo gerado (`.md`).
    
      
    
- **Sanitização Inteligente:** Conversão e limpeza de blocos de código, formatações matemáticas (LaTeX / MathJax) e remoção de artefatos indesejados da interface web de chat.



Para tornar o **Universal AI Chat Exporter** altamente eficiente e robusto — culminando nesta versão mais recente — trabalhamos em vários pilares técnicos importantes.


## Especificação para a versão 3.6.3

Aqui estão os detalhes específicos do que foi implementado e otimizado no código:

  
- **Arquitetura Híbrida (API + DOM Inteligente):**
    
      
    - Para plataformas como **ChatGPT, Claude e Perplexity**, o script foi projetado para extrair os dados diretamente de suas respectivas APIs/endpoints estruturados, garantindo uma captura extremamente rápida, completa e sem perda de dados textuais em conversas longas.
        
          
        
    - Para o **Lumo**, onde barreiras de segurança e criptografia do ecossistema Proton impedem o acesso direto via API, desenvolvemos um extrator baseado em **DOM** altamente cirúrgico.
        
          
        
- **Tratamento Avançado de Anexos e Links Blob:**
    
      
    - Implementação de uma rotina específica de varredura nos nós de cartões de arquivos (`file-card-group`). O script localiza o link temporário do tipo `blob:` diretamente na tag `img` interna e extrai o nome real do arquivo (`title` ou texto correspondente), formatando-os perfeitamente para o Obsidian no padrão `[📎 Nome do Arquivo](blob:...)`.
        
          
        
- **Filtragem Cirúrgica de Ruídos da Interface (UI):**
    
      
    - Para evitar que elementos estáticos da página poluíssem o arquivo Markdown, criamos uma camada de filtros rígidos que descarta textos irrelevantes da interface do Lumo, tais como botões de navegação (_"Mostrar barra lateral"_, _"Mostrar painel de conhecimento"_), avisos de termos de uso (_"O Lumo pode cometer erros"_), cabeçalhos de status e rodapés.
        
          
        
- **Padronização Visual Contextualizada:**
    
      
    - O botão flutuante de exportação injetado dinamicamente na página possui detecção automática de URL, aplicando uma identidade visual própria e cores dedicadas para cada IA (`#10a37f` para ChatGPT, `#e07a5f` para Claude, `#00bcd4` para Perplexity e `#6d4aff` para o roxo característico do Lumo).
        
          
        
- **Sanitização Inteligente e Conversão de Math/LaTeX:**
    
      
    - O texto bruto extraído passa por um processo de limpeza automatizado que remove artefatos incômodos (como botões _"Copy code"_ repetitivos), além de converter marcações matemáticas padrão para o formato LaTeX compatível (`$$ ... $$` para blocos e `$ ... $` para textos inline), ideal para notas científicas.
        
          
        
- **Rastreabilidade e Metadados Automatizados:**
    
      
    - Inclusão de um cabeçalho padronizado em cada arquivo gerado contendo o título da conversa, a data exata da exportação, o link direto para a fonte e a versão exata do script utilizada, garantindo total organização no seu fluxo de PKM (_Personal Knowledge Management_).
 



## [3.1.25] - 2026-09-14

- **Correção de Metadados no Painel:** O campo `@name` do Tampermonkey foi simplificado para evitar caracteres extras/versões longas no cabeçalho, garantindo a exibição limpa e correta no painel de controle do gerenciador.
    
      
    
- **Estabilidade Geral:** Consolidação final de todas as correções de formatação e exportação para ChatGPT, Claude e Perplexity.
    
      
    

## [3.1.24] - 2026-09-14

- **Adição de Metadados no Arquivo Exportado:** Implementação da linha de créditos no topo de cada arquivo `.md` gerado, exibindo explicitamente o nome do exportador e a versão exata utilizada (ex: `| **Exportador:** Universal AI Chat Exporter 3.1.24`).
    
      
    

## [3.1.23] - 2026-09-14

- **Interface Dinâmica por Plataforma:** Aprimoramento da cor e do comportamento do botão flutuante de exportação para se adaptar visualmente de forma automática à identidade visual da IA em uso:
    
      
    - Verde padrão para o ChatGPT.
        
          
        
    - Cor salmão/terracota para o Claude.
        
          
        
    - Tom ciano para o Perplexity.
        
          
        
- **Sanitização Avançada de Links:** Melhorias na limpeza automática de URLs longas, remoção de tokens sensíveis da AWS e padronização de links de referência para manter o Markdown limpo e organizado.


Aqui está o **Change Log** detalhado cobrindo a evolução do script da versão `3.1.22` até a `3.1.25`, destacando todas as melhorias e ajustes que fizemos ao longo do processo:

  
## 📜 Changelog: Universal AI Chat Exporter (v3.1.22 a v3.1.25)

### 🚀 v3.1.25

- **Correção de Metadados no Painel:** O campo `@name` do Tampermonkey foi simplificado para evitar caracteres extras/versões longas no cabeçalho, garantindo a exibição limpa e correta no painel de controle do gerenciador.
    
      
    
- **Estabilidade Geral:** Consolidação final de todas as correções de formatação e exportação para ChatGPT, Claude e Perplexity.
    
      
    

### 🏷️ v3.1.24

- **Adição de Metadados no Arquivo Exportado:** Implementação da linha de créditos no topo de cada arquivo `.md` gerado, exibindo explicitamente o nome do exportador e a versão exata utilizada (ex: `| **Exportador:** Universal AI Chat Exporter 3.1.24`).
    
      
    

### 🎨 v3.1.23

- **Interface Dinâmica por Plataforma:** Aprimoramento da cor e do comportamento do botão flutuante de exportação para se adaptar visualmente de forma automática à identidade visual da IA em uso:
    
      
    - Verde padrão para o ChatGPT.
        
          
        
    - Cor salmão/terracota para o Claude.
        
          
        
    - Tom ciano para o Perplexity.
        
          
        
- **Sanitização Avançada de Links:** Melhorias na limpeza automática de URLs longas, remoção de tokens sensíveis da AWS e padronização de links de referência para manter o Markdown limpo e organizado.
    
      
    

### ⚙️ v3.1.22

- **Ajustes de Estabilidade e Compatibilidade:** Refinamento nas funções de captura e extração de mensagens em árvore (especialmente para o Perplexity e Claude), garantindo que blocos de código, fórmulas matemáticas (`LaTeX`) e anexos fossem convertidos sem quebrar a estrutura do arquivo Markdown.

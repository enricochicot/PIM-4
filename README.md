# ReciclaPET: Plataforma de Impacto Comunitário (PIM-4)

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen)
![Licença](https://img.shields.io/badge/Licença-MIT-blue)
![Tecnologia](https://img.shields.io/badge/Stack-HTML%20%2B%20CSS%20%2B%20JS-orange)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)
![Iniciativa](https://img.shields.io/badge/Iniciativa-FEMSA-red)

## Contexto do Projeto (PIM-4)

Desenvolvido como parte do **Projeto Integrado Multidisciplinar IV (PIM-4)**. O ReciclaPET é uma aplicação web voltada à **gamificação da reciclagem de embalagens PET**, criada como iniciativa de impacto ambiental vinculada à FEMSA.

A plataforma incentiva os usuários a registrarem suas coletas de embalagens plásticas, transformando o ato de reciclar em uma experiência interativa com pontos, níveis e recompensas reais.

### Público-Alvo

| Perfil | Descrição |
|---|---|
| Consumidores FEMSA | Usuários que desejam reciclar embalagens e acumular pontos |
| Comunidade local | Participantes de ecopontos, escolas e pontos parceiros |
| Colaboradores | Pessoas engajadas com metas de sustentabilidade corporativa |

---

## Funcionalidades da Plataforma

A aplicação foi projetada para cobrir todo o ciclo de engajamento do usuário com a reciclagem:

- **Registro de Coleta:** Formulário com nome, quantidade, tipo de embalagem e ponto de coleta, com preview em tempo real dos pontos e kg a serem ganhos.
- **Sistema de Pontuação:** Cada tipo de embalagem vale uma quantidade diferente de pontos, proporcional ao seu peso.
- **Painel do Usuário:** Anel de progresso SVG animado, barras de desempenho e exibição do nível atual.
- **Gamificação por Níveis:** 6 níveis progressivos — do iniciante ao campeão ambiental.
- **Histórico de Registros:** Últimas 50 coletas armazenadas localmente, com data, local e pontos conquistados.
- **Calculadora de Impacto Ambiental:** Converte kg de plástico reciclado em métricas reais (oceano protegido, energia, água e árvores equivalentes).
- **Catálogo de Recompensas:** 6 prêmios resgatáveis com pontos, de descontos em bebidas a experiências ecológicas.
- **Compartilhamento Social:** Compartilhe seu impacto no WhatsApp, X (Twitter) e LinkedIn ou copie o texto.
- **Estatísticas Globais:** Contador animado da comunidade (participantes, embalagens e kg totais).

---

## Tecnologias Utilizadas

| Categoria | Tecnologia | Detalhe |
|---|---|---|
| Estrutura | HTML5 | Marcação semântica, SVG inline, Web Storage API |
| Estilo | CSS3 | Variáveis customizadas, Grid, animações, 3 breakpoints responsivos |
| Lógica | JavaScript (ES6+) | Vanilla JS, LocalStorage, requestAnimationFrame, Clipboard API |
| Tipografia | Google Fonts | Outfit (títulos) + Inter (corpo) |
| Deploy | Vercel | Rewrite de `/` → `/home.html` via `vercel.json` |
| Controle de versão | Git + GitHub | Branch `main`, integração contínua com Vercel |

---

## 📁 Estrutura do Projeto

O projeto adota uma arquitetura de separação clara de responsabilidades em três arquivos:

```
PIM 4/
├── home.html       # Shell da aplicação — estrutura HTML e referências
├── style.css       # Toda a estilização, variáveis CSS e responsividade
├── func.js         # Toda a lógica JavaScript (estado, UI, gamificação)
└── vercel.json     # Configuração de deploy (rewrite de rotas)
```

---

## Mecânicas de Gamificação

### Sistema de Pontos por Tipo de Embalagem

| Tipo | Capacidade | Peso Médio | Pontos |
|---|---|---|---|
| PET Pequena | Até 600ml | 25g | 5 pts |
| PET Média | 1L | 35g | 8 pts |
| PET Grande | 2L | 55g | 12 pts |
| Galão | 5L+ | 130g | 25 pts |

### Níveis de Progressão

| Nível | Nome | Pontos necessários |
|---|---|---|
| 1 | Plantinha | 0 pts |
| 2 | Eco Amigo | 100 pts |
| 3 | Reciclador | 300 pts |
| 4 | Guardião | 700 pts |
| 5 | Eco Herói | 1.500 pts |
| 6 | Lenda Verde | 3.000 pts |

### Cálculo de Impacto Ambiental

| Métrica | Fórmula |
|---|---|
| m² de oceano protegidos | `embalagens × 0,5` |
| kWh de energia economizada | `kg_plástico × 5,8` |
| Litros de água poupados | `kg_plástico × 17` |
| Equivalente em árvores plantadas | `kg_plástico ÷ 21` |

### Catálogo de Recompensas

| Recompensa | Custo |
|---|---|
| 🥤 5% OFF em Bebidas FEMSA | 100 pts |
| 👕 Camiseta Eco Edição Limitada | 500 pts |
| 🛒 10% OFF em Supermercados Parceiros | 750 pts |
| 🎒 Kit Sustentável (garrafa + sacola) | 1.200 pts |
| 🏕️ Vaga em Evento de Voluntariado | 2.000 pts |
| ✈️ Sorteio para Retiro Ecológico | 5.000 pts |

---

## Como Executar Localmente

Não há dependências, build ou instalação necessária. O projeto roda diretamente no navegador.

### Pré-requisitos

- Qualquer navegador moderno (Chrome, Edge, Firefox, Safari)
- Um servidor local simples (opcional, mas recomendado para evitar restrições de CORS)

### Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/enricochicot/PIM-4.git
   cd PIM-4
   ```

2. Abra diretamente no navegador:
   ```bash
   open home.html
   ```
   Ou utilize a extensão **Live Server** no VS Code e acesse `http://127.0.0.1:5500/home.html`.

3. Acesse a versão em produção pelo Vercel:
   > [https://pim-4-enricochicot.vercel.app](https://pim-4-enricochicot.vercel.app)

### Observações

- Todos os dados do usuário são armazenados **localmente** no `localStorage` sob a chave `reciclapetData_v2`.
- Não há backend, banco de dados ou autenticação — a aplicação é 100% client-side.
- As estatísticas globais da comunidade são simuladas com seed aleatório no primeiro acesso.

---

## Contribuição

Contribuições são bem-vindas! Por favor, abra uma *Issue* para discutir a funcionalidade que deseja adicionar ou o bug que encontrou, e em seguida submeta um *Pull Request* na branch `main`.

---

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

# Gerador de Cards

Aplicação web para cadastrar produtos e campanhas de um açougue e gerar **cards de ofertas** prontos para exportar em PNG ou JPG.

## Como executar

```bash
npm install
npm run dev
```

Abra o endereço indicado no terminal (padrão: http://localhost:5173).

## Comandos disponíveis

| Comando                | Descrição                                      |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento (Vite).   |
| `npm run build`        | Compila (tsc) e gera a versão de produção.     |
| `npm run preview`      | Pré-visualiza a versão de produção localmente. |
| `npm run lint`         | Executa o oxlint.                              |
| `npm run test`         | Executa os testes com o Vitest.                |

## Funcionalidades

- **Produtos**: cadastro com nome, preço, unidade, categoria, ativação e imagem (carregada do arquivo ou gerada uma imagem de teste).
- **Campanhas**: título e período (data inicial/final), com vínculo dos produtos exibidos.
- **Card**: seleção de campanha e de até `MAX_CARD_PRODUCTS` produtos, com validação dos dados antes da exportação.
- **Personalização**: editor de tema com cores, texto do rodapé e logo do card.
- **Exportação**: download do card em PNG e JPG.

Os dados ficam salvos no `localStorage` do navegador (não há back-end).

## Estrutura

```
src/
├─ data/        Repositórios e persistência (localStorage)
├─ domain/      Tipos, validação e regras do card
├─ export/      Exportação para PNG/JPG
├─ generator/   Renderização do card em canvas e tema
├─ ui/          Componentes React (formulários, lista, editor de tema)
├─ utils/       Funções utilitárias (formatação, imagem)
```

## Tecnologias

React + TypeScript + Vite, com Poppins/Poppins e oxlint + Vitest.

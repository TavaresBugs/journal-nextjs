# Design System - Trading Journal Pro

## 1. Visão Geral

### Propósito

Este documento serve como a fonte única da verdade para os componentes de UI do Trading Journal Pro. O objetivo é garantir consistência visual, facilitar o onboarding de novos desenvolvedores e acelerar o desenvolvimento através da reutilização de componentes padronizados.

### Stack Tecnológica

- **Framework**: Next.js 14+
- **Estilização**: Tailwind CSS v3
- **Base de Componentes**: shadcn/ui (customizado)
- **Ícones**: Lucide React / MDI (via SVG)

### Filosofia

- **Base Components**: Sempre prefira usar componentes de `src/components/ui`.
- **Variantes Controladas**: Use `variant` e `size` props em vez de classes arbitrárias.
- **Micro-interações**: Interfaces devem parecer "vivas" (hover states, transitions).
- **Dark Mode First**: O design é otimizado primeiramente para temas escuros/neon.

---

## 2. Button Component

**Path**: `src/components/ui/Button.tsx`

O componente fundamental de ação. Nunca use a tag `<button>` nativa diretamente.

### Variantes

| Variant         | Uso Recomendado                                                        |
| :-------------- | :--------------------------------------------------------------------- |
| `primary`       | Ação principal da tela (Salvar, Criar, Confirmar). Estilo Dark/Cyan.   |
| `secondary`     | Ações de apoio, menos destaque. Cinza sólido.                          |
| `outline`       | Alternativa leve ao secondary. Borda cinza, fundo transparente.        |
| `ghost`         | Botões "invisíveis" até o hover. Use para ações em listas ou toolbars. |
| `danger`        | Ações destrutivas (Excluir, Remover). Estilo Neon Red.                 |
| `success`       | Feedback positivo ou conclusão. Estilo Neon Green.                     |
| `zorin-primary` | Ação de destaque máximo (CTA). Verde neon sólido.                      |

### Props Principais

- `variant`: Vide tabela acima.
- `size`: `sm`, `md` (padrão), `lg`, `icon`.
- `isLoading`: Mostra spinner e desabilita.
- `leftIcon` / `rightIcon`: Adiciona ícones adjacentes.

### Exemplo de Uso

```tsx
import { Button } from '@/components/ui';

// Primário
<Button onClick={handleSave}>Salvar Alterações</Button>

// Destrutivo com Ícone e Loading
<Button
  variant="danger"
  isLoading={isDeleting}
  leftIcon={<TrashIcon />}
>
  Excluir
</Button>
```

---

## 3. IconActionButton Component (NOVO)

**Path**: `src/components/ui/IconActionButton.tsx`

Botões puramente icônicos, padronizados para ações comuns em cards e tabelas.

### Variantes

| Variant  | Ícone        | Cor Hover | Uso                       |
| :------- | :----------- | :-------- | :------------------------ |
| `view`   | Olho         | Cyan      | Visualizar detalhes       |
| `edit`   | Lápis        | Amber     | Abrir modo de edição      |
| `delete` | Lixeira      | Red       | Excluir item              |
| `share`  | Compartilhar | Blue      | Compartilhar link/recurso |
| `back`   | Chevron Esq  | Blue      | Voltar página             |
| `next`   | Chevron Dir  | Blue      | Avançar (ex: carousel)    |
| `star`   | Estrela      | Amber     | Favoritar                 |

### Exemplo de Uso

```tsx
import { IconActionButton } from "@/components/ui";

// Em um Header de Card
<div className="flex gap-2">
  <IconActionButton variant="view" onClick={onView} />
  <IconActionButton variant="edit" onClick={onEdit} />
  <IconActionButton variant="delete" onClick={onDelete} />
</div>;
```

---

## 4. Modal System

**Path Base**: `src/components/ui/Modal.tsx`

### Regra de Ouro

**NUNCA** crie um modal usando `div` com `fixed/absolute` manualmente. Sempre use o componente `Modal`.

### Componentes Chave

1.  **Modal Base**: Wrapper genérico. Suporta `title`, `isOpen`, `onClose`.
2.  **ModalFooterActions**: Componente padronizado para ações de rodapé.
3.  **ImagePreviewLightbox**: Modal especializado sem chrome.

### Componente `ModalFooterActions`

Padroniza os botões de ação do modal.

```tsx
// Imports
import { ModalFooterActions } from '@/components/ui';

// Exemplo Edição (Salvar/Cancelar)
<ModalFooterActions
  mode="save-cancel"
  onPrimary={handleSave}
  onSecondary={handleClose}
  isLoading={isSaving}
/>

// Exemplo Criação (Criar/Fechar)
<ModalFooterActions
  mode="create-close"
  primaryLabel="Enviar Convite"
  onPrimary={handleSend}
  onSecondary={handleClose}
/>

// Exemplo Leitura (Fechar apenas)
<ModalFooterActions
  mode="close-only"
  onPrimary={handleClose}
/>
```

### Padrões de Footer Suportados (Modes)

| Mode           | Botão Primário (Direita)      | Botão Secundário (Esquerda) | Uso Típico                  |
| :------------- | :---------------------------- | :-------------------------- | :-------------------------- |
| `save-cancel`  | "Salvar" (`gradient-success`) | "Cancelar" (`ghost`)        | Edição de formulários.      |
| `create-close` | "Criar" (`gradient-success`)  | "Fechar" (`ghost`)          | Criação de novos registros. |
| `close-only`   | "Fechar" (`ghost`)            | (Nenhum)                    | Modais informativos.        |
| `destructive`  | "Excluir" (`danger`)          | "Cancelar" (`ghost`)        | Confirmações de exclusão.   |

### Exemplo de Implementação Completa

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Título do Modal">
  <div className="space-y-4">
    <p>Conteúdo do modal...</p>

    <ModalFooterActions mode="save-cancel" onPrimary={onConfirm} onSecondary={onClose} />
  </div>
</Modal>
```

---

## 5. SegmentedToggle

**Path**: `src/components/ui/SegmentedToggle.tsx`

Componente de alternância (Tabs) moderno e responsivo.

### Características

- **Desktop**: Slider horizontal suave.
- **Mobile**: Grid de botões para melhor toque.
- **Visual**: Estilo Neon/Cyan integrado.

### Exemplo de Uso

```tsx
const [view, setView] = useState("grid");

<SegmentedToggle
  value={view}
  onChange={setView}
  options={[
    { value: "grid", label: "Grade" },
    { value: "list", label: "Lista" },
  ]}
/>;
```

---

## 6. Inputs & Forms

**Path**: `src/components/ui/Input.tsx` (e derivados)

- **Input**: Campo de texto padrão com suporte a ícones e erros.
- **DatePickerInput**: Selector de data single.
- **DateTimePicker**: Selector complexo de data e hora.
- **Textarea**: Campo de texto multiline.
- **Select**: Dropdown customizado (consolidado em 20/12/2025).

### Select Component (Consolidado)

**Path**: `src/components/ui/Select.tsx`

O componente Select foi consolidado unificando `SelectCustom` e `SelectRadix`. Usa portal para renderização, evitando problemas de overflow.

#### Importação

```tsx
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui";
```

#### Uso Básico

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

#### Com Grupos

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Escolha" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Categoria A</SelectLabel>
      <SelectItem value="a1">Item A1</SelectItem>
      <SelectItem value="a2">Item A2</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Categoria B</SelectLabel>
      <SelectItem value="b1">Item B1</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

#### Props do Select

| Prop            | Tipo                      | Descrição                    |
| --------------- | ------------------------- | ---------------------------- |
| `value`         | `string`                  | Valor selecionado            |
| `onValueChange` | `(value: string) => void` | Callback de mudança          |
| `open`          | `boolean`                 | Controle externo de abertura |
| `onOpenChange`  | `(open: boolean) => void` | Callback de abertura         |

#### Características

- ✅ **Portal**: Renderiza fora do container pai (evita overflow)
- ✅ **Click outside**: Fecha ao clicar fora
- ✅ **Keyboard**: ESC para fechar
- ✅ **Checkmark**: Indicador visual do item selecionado
- ✅ **Dark mode**: Otimizado para temas escuros

### Padrão de Formulário (React Hook Form ou State)

```tsx
<div>
  <label className="text-sm font-medium text-gray-300">Email</label>
  <Input placeholder="exemplo@email.com" error={errors.email?.message} {...register("email")} />
</div>
```

---

## 7. Cards & Containers

### Card Base

**Path**: `src/components/ui/Card.tsx`

Container padrão opaco/semi-transparente para dashboard.

### GlassCard

**Path**: `src/components/ui/GlassCard.tsx`

Container com efeito de vidro fosco (backdrop-blur) para áreas de destaque ou sobre overlays.

### AssetBadge

**Path**: `src/components/ui/AssetBadge.tsx`

Tag visual para ativos financeiros (EURUSD, BTC, etc). Imita estilo do TradingView.

---

## 8. Regras de Ouro 🏆

1.  **❌ NUNCA usar `<button>` nativo**: Sempre use `Button` ou `IconActionButton`.
2.  **❌ NUNCA criar modal com `div fixed`**: Use `Modal`.
3.  **✅ SEMPRE partir de componente base**: Se precisar de um card, comece com `Card`.
4.  **✅ Customização via variants**: Evite encher de tailwind classes no uso; prefira criar uma nova variante no componente base se o estilo for reutilizável.
5.  **✅ Dark Mode First**: Teste sempre como o componente reage sobre fundos escuros (`gray-900`, `black`).

# 🎨 Design System - Trading Journal

Este documento descreve os componentes de UI padronizados do projeto.

## 📦 Componentes Base

Todos os componentes estão em `src/components/ui/` e são exportados via `@/components/ui`.

---

## 🔽 Select

Componente de seleção customizado com suporte a portal (renderiza fora do container pai para evitar overflow issues).

### Importação

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

### Uso Básico

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
    <SelectItem value="option3">Opção 3</SelectItem>
  </SelectContent>
</Select>
```

### Com Grupos

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Escolha" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Frutas</SelectLabel>
      <SelectItem value="apple">Maçã</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Legumes</SelectLabel>
      <SelectItem value="carrot">Cenoura</SelectItem>
      <SelectItem value="potato">Batata</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Props

| Componente      | Prop            | Tipo                         | Descrição                             |
| --------------- | --------------- | ---------------------------- | ------------------------------------- |
| `Select`        | `value`         | `string`                     | Valor selecionado                     |
| `Select`        | `onValueChange` | `(value: string) => void`    | Callback de mudança                   |
| `Select`        | `open`          | `boolean`                    | Controle externo de abertura          |
| `Select`        | `onOpenChange`  | `(open: boolean) => void`    | Callback de abertura                  |
| `SelectTrigger` | `className`     | `string`                     | Classes CSS adicionais                |
| `SelectValue`   | `placeholder`   | `string`                     | Texto quando nenhum valor selecionado |
| `SelectItem`    | `value`         | `string`                     | Valor do item                         |
| `SelectContent` | `position`      | `"popper" \| "item-aligned"` | Posicionamento (ignorado)             |

### Características

- ✅ **Portal**: Renderiza fora do container pai
- ✅ **Posicionamento automático**: Calcula posição baseada no trigger
- ✅ **Click outside**: Fecha ao clicar fora
- ✅ **Keyboard**: Escape para fechar
- ✅ **Accessibility**: Checkmark no item selecionado
- ✅ **Dark mode**: Estilizado para tema escuro

---

## 🔘 Button

Botão com variantes e tamanhos.

### Importação

```tsx
import { Button } from "@/components/ui";
```

### Variantes

```tsx
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Perigo</Button>
```

### Tamanhos

```tsx
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>
```

---

## 🗓️ DatePickerInput

Input de data com calendário popup.

### Importação

```tsx
import { DatePickerInput } from "@/components/ui";
```

### Uso

```tsx
<DatePickerInput
  label="Data de Entrada"
  value={date} // formato: "yyyy-MM-dd"
  onChange={setDate}
  required
  openDirection="bottom"
/>
```

---

## 📅 WeekPicker

Seletor de semana com visualização de calendário.

### Importação

```tsx
import { WeekPicker } from "@/components/ui";
```

### Uso

```tsx
<WeekPicker
  selectedWeek={week} // formato: "2024-W50"
  onWeekChange={setWeek}
/>
```

---

## 🎚️ SegmentedToggle

Toggle segmentado para navegação ou filtros.

### Importação

```tsx
import { SegmentedToggle } from "@/components/ui";
```

### Uso

```tsx
const options = [
  { value: "daily", label: "📅 Diário" },
  { value: "weekly", label: "📊 Semanal" },
];

<SegmentedToggle
  value={mode}
  onChange={setMode}
  options={options}
  id="review-toggle"
  aria-label="Tipo de review"
/>;
```

---

## 🪟 Modal

Modal com overlay e animações.

### Importação

```tsx
import { Modal, ModalFooterActions } from "@/components/ui";
```

### Uso

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Título do Modal" maxWidth="2xl">
  <p>Conteúdo do modal</p>

  <ModalFooterActions
    onCancel={onClose}
    onConfirm={handleSubmit}
    confirmLabel="Salvar"
    isLoading={isLoading}
  />
</Modal>
```

---

## 🎨 GlassCard

Card com efeito glassmorphism.

### Importação

```tsx
import { GlassCard } from "@/components/ui";
```

### Uso

```tsx
<GlassCard className="p-6">Conteúdo com efeito glass</GlassCard>
```

---

## 📝 Padrões de Código

### Sempre usar index centralizado

```tsx
// ✅ Correto
import { Button, Modal, Select } from "@/components/ui";

// ❌ Evitar
import { Button } from "@/components/ui/Button";
```

### Classes Tailwind

O projeto usa Tailwind CSS com tema escuro. Classes comuns:

- Backgrounds: `bg-gray-800`, `bg-gray-900`, `bg-[#1a2332]`
- Borders: `border-gray-700`, `border-white/10`
- Text: `text-gray-100`, `text-gray-400`, `text-cyan-400`
- Accent: `cyan-500`, `cyan-400` (principal)

---

## 🔄 Histórico de Mudanças

| Data       | Mudança                                                   |
| ---------- | --------------------------------------------------------- |
| 20/12/2025 | Consolidação Select (SelectCustom + SelectRadix → Select) |
| 20/12/2025 | Criação inicial do Design System                          |

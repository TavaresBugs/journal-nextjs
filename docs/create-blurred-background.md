# Criar Imagem de Background Pré-Blurred

## Objetivo

Criar versão blurred da imagem de background para manter efeito visual bonito SEM custo de GPU.

## Opção 1: ImageMagick (Local)

```bash
# Instalar ImageMagick (se necessário)
sudo apt install imagemagick-6.q16

# Criar versão blurred com escurecimento
convert public/background-landscape.webp \
  -blur 0x4 \
  -brightness-contrast -60x0 \
  public/background-landscape-blurred.webp
```

## Opção 2: GIMP (GUI)

1. Abrir `public/background-landscape.webp` no GIMP
2. **Filters → Blur → Gaussian Blur**
   - Radius: 4px horizontal e vertical
3. **Colors → Brightness-Contrast**
   - Brightness: -60
4. **File → Export As** → `background-landscape-blurred.webp`
   - Quality: 95%

## Opção 3: Photoshop

1. Abrir imagem
2. **Filter → Blur → Gaussian Blur** (4px)
3. **Image → Adjustments → Brightness/Contrast**
   - Brightness: -60
4. **Save for Web** → WebP, Quality 95%

## Opção 4: Online (Photopea - photopea.com)

1. Upload `background-landscape.webp`
2. Filter → Blur → Gaussian Blur (4px)
3. Image → Adjustments → Brightness/Contrast (-60)
4. File → Export As → WebP

## Resultado Esperado

- **Tamanho**: ~260KB (similar ao original WebP)
- **Visual**: Blur effect + darkened (brightness -60%)
- **Performance**: ZERO GPU cost (no runtime filters)

## Verificação

Após criar a imagem, certifique-se que:

1. Arquivo `public/background-landscape-blurred.webp` existe
2. CSS já está atualizado para usar essa imagem
3. `npm run dev` mostra background corretamente

## CSS Atual (Já Atualizado)

```css
background: url("/background-landscape-blurred.webp") no-repeat center center fixed;
/* NO FILTERS - blur and darkness baked into image */
```

✅ **Melhor dos dois mundos**: Visual bonito + Performance máxima!

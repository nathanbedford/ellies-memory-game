# Adding a New Image Deck

This document describes the complete process for adding a new image-based card deck to the memory game.

## Prerequisites

- Place all deck images in `public/deck-images/<deck-name>/`
- Images should be `.jpg` format with kebab-case names (e.g., `santa-claus.jpg`)
- Each deck should have 20 images

## Files to Modify

### 1. `src/types.ts`

Add the new deck ID to the `CardPack` type union:

```typescript
export type CardPack = '...' | 'thanksgiving' | 'christmas';
```

### 2. `src/data/cardDecks.ts`

**A. Add helper function** (after existing helper functions, around line 47):

```typescript
const getChristmasImageUrl = (itemId: string): string => {
  return `/deck-images/christmas/${itemId}.jpg`;
};
```

**B. Add deck definition** to the `CARD_DECKS` array:

```typescript
{
  id: 'christmas',
  name: 'Christmas',
  emoji: '🎄',
  cards: [
    {
      id: 'image-name',  // matches filename without .jpg
      emoji: '🎄',
      gradient: 'from-red-500 to-green-600',
      imageUrl: getChristmasImageUrl('image-name')
    },
    // ... 20 cards total
  ]
}
```

### 3. `src/components/CardPackModal.tsx` (IMPORTANT - DON'T FORGET!)

This file has hardcoded lists that control which decks appear in the UI.

**A. Add to `picturePackIds`** (around line 24):

```typescript
const picturePackIds = ['animals-real', ..., 'thanksgiving', 'christmas'];
```

**B. Add to `picturePacks` filter** (around line 43):

```typescript
const picturePacks = cardPacks.filter(pack =>
  ['animals-real', ..., 'thanksgiving', 'christmas'].includes(pack.id)
);
```

**C. Add preview function** (after `getThanksgivingPreview`):

```typescript
const getChristmasPreview = () => {
  const deck = CARD_DECKS.find(d => d.id === 'christmas');
  if (!deck) return [];
  const previewIds = ['christmas-tree', 'santa-claus', 'reindeer', 'present-gift-box'];
  return deck.cards.filter(card => previewIds.includes(card.id)).slice(0, 4);
};
```

**D. Add preview variable** (after `thanksgivingPreview`):

```typescript
const christmasPreview = getChristmasPreview();
```

**E. Add preview rendering** (after thanksgiving's rendering block, before the fallback `:`):

```tsx
) : pack.id === 'christmas' ? (
  <div className="mb-4">
    <div className="w-full h-40 rounded-lg bg-gradient-to-br from-red-500 to-green-600 grid grid-cols-2 grid-rows-2 gap-1 p-1">
      {christmasPreview.map((card) => (
        card.imageUrl && (
          <div key={card.id} className="w-full h-full flex items-center justify-center bg-white bg-opacity-20 rounded overflow-hidden">
            <img
              src={card.imageUrl}
              alt={card.id}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )
      ))}
    </div>
  </div>
) : (
```

## Checklist

- [ ] Images placed in `public/deck-images/<deck-name>/`
- [ ] `src/types.ts` - Added to `CardPack` type
- [ ] `src/data/cardDecks.ts` - Added helper function
- [ ] `src/data/cardDecks.ts` - Added deck to `CARD_DECKS` array
- [ ] `src/components/CardPackModal.tsx` - Added to `picturePackIds`
- [ ] `src/components/CardPackModal.tsx` - Added to `picturePacks` filter
- [ ] `src/components/CardPackModal.tsx` - Added preview function
- [ ] `src/components/CardPackModal.tsx` - Added preview variable
- [ ] `src/components/CardPackModal.tsx` - Added preview rendering block
- [ ] Run `npx tsc --noEmit` to verify no type errors

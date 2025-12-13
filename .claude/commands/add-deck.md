# Add New Card Deck

Add a new deck of card images to the matching game.

## Arguments
- `$ARGUMENTS` - Path to the image directory (e.g., `public/deck-images/dinos/`)

## Instructions

You are adding a new card deck to Matchimus. Follow these steps:

### Step 1: Discover Images

List all image files in the provided directory:
```
ls $ARGUMENTS
```

Extract:
- **Deck ID**: The folder name (e.g., `dinos` from `public/deck-images/dinos/`)
- **Card IDs**: Filenames without extensions (e.g., `tyrannosaurus-rex` from `tyrannosaurus-rex.jpg`)

Count the images - there should be exactly 20 for consistency with other decks.

### Step 2: Ask for Deck Name

Use AskUserQuestion to confirm the deck display name:
- Infer a suggested name by title-casing the folder name (e.g., "dinos" -> "Dinosaurs")
- Provide the suggested name as an option
- Allow the user to type a custom name via "Other"

### Step 3: Make Code Changes

Edit these three files:

#### 3a. `src/types.ts`

Find the `CardPack` type union and add the new deck ID at the end (before the semicolon):
```typescript
  | "{deck-id}"
```

#### 3b. `src/data/cardDecks.ts`

1. **Add helper function** after the existing helper functions (around line 52):
```typescript
const get{PascalCaseDeckId}ImageUrl = (itemId: string): string => {
  return `/deck-images/{deck-id}/${itemId}.jpg`;
};
```

2. **Add deck entry** to the CARD_DECKS array (at the end, before the closing bracket):
```typescript
  {
    id: '{deck-id}',
    name: '{Deck Name from user}',
    emoji: '',
    cards: [
      // For each image file, create an entry:
      { id: '{card-id}', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: get{PascalCaseDeckId}ImageUrl('{card-id}') },
      // ... repeat for all cards
    ]
  }
```

#### 3c. `src/components/CardPackModal.tsx`

1. **Add to picturePackIds array** (line 24) - add the deck ID to the array:
```typescript
const picturePackIds = ['animals-real', 'ocean-real', 'emotions-real', 'insects-real', 'jungle-animals-real', 'plush-cute-animals-real', 'construction-real', 'animals-from-china-real', 'thanksgiving', 'christmas', '{deck-id}'];
```

2. **Add to picturePacks filter** (line 43) - add the deck ID to the filter array:
```typescript
['animals-real', 'ocean-real', 'emotions-real', 'insects-real', 'jungle-animals-real', 'plush-cute-animals-real', 'construction-real', 'animals-from-china-real', 'thanksgiving', 'christmas', '{deck-id}'].includes(pack.id)
```

3. **Add preview function** after the existing preview functions (after `getChristmasPreview`):
```typescript
  // Get preview images for {deck-id} deck
  const get{PascalCaseDeckId}Preview = () => {
    const deck = CARD_DECKS.find(d => d.id === '{deck-id}');
    if (!deck) return [];
    // First 4 cards for preview
    return deck.cards.slice(0, 4);
  };
```

4. **Add preview variable** after the other preview variables (after `christmasPreview`):
```typescript
  const {camelCaseDeckId}Preview = get{PascalCaseDeckId}Preview();
```

5. **Add JSX preview block** in the conditional chain (before the final `else` block that handles emoji packs, after the christmas block):
```tsx
          ) : pack.id === '{deck-id}' ? (
            <div className="mb-4">
              <div className="w-full h-40 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {{camelCaseDeckId}Preview.map((card) => (
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
```

### Step 4: Report Success

After making all changes, report:
- Deck ID added
- Display name
- Number of cards added
- Files modified

## Notes

- Cards are sorted alphabetically by ID, and the first 4 are used for the preview thumbnail
- All cards use a neutral slate gradient since images are the focus
- The emoji field is empty (no longer displayed in UI)

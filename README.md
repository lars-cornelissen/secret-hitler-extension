# Secret Hitler Auto End Term

A Chrome (Manifest V3) extension that automatically clicks the **"END TERM"** button on [secret-hitler.online](https://secret-hitler.online) as soon as it becomes active (i.e. when it's your turn as president and the game is in `POST_LEGISLATIVE` state).

## How it works

The game is open source ([ShrimpCryptid/Secret-Hitler-Online](https://github.com/ShrimpCryptid/Secret-Hitler-Online)). Its `App.tsx` renders the button like this:

```tsx
<button
  disabled={
    gameState.state !== "POST_LEGISLATIVE" ||
    user !== gameState.president
  }
  onClick={() => sendWSCommand({ command: "end-term" })}
>
  END TERM
</button>
```

So the button is **always present** with the literal text `END TERM`, and is *active* exactly when its `disabled` attribute is `false`.

A content script (`content.js`) therefore:

1. Finds the button by matching text `END TERM` (normalized).
2. Clicks it **only when `disabled === false`**.
3. Watches DOM/attribute mutations with a `MutationObserver` (React flips `disabled` when game state updates), plus a 500 ms fallback interval.

A popup lets you toggle the feature on/off (state stored via `chrome.storage.sync`).

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (toggle, top right).
3. Click **Load unpacked**.
4. Select this folder (`secret-hitler-extension`).
5. Join a game on <https://secret-hitler.online>. When it's your presidential term and your turn ends, the "END TERM" button is clicked automatically.

## Notes

- Clicking the button is equivalent to sending the `end-term` WebSocket command, but the button click goes through React's normal handler path, so it's the safest place to hook in.
- Scoped to `https://secret-hitler.online/*` only, so the extension is inactive on all other sites.
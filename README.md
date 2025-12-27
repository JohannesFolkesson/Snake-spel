# 🐍 Snake Spel

Ett klassiskt Snake-spel byggt med HTML, CSS och JavaScript. Spela själv eller utmana en vän i multiplayer-läge!

## 🎮 Spela Online

Spelet är tillgängligt gratis via GitHub Pages:

**[Klicka här för att spela!](https://johannesfolkesson.github.io/Snake-spel/)**

## 🕹️ Funktioner

- **Enspelare-läge**: Spela klassiskt Snake själv
- **Multiplayer-läge**: Spela mot en vän online
- **Ljudeffekter**: Njut av ljud när du spelar
- **Responsiv design**: Fungerar på olika skärmstorlekar

## 🎯 Hur man spelar

1. Klicka på "Start Game" för att börja
2. Använd piltangenterna för att styra ormen
3. Ät maten för att växa och få poäng
4. Undvik att krocka med väggarna eller dig själv!

### Multiplayer

1. En spelare klickar på "Host Session" och får ett Session ID
2. Den andra spelaren skriver in Session ID och klickar "Join"
3. Spelare 1 använder piltangenterna
4. Spelare 2 använder WASD-tangenterna

## 🛠️ Lokal utveckling

För att köra spelet lokalt:

1. Klona repositoryt:
   ```bash
   git clone https://github.com/JohannesFolkesson/Snake-spel.git
   ```

2. Öppna `index.html` i din webbläsare

Alternativt, använd en lokal server:
```bash
python -m http.server 8000
# eller
npx serve
```

## 📁 Projektstruktur

- `index.html` - Huvudfilen för spelet
- `app.js` - Huvudapplikationslogik
- `game.js` - Spellogik
- `snake.js` - Orm-logik
- `board.js` - Spelplan-logik
- `style.css` - Styling
- `sounds.js` - Ljudhantering
- `mpapi.js` / `MultiplayerApi.js` - Multiplayer-funktionalitet
- `assets/` - Ljudfiler och andra tillgångar

## 📄 Licens

Detta projekt är öppen källkod och tillgängligt för alla att använda och modifiera.

## 🚀 GitHub Pages

Detta projekt använder GitHub Actions för att automatiskt distribuera till GitHub Pages. Vid varje push till main/master-grenen uppdateras den hostade versionen automatiskt.

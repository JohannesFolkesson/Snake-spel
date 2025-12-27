# Instruktioner för att aktivera GitHub Pages

För att din gratis sida ska fungera behöver du aktivera GitHub Pages i ditt repository:

## Steg-för-steg guide:

1. **Gå till Repository Settings**
   - Öppna ditt repository på GitHub: https://github.com/JohannesFolkesson/Snake-spel
   - Klicka på "Settings" (Inställningar) i menyn högst upp

2. **Hitta Pages-inställningar**
   - I vänstermenyn, scrolla ner och klicka på "Pages" under "Code and automation"

3. **Konfigurera Source**
   - Under "Build and deployment"
   - Välj "Source": **GitHub Actions** (inte "Deploy from a branch")

4. **Spara och vänta**
   - Inställningarna sparas automatiskt
   - Gå till "Actions"-fliken i ditt repository
   - Du kommer att se att workflow:en "Deploy to GitHub Pages" körs
   - Vänta tills den är klar (grön bock)

5. **Besök din sida!**
   - När workflow:en är klar, gå tillbaka till Settings → Pages
   - Högst upp kommer du att se länken till din sida: 
   - **https://johannesfolkesson.github.io/Snake-spel/**

## Automatisk uppdatering

När GitHub Pages är aktiverat kommer din sida att uppdateras automatiskt varje gång du:
- Pushar ändringar till `main` eller `master` branch
- Manuellt kör workflow:en från Actions-fliken

## Felsökning

**Om sidan inte fungerar:**
- Kontrollera att GitHub Pages är aktiverat med "GitHub Actions" som källa
- Kolla att workflow:en i Actions-fliken har körts utan fel
- Det kan ta någon minut första gången innan sidan är tillgänglig

**Om spelet inte laddar:**
- Kontrollera att `index.html` finns i repository:ets rot
- Se till att alla JavaScript- och CSS-filer finns på rätt plats

## Custom Domain (Valfritt)

Om du vill använda en egen domän istället för `johannesfolkesson.github.io/Snake-spel/`:

**Viktigt att veta:**
- Du behöver äga en riktig domän (t.ex. köpt från Namecheap, GoDaddy, etc.)
- `johannes123.github` är **INTE** en giltig domän - GitHub subdomäner (`*.github.io`) kan inte användas som custom domains
- Giltiga exempel: `snakegame.com`, `www.mittspel.se`, `spel.johannes.se`

**Steg för custom domain:**
1. Köp en domän från en domänregistrator
2. I ditt GitHub repository: Settings → Pages → Custom domain
3. Ange din domän (t.ex. `snakegame.com`)
4. Följ GitHubs instruktioner för DNS-konfiguration
5. Lägg till DNS-records hos din domänregistrator:
   - För apex domain (snakegame.com): A-records till GitHubs IP-adresser
   - För subdomain (www.snakegame.com): CNAME till `johannesfolkesson.github.io`

Mer info: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Support

Om du har problem, kolla:
- GitHub Actions logs i "Actions"-fliken
- GitHub Pages status i Settings → Pages

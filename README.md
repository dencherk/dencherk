# Dencherk — сайт разработчика

Статический сайт для GitHub Pages: витрина приложений, игр и сайтов. HTML, CSS и JavaScript без фреймворков и без серверной части.

## Структура

```
index.html            главная (готовая HTML-разметка)
privacy.html          политика конфиденциальности (готовая HTML-разметка)
404.html              страница ошибки (готовая HTML-разметка)
CNAME                 домен для GitHub Pages (dencherk.ru)
data/site.json        все тексты, контакты и адрес сайта
data/projects.json    проекты: приложения, сайты, игры
css/styles.css        собранный Tailwind (коммитится)
js/app.js             гидрация, меню и анимации
js/render.js          общие HTML-шаблоны для браузера и prerender
js/icons.js           иконки Phosphor
src/input.css         исходник стилей
tailwind.config.js    палитра, шрифт, ширина текста
assets/               шрифты, иконки, экраны, OG, favicon
tools/prerender.mjs   статическая сборка HTML из data/*.json
tools/seo.mjs         canonical, sitemap и robots из site.json
```

## Как добавить проект

1. Положите иконку и экраны в `assets/projects/<slug>/`.
2. Добавьте запись в `data/projects.json`:

```json
{
  "slug": "my-game",
  "type": "game",
  "title": "Название",
  "tagline": "Одна строка о проекте",
  "description": "Короткое описание для поиска",
  "platform": "Android",
  "icon": "assets/projects/my-game/icon.png",
  "screenshots": [
    {
      "src": "assets/projects/my-game/1.webp",
      "width": 720,
      "height": 1280,
      "alt": "Что видно на экране"
    }
  ],
  "links": [
    { "label": "Google Play", "url": "https://play.google.com/..." }
  ]
}
```

Карточка появится сама после `npm run build`: HTML пересобирается из JSON, вручную править `index.html` не нужно. Запись с `type: "game"` уберёт пустое состояние из раздела «Игры». Поля с `TODO` и записи с `"hidden": true` не выводятся.

## После правки JSON

`index.html`, `privacy.html` и `404.html` содержат готовый HTML, а не пустой каркас. Он собирается из `data/site.json` и `data/projects.json`:

```bash
npm run build
```

Шаг `build:prerender` записывает шапку, меню, контент, подвал и JSON-LD прямо в HTML. После любой правки JSON запускайте `npm run build` и коммитьте пересобранные файлы (`index.html`, `privacy.html`, `404.html`, `css/styles.css`, `sitemap.xml`, `robots.txt`).

Без JavaScript страница читается: контент уже в HTML. С включённым JavaScript `js/app.js` не перерисовывает разметку, а только включает меню, подсветку навигации, reveal и tagline. Класс `no-js` на `<html>` заменяется на `js` маленьким inline-скриптом в `<head>`.

## Адрес сайта

`SITE_URL` хранится в `data/site.json` в поле `url` (сейчас `https://dencherk.ru`). После смены домена выполните:

```bash
npm run build
```

Сборка обновит `canonical`, `og:url`, `og:image`, JSON-LD, `sitemap.xml` и `robots.txt`. Файл `CNAME` уже содержит `dencherk.ru`; при смене домена обновите его вручную.

## Сборка

```bash
npm install
npm run build
```

`npm run build` выполняет три шага: собирает `css/styles.css`, пересобирает HTML через `tools/prerender.mjs` и обновляет SEO-файлы. `css/styles.css` и готовые HTML лежат в репозитории, поэтому результат сборки нужно коммитить. После правок классов или `src/input.css` тоже запускайте `npm run build`.

## Локальный просмотр

Браузеры не загружают JSON через `fetch` из `file://`, поэтому нужен любой статический сервер:

```bash
python -m http.server 8080
```

Затем откройте `http://localhost:8080`. Встроенный сервер Python не отдаёт `404.html` на неизвестные адреса; для проверки 404 на вложенных путях нужен GitHub Pages или сервер с fallback на `404.html`.

## Публикация

Ветка `main`, папка `/`, без GitHub Actions. Файл `.nojekyll` уже добавлен, `CNAME` указывает на `dencherk.ru`. Сайт работает и на `username.github.io`, и на своём домене: пути относительные, кроме `canonical` и OG, которые считаются от `SITE_URL`.

## Что осталось заполнить

- `data/site.json` → `contacts.telegram`: сейчас `TODO`, блок Telegram скрыт.
- `data/site.json` → `name`: стоит `Dencherk`.
- `assets/og/og-image.png`: простой вариант 1200×630, можно заменить.
- Скриншот сайта `assets/projects/professor-apelsinkin/1.webp` снят с professor-apelsinkin.ru и обрезан до 16:10.

Иконки и экраны приложений и игры взяты из RuStore, Google Play и с сайта центра. Шрифт Manrope (OFL) лежит локально в `assets/fonts`.

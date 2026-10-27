# Dencherk — сайт разработчика

Статический сайт для GitHub Pages: витрина приложений, игр и сайтов. HTML, CSS и JavaScript без фреймворков и без серверной части.

## Структура

```
index.html            главная
privacy.html          политика конфиденциальности
404.html              страница ошибки
CNAME                 домен для GitHub Pages (dencherk.ru)
data/site.json        все тексты, контакты и адрес сайта
data/projects.json    проекты: приложения, сайты, игры
css/styles.css        собранный Tailwind (коммитится)
js/app.js             рендер страницы и анимации
js/icons.js           иконки Phosphor
src/input.css         исходник стилей
tailwind.config.js    палитра, шрифт, ширина текста
assets/               шрифты, иконки, экраны, OG, favicon
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

Карточка появится сама. Запись с `type: "game"` уберёт пустое состояние из раздела «Игры». Поля с `TODO` и записи с `"hidden": true` не выводятся.

## Адрес сайта

`SITE_URL` хранится в `data/site.json` в поле `url` (сейчас `https://dencherk.ru`). После смены домена выполните:

```bash
npm run build:seo
```

Скрипт обновит `canonical`, `og:url`, `og:image`, `sitemap.xml` и `robots.txt`. Файл `CNAME` уже содержит `dencherk.ru`; при смене домена обновите его вручную.

## Сборка стилей

```bash
npm install
npm run build:css
```

`css/styles.css` уже собран и лежит в репозитории. Пересобирайте его после правок классов или `src/input.css`.

## Локальный просмотр

Браузеры не загружают JSON через `fetch` из `file://`, поэтому нужен любой статический сервер:

```bash
python -m http.server 8080
```

Затем откройте `http://localhost:8080`.

## Публикация

Ветка `main`, папка `/`, без GitHub Actions. Файл `.nojekyll` уже добавлен, `CNAME` указывает на `dencherk.ru`. Сайт работает и на `username.github.io`, и на своём домене: пути относительные, кроме `canonical` и OG, которые считаются от `SITE_URL`.

## Что осталось заполнить

- `data/site.json` → `contacts.telegram`: сейчас `TODO`, блок Telegram скрыт.
- `data/site.json` → `name`: стоит `Dencherk`.
- `assets/og/og-image.png`: простой вариант 1200×630, можно заменить.
- Скриншот сайта `assets/projects/professor-apelsinkin/1.webp` снят с professor-apelsinkin.ru и обрезан до 16:10.

Иконки и экраны приложений и игры взяты из RuStore, Google Play и с сайта центра. Шрифт Manrope (OFL) лежит локально в `assets/fonts`.

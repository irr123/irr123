---
date: 2026-08-19T00:00:00Z
back_ref: /blog/_index.md
draft: true
title: "2000 years of re-targeting"
description:
  "The feed screams acceleration. My most stable dependency is 2000 years old.
  AI hype is re-targeting: same pitch, fresh channel. OpenAI just opened an ad
  desk."
---

Ямпольский: регулировать поздно. Контроль над сверхразумом нерешаем: 2-3 года до
саморазгона, p(doom) 99.9%[^yampolskiy]. Маск: «AI probably exceeds the sum of
all human intelligence in 4 or 5 years»[^musk]. Открываешь x.com, HN, reddit, и
каждый день как будто подтверждает: летим в сингулярность.

Те же люди зовут «зарегулировать», то есть притормозить. Маск в марте 2023
подписал письмо о паузе на полгода[^pause]. Основание одно: мы так считаем.
Покажи метрику. Пока её нет, «мою модель правительство США забанило один раз, а
твою ноль» это не измерение, это маркетинг без единого пруфа.

Моё мнение: это очередной калькулятор. Прорывов больше не видно, впереди чуть
умнее автокомплит. Ощущение ускорения настоящее. Причина нет.

Это ретаргетинг. Один креатив, новый сегмент. Я смотрю на маркетинг как на канал
доставки, а не на содержание: ремесло, которое 2000 лет переупаковывает одно и
то же под аудиторию, которая меняется.

## Столп

Сейчас делаю Backsight[^backsight]. Тяну из текста детерминированные метрики:
длина предложения, доля глаголов, повторы, ритм. Всё это должно работать в
отрыве от конкретного языка, иначе метрика меряет переводчика, а не автора.
Значит нужен один текст, живущий на всех языках сразу, с фиксированным
содержанием.

Мог взять Wikipedia или Common Crawl. Оба ползут: правки каждый день, покрытие
языков неровное, лицензии мутные. Мне нужен корпус, который не сдвинется под
ногами, пока я калибрую метрику. Взял тот, которому 2000 лет. Библию.

В компьютерной лингвистике это давно стандарт: параллельный корпус на 100+
языках, выровненный по стихам, с 2014-2015 годов[^bible]. Для структурных метрик
(порядок слов, распределения) он стабилен между переводами[^typology]. Для
моделирования современной речи не годится. Архаика, translationese, узкий жанр.
Мне нужны структуры, не разговорный регистр. Беру.

И тут щелчок. Самый стабильный dependency в моём стеке это заодно самая длинная
ретаргет-кампания в истории. Один текст, тысяча обёрток под каждое поколение,
каждый язык, каждую секту. Библия не выжила вопреки маркетингу. Она выжила
потому, что маркетинг вокруг неё переупаковывался две тысячи лет.

## Обёртки гниют

Корпус лежит на дне. А стек над ним оборачивается за неделю. Каждая новая
обёртка продаёт себя как прорыв, и каждая через итерацию превращается в гирю.
Три штуки, которые я щупал сам:

- SDD раздувается в базу знаний. Scott Logic намерил 2577 строк markdown на 689
  строк кода за одну фичу[^scottlogic]. Код ушёл вперёд, а агент перечитывает
  эти спеки каждую сессию и платит за них токенами.
- Контекст-файлы. Статья ETH намерила +20% к стоимости инференса без общего
  прироста успеха; лишний груз это repository-overview секции, которые агент и
  так выведет из кода[^agentsmd].
- Плагины. caveman обещал 65% экономии токенов, бенчмарк JetBrains намерил
  8.5%[^caveman]. Качество не просело, честно. Но Anthropic сам просит
  переоценивать скилы после каждого апдейта модели[^skills]. Прибитый скилл это
  ставка, что следующая модель его не разлюбит. Ставку ты проверяешь бенчмарком,
  а не верой в чужой README.

Всё это решения стандартных, старых задач: память между сессиями, передача
контекста, экономия. Маркетинг переклеивает на них ярлык прорыва. Обёртки я уже
разбирал подробнее[^harness] [^rotten].

## Фундамент держит

Что тогда держит. Скучная штука: полу-регулярная ретроспектива с агентом. Раз
в【N дней】 я скармливаю ему собственные сессии и спрашиваю, что мешало: где он
спотыкался, какое правило устарело, какой скилл ни разу не выстрелил. Он
предлагает правки в скилы, AGENTS.md, промпты. Я утверждаю руками. Гниль уходит
до того, как станет гирей.

Не я это придумал. Есть готовый `agent-retro`, есть практика ежемесячного prune
для CLAUDE.md[^retro]. Ретроспектива это ритуал из agile, ему лет двадцать;
новое тут только артефакт, на который он наведён. У меня за последний прогон
сгнило 【что именно: пример】; после ретро 【before/after: число】. Старая
привычка бьёт по свежей проблеме, и никакого прорыва для этого не понадобилось.

## Ради чего гонка

Инженерия не обесценилась. Вакансии разработчиков выросли на 15% за год, 71%
прироста в senior[^indeed]. Но вход поджат: junior-вакансий на 14% меньше[^iza].
И потолок автономии тот же: человек в петле, отрасль только переименовала его в
«на петле»[^thoughtworks]. Вечность не обещаю, это прогноз.

Роста от AI на медиане нет. Fed намерил +0.07% производительности за год[^fed],
OpenAI в собственном отчёте не нашёл связи выручки с использованием
ChatGPT[^openai-report]. Деньги у продавца лопат.

А продавец лопат на прошлой неделе открыл рекламный отдел. OpenAI запускает
ChatGPT Ads в 31 стране ЕС. Conversion-ставки, geo-targeting, custom audiences,
OpenAI Pixel, Conversions API[^openai-ads]. Пиксель. Реклама только на
бесплатных тарифах: бесплатный юзер это инвентарь, а не клиент.

Самая дорогая технология десятилетия наведена на самую старую задачу: продать
тебе решение в момент выбора. Reach vs relevance, тот же вопрос, что у зазывалы
на площади, теперь с пикселем.

2000 лет ретаргетинга. Свежий канал. Столпы старые, и до сих пор отвечают на
вызов.

{data-content="footnotes"}

[^yampolskiy]:
    Roman Yampolskiy, "AI: Unexplainable, Unpredictable, Uncontrollable".
    p(doom) ~99.9%, проблема контроля сверхразума нерешаема имеющимися
    средствами, ~2-3 года до системы, которая ведёт AI-исследование сама.
    <https://lexfridman.com/roman-yampolskiy-transcript/>

[^musk]:
    Elon Musk, ответ Peter Diamandis в X (июнь 2026): "AI probably exceeds the
    sum of all human intelligence in 4 or 5 years".
    <https://www.mitsloanme.com/article/elon-musk-predicts-ai-will-eclipse-human-intelligence-in-5-years/>

[^pause]:
    Future of Life Institute, "Pause Giant AI Experiments: An Open Letter", 22
    марта 2023: пауза на полгода на обучение моделей мощнее GPT-4; среди
    подписантов Elon Musk.
    <https://futureoflife.org/open-letter/pause-giant-ai-experiments/>

[^backsight]:
    TODO relref на прошлый пост про Backsight, если он есть; иначе ссылка на
    продукт.

[^bible]:
    Christodoulopoulos & Steedman, "A Massively Parallel Corpus: the Bible in
    100 Languages", Language Resources and Evaluation 2015.
    <https://homepages.inf.ed.ac.uk/steedman/papers/lrande/christodoulopoulos.pdf>

[^typology]:
    LREC 2024: порядок слов из Библии стабилен между переводами и сходится с
    независимыми типологическими ресурсами.
    <https://aclanthology.org/2024.lrec-main.965/>

[^scottlogic]:
    Scott Logic, "Putting Spec Kit through its paces", 2025-11-26. 2577 строк
    markdown на 689 loc за одну фичу.
    <https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html>

[^agentsmd]:
    Gloaguen et al., "Evaluating AGENTS.md", arXiv 2602.11988 (ETH Zurich).
    "Does not generally improve task success, while increasing inference cost by
    over 20% on average." <https://arxiv.org/abs/2602.11988>

[^caveman]:
    JetBrains benchmark: заявлено 65% экономии токенов, измерено 8.5%;
    деградации качества нет (p=0.82). TODO проверить URL перед merge.
    <https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-to-save-tokens/>

[^skills]:
    Anthropic, skill-creator: переоценивать скилы после апдейта модели, скилл
    может регрессировать или стать лишним.
    <https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills>

[^harness]:
    {{< relref "blog/posts/ai-agent-architecture-model-harness-intent" >}}

[^rotten]: {{< relref "blog/posts/rotten-specs" >}}

[^retro]:
    Практика уже названа и оттулена: giannimassi/agent-retro
    (<https://github.com/giannimassi/agent-retro>) и ежемесячный prune CLAUDE.md
    (<https://mcp.directory/blog/claude-md-agents-md-maintenance-2026>).

[^indeed]:
    Indeed Hiring Lab, 2026-07-08: вакансии разработчиков +15% (Feb 2025 - May
    2026), 71% прироста в senior.
    <https://www.hiringlab.org/2026/07/08/ai-and-job-postings-from-destruction-to-creation/>

[^iza]:
    IZA DP 18723: относительное падение junior-вакансий на 14-15% против senior.
    <https://www.iza.org/publications/dp/18723/generative-ai-and-the-redefinition-of-entry-level-software-work>

[^thoughtworks]:
    Thoughtworks: индустрия дрейфует с "human-in-the-loop" на
    "human-on-the-loop", supervisory engineering.
    <https://www.thoughtworks.com/insights/blog/generative-ai/cybernetics-and-human-on-the-loop-in-agentic-coding>

[^fed]:
    St. Louis Fed, июль 2026: utilization-adjusted TFP +0.07% за 4 квартала;
    ~95% AI-предложений о производительности про будущее.
    <https://www.stlouisfed.org/on-the-economy/2026/jul/ai-productivity-what-firms-say-earnings-calls>

[^openai-report]:
    OpenAI, arXiv 2608.12236, стр. 35: "revenue per employee is not meaningfully
    associated with output tokens per employee or messages per active user".
    <https://arxiv.org/abs/2608.12236>

[^openai-ads]:
    OpenAI, "ChatGPT Ads expands across Europe": 31 страна ЕС, conversion
    optimization, geo-targeting, custom audiences, OpenAI Pixel, Conversions
    API. Реклама только на Free/Go.
    <https://openai.com/index/chatgpt-ads-expands-across-europe/>

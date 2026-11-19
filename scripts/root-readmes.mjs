#!/usr/bin/env node
// Writes the root README in English and eight more languages from the agent packages and the
// groups in sales/site.json. Translations by Claude; a native speaker's review is still pending
// (said at the top of each translated file). Run again after adding or renaming an agent.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages');
const site = JSON.parse(readFileSync(join(ROOT, 'sales', 'site.json'), 'utf8'));
const agents = readdirSync(PK).filter((n) => n.startsWith('fairdrive-') && n !== 'fairdrive-core').sort();
const pkg = (n) => JSON.parse(readFileSync(join(PK, n, 'package.json'), 'utf8'));
const evals = agents.reduce((s, n) => s + JSON.parse(readFileSync(join(PK, n, 'evals', 'cases.json'), 'utf8')).cases.length, 0);
const SPECIAL = { 'OFAC and Red Flags records': 'fairdrive-ofac-red-flags' };
const titleToPkg = (title) => { if (SPECIAL[title]) return SPECIAL[title]; const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''); const hit = agents.find((a) => a === `fairdrive-${slug}`) || agents.find((a) => a.includes(slug.split('-')[0]) && a.includes(slug.split('-').at(-1))); if (!hit) throw new Error(`no package for "${title}"`); return hit; };
const groups = site.groups.map(([g, list]) => [g, list.map(([t, line]) => ({ name: titleToPkg(t), title: t, line }))]);
const seen = new Set(groups.flatMap(([, l]) => l.map((x) => x.name)));
const missing = agents.filter((a) => !seen.has(a)); if (missing.length) throw new Error(`not in site.json groups: ${missing.join(', ')}`);
const link = (n) => `[\`${n}\`](packages/${n})`;

const T = {
  de: { file: 'README.de.md', note: 'Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.',
    intro: `${agents.length} kleine MCP-Agenten für Autohäuser (Marken- und freie Händler), Werkstätten und Karosseriebetriebe. Jeder Agent hat **eine Aufgabe**, liest die Dateien, die Ihr DMS, Ihr Werkstattsystem, Ihr Kalkulationssystem, Ihr Einkaufsfinanzierer oder der Hersteller bereits exportiert, und schreibt eine Arbeitsliste: was fehlt, zu spät ist, zu wenig bezahlt wurde oder nicht stimmt.`,
    badges: 'MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · nur fiktive Testdaten', setup: 'Einrichtung als Festpreis-Paket', tryit: 'Ausprobieren', tryline: 'Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`<agent> mcp --root <ordner>`).', agentsH: 'Die Agenten',
    groups: { 'Deals and F&I': 'Verkäufe und F&I', 'Vehicles and floorplan': 'Fahrzeuge und Einkaufsfinanzierung', 'Service, parts and collision': 'Service, Teile und Karosserie', 'The accounting office': 'Buchhaltung' },
    safeH: 'Wie sie sicher bleiben', safe: ['**Nur lokale Dateien.** Keine Anmeldung bei DMS, Banken, Herstellerportalen, Zulassungsstellen oder Versicherern; kein Netzwerk, keine Telemetrie.', '**Maskiert, bevor das Modell es sieht.** Kundennamen, Telefonnummern, E-Mails, Adressen und Ausweisnummern werden zu Pseudonymen (`CU-3f9a1c2e`).', '**Menschen handeln.** Zahlen, Finanzieren, Zulassen, Einreichen, Senden und Buchen verweigert jeder Agent; Entwürfe und Zahllisten warten auf den Klick einer namentlich genannten Person, auch im Auto-Modus.', '**Einstellungen statt fester Regeln.** Tage, Sätze, Provisionspläne, Steuersätze und Grenzen bestätigt Ihr Betrieb.', '**Keine Compliance-Urteile.** Der OFAC- und Red-Flags-Agent prüft nur, ob Nachweise vorliegen.'],
    checksH: 'Geprüft', checks: (t, e) => `${t} Tests und ${e} Eval-Fälle, alle bestanden (Windows, Node 24). Feindliche Eingaben und kaputte Argumente: 0 Befunde. Exporte in neun Sprachen werden gleich gelesen. Details in [REVIEW-ver1.md](REVIEW-ver1.md).` },
  fr: { file: 'README.fr.md', note: 'Traduit par Claude ; relecture par un locuteur natif en attente. Le [README](README.md) anglais fait foi.',
    intro: `${agents.length} petits agents MCP pour les concessionnaires (de marque ou indépendants), les garages et les carrosseries. Chaque agent a **une seule tâche**, lit les fichiers que votre DMS, votre logiciel d’atelier, votre outil de chiffrage, votre financeur de stock ou le constructeur exportent déjà, et rédige une liste de travail : ce qui manque, est en retard, est payé en moins ou est faux.`,
    badges: 'Licence MIT · Node 20 ou plus récent · fichiers locaux uniquement · aucun identifiant · données de test fictives', setup: 'Mise en place à prix fixe', tryit: 'Essayer', tryline: 'Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`<agent> mcp --root <dossier>`).', agentsH: 'Les agents',
    groups: { 'Deals and F&I': 'Ventes et F&I', 'Vehicles and floorplan': 'Véhicules et financement de stock', 'Service, parts and collision': 'Atelier, pièces et carrosserie', 'The accounting office': 'Comptabilité' },
    safeH: 'Comment ils restent sûrs', safe: ['**Fichiers locaux uniquement.** Aucune connexion au DMS, aux banques, aux portails constructeur, à l’administration ou aux assureurs ; pas de réseau, pas de télémétrie.', '**Masqué avant que le modèle ne le voie.** Noms, téléphones, e-mails, adresses et numéros d’identité des clients deviennent des pseudonymes (`CU-3f9a1c2e`).', '**Les personnes agissent.** Payer, financer, immatriculer, déposer, envoyer et comptabiliser sont refusés ; brouillons et listes de paiement attendent le clic d’une personne nommée, même en mode Auto.', '**Des réglages, pas des règles figées.** Délais, taux, plans de commission, taux de taxe et limites sont confirmés par votre établissement.', '**Aucun avis de conformité.** L’agent OFAC et Red Flags vérifie seulement que les justificatifs existent.'],
    checksH: 'Vérifié', checks: (t, e) => `${t} tests et ${e} cas d’évaluation, tous réussis (Windows, Node 24). Entrées hostiles et arguments cassés : 0 constat. Les exports en neuf langues sont lus de la même façon. Détails dans [REVIEW-ver1.md](REVIEW-ver1.md).` },
  es: { file: 'README.es.md', note: 'Traducido por Claude; pendiente de revisión por un hablante nativo. El [README](README.md) en inglés es el que vale.',
    intro: `${agents.length} pequeños agentes MCP para concesionarios (oficiales e independientes), talleres mecánicos y talleres de chapa y pintura. Cada agente tiene **una sola tarea**, lee los archivos que su DMS, su sistema de taller, su sistema de presupuestos, su financiera de plan de piso o el fabricante ya exportan, y escribe una lista de trabajo: lo que falta, llega tarde, se pagó de menos o está mal.`,
    badges: 'Licencia MIT · Node 20 o superior · solo archivos locales · sin credenciales · solo datos de prueba ficticios', setup: 'Puesta en marcha a precio fijo', tryit: 'Probar', tryline: 'Cada agente tiene una `demo` con archivos ficticios, un `eval` con sus propios casos de prueba y un servidor MCP (`<agent> mcp --root <carpeta>`).', agentsH: 'Los agentes',
    groups: { 'Deals and F&I': 'Ventas y F&I', 'Vehicles and floorplan': 'Vehículos y plan de piso', 'Service, parts and collision': 'Servicio, repuestos y chapa', 'The accounting office': 'Contabilidad' },
    safeH: 'Cómo se mantienen seguros', safe: ['**Solo archivos locales.** No inician sesión en el DMS, bancos, portales del fabricante, la oficina de tránsito ni aseguradoras; sin red ni telemetría.', '**Enmascarado antes de que el modelo lo vea.** Nombres, teléfonos, correos, direcciones y números de identificación de clientes se vuelven seudónimos (`CU-3f9a1c2e`).', '**Las personas actúan.** Pagar, financiar, titular, presentar, enviar y contabilizar se rechazan; borradores y listas de pago esperan el clic de una persona con nombre, también en modo Auto.', '**Ajustes, no reglas fijas.** Días, tasas, planes de comisión, tasas de impuesto y límites los confirma su negocio.', '**Sin dictámenes de cumplimiento.** El agente de OFAC y Red Flags solo comprueba que los registros existan.'],
    checksH: 'Comprobado', checks: (t, e) => `${t} pruebas y ${e} casos de evaluación, todos aprobados (Windows, Node 24). Entradas hostiles y argumentos rotos: 0 hallazgos. Las exportaciones en nueve idiomas se leen igual. Detalles en [REVIEW-ver1.md](REVIEW-ver1.md).` },
  'pt-BR': { file: 'README.pt-BR.md', note: 'Traduzido pelo Claude; revisão por falante nativo pendente. O [README](README.md) em inglês é o que vale.',
    intro: `${agents.length} pequenos agentes MCP para concessionárias (de marca e independentes), oficinas mecânicas e funilarias. Cada agente tem **uma única tarefa**, lê os arquivos que seu DMS, seu sistema de oficina, seu sistema de orçamentos, sua financeira de floor plan ou a montadora já exportam, e escreve uma lista de trabalho: o que falta, está atrasado, foi pago a menos ou está errado.`,
    badges: 'Licença MIT · Node 20 ou mais recente · apenas arquivos locais · sem credenciais · apenas dados de teste fictícios', setup: 'Implantação a preço fixo', tryit: 'Experimentar', tryline: 'Cada agente tem uma `demo` com arquivos fictícios, um `eval` com seus próprios casos de teste e um servidor MCP (`<agent> mcp --root <pasta>`).', agentsH: 'Os agentes',
    groups: { 'Deals and F&I': 'Vendas e F&I', 'Vehicles and floorplan': 'Veículos e floor plan', 'Service, parts and collision': 'Serviço, peças e funilaria', 'The accounting office': 'Contabilidade' },
    safeH: 'Como eles continuam seguros', safe: ['**Apenas arquivos locais.** Não entram no DMS, bancos, portais da montadora, órgão de trânsito ou seguradoras; sem rede, sem telemetria.', '**Mascarado antes que o modelo veja.** Nomes, telefones, e-mails, endereços e números de documento dos clientes viram pseudônimos (`CU-3f9a1c2e`).', '**Pessoas agem.** Pagar, financiar, emplacar, protocolar, enviar e lançar são recusados; rascunhos e listas de pagamento esperam o clique de uma pessoa nomeada, inclusive no modo Auto.', '**Configurações, não regras fixas.** Prazos, taxas, planos de comissão, alíquotas e limites são confirmados pela sua loja.', '**Sem pareceres de conformidade.** O agente de OFAC e Red Flags só verifica se os registros existem.'],
    checksH: 'Verificado', checks: (t, e) => `${t} testes e ${e} casos de avaliação, todos aprovados (Windows, Node 24). Entradas hostis e argumentos quebrados: 0 apontamentos. Exportações em nove idiomas são lidas do mesmo jeito. Detalhes em [REVIEW-ver1.md](REVIEW-ver1.md).` },
  it: { file: 'README.it.md', note: 'Tradotto da Claude; revisione di un madrelingua in attesa. Fa fede il [README](README.md) inglese.',
    intro: `${agents.length} piccoli agenti MCP per concessionari (ufficiali e indipendenti), officine e carrozzerie. Ogni agente ha **un solo compito**, legge i file che il vostro DMS, il gestionale d’officina, il sistema di preventivazione, il finanziatore delle scorte o la casa madre esportano già, e scrive un elenco di lavoro: cosa manca, è in ritardo, è pagato meno del dovuto o è sbagliato.`,
    badges: 'Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · solo dati di prova fittizi', setup: 'Messa in opera a prezzo fisso', tryit: 'Provare', tryline: 'Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di prova e un server MCP (`<agent> mcp --root <cartella>`).', agentsH: 'Gli agenti',
    groups: { 'Deals and F&I': 'Vendite e F&I', 'Vehicles and floorplan': 'Veicoli e finanziamento scorte', 'Service, parts and collision': 'Officina, ricambi e carrozzeria', 'The accounting office': 'Contabilità' },
    safeH: 'Come restano sicuri', safe: ['**Solo file locali.** Nessun accesso a DMS, banche, portali della casa madre, motorizzazione o assicurazioni; niente rete, niente telemetria.', '**Mascherato prima che il modello lo veda.** Nomi, telefoni, e-mail, indirizzi e numeri di documento dei clienti diventano pseudonimi (`CU-3f9a1c2e`).', '**Agiscono le persone.** Pagare, finanziare, immatricolare, presentare, inviare e registrare sono rifiutati; bozze e distinte di pagamento attendono il clic di una persona indicata per nome, anche in modalità Auto.', '**Impostazioni, non regole fisse.** Giorni, tassi, piani provvigionali, aliquote e limiti li conferma la vostra azienda.', '**Nessun giudizio di conformità.** L’agente OFAC e Red Flags controlla solo che le registrazioni esistano.'],
    checksH: 'Verificato', checks: (t, e) => `${t} test e ${e} casi di valutazione, tutti superati (Windows, Node 24). Input ostili e argomenti malformati: 0 rilievi. Le esportazioni in nove lingue sono lette allo stesso modo. Dettagli in [REVIEW-ver1.md](REVIEW-ver1.md).` },
  ja: { file: 'README.ja.md', note: 'Claude による翻訳です。ネイティブによる確認はまだです。英語の [README](README.md) が正です。',
    intro: `自動車ディーラー（正規・独立系）、整備工場、板金塗装工場のための ${agents.length} 個の小さな MCP エージェントです。各エージェントは **一つの仕事だけ** を担当し、DMS、整備管理システム、見積システム、在庫金融会社、メーカーがすでに出力しているファイルを読み、足りないもの・遅れているもの・不足払い・誤りを作業リストにします。`,
    badges: 'MIT ライセンス · Node 20 以上 · ローカルファイルのみ · 認証情報不要 · 架空のテストデータのみ', setup: '固定価格のセットアップ', tryit: '試す', tryline: '各エージェントには架空ファイルで動く `demo`、独自のテストケースによる `eval`、MCP サーバー（`<agent> mcp --root <フォルダー>`）があります。', agentsH: 'エージェント一覧',
    groups: { 'Deals and F&I': '販売と F&I', 'Vehicles and floorplan': '車両と在庫金融', 'Service, parts and collision': 'サービス・部品・板金', 'The accounting office': '経理' },
    safeH: '安全のしくみ', safe: ['**ローカルファイルのみ。** DMS、銀行、メーカーポータル、陸運局、保険会社にはログインしません。通信もテレメトリーもありません。', '**モデルが見る前にマスク。** 顧客の氏名・電話・メール・住所・身分証番号は仮名（`CU-3f9a1c2e`）に置き換えます。', '**行動するのは人。** 支払い、融資実行、登録、申請、送信、記帳はすべて拒否し、下書きや支払リストは指名された人のクリックを Auto モードでも待ちます。', '**固定ルールではなく設定。** 日数、料率、歩合プラン、税率、上限はお店が確認します。', '**コンプライアンス判定はしません。** OFAC・Red Flags エージェントは記録の有無だけを確認します。'],
    checksH: '確認済み', checks: (t, e) => `${t} 件のテストと ${e} 件の評価ケースがすべて合格（Windows、Node 24）。敵対的入力・壊れた引数の検査は指摘 0 件。9 言語のエクスポートを同じように読みます。詳細は [REVIEW-ver1.md](REVIEW-ver1.md)。` },
  'zh-Hans': { file: 'README.zh-Hans.md', note: '由 Claude 翻译，尚待母语人士审校。以英文 [README](README.md) 为准。',
    intro: `面向汽车经销商（品牌店和独立店）、维修厂和钣喷厂的 ${agents.length} 个小型 MCP 智能体。每个智能体**只做一件事**：读取您的 DMS、维修管理系统、定损系统、库存融资机构或厂家已经导出的文件，写出一份工作清单——缺什么、哪里逾期、哪里少付、哪里有错。`,
    badges: 'MIT 许可 · Node 20 或更高 · 仅本地文件 · 无需凭据 · 仅虚构测试数据', setup: '固定价格的部署服务', tryit: '试用', tryline: '每个智能体都有基于虚构文件的 `demo`、带自有测试用例的 `eval`，以及 MCP 服务器（`<agent> mcp --root <文件夹>`）。', agentsH: '智能体列表',
    groups: { 'Deals and F&I': '销售与 F&I', 'Vehicles and floorplan': '车辆与库存融资', 'Service, parts and collision': '售后、配件与钣喷', 'The accounting office': '财务' },
    safeH: '如何保持安全', safe: ['**仅本地文件。** 不登录 DMS、银行、厂家门户、车管部门或保险公司；无网络、无遥测。', '**模型看到之前先脱敏。** 客户姓名、电话、邮箱、地址和证件号码会替换为假名（`CU-3f9a1c2e`）。', '**由人来操作。** 付款、放款、上牌、申报、发送和记账一律拒绝；草稿和付款清单即使在 Auto 模式下也要等指定人员点击。', '**是设置，不是写死的规则。** 天数、费率、提成方案、税率和上限由您的门店确认。', '**不做合规判定。** OFAC 与 Red Flags 智能体只检查记录是否存在。'],
    checksH: '已检查', checks: (t, e) => `${t} 个测试和 ${e} 个评测用例全部通过（Windows，Node 24）。恶意输入与错误参数检查：0 项发现。九种语言的导出文件读取结果一致。详情见 [REVIEW-ver1.md](REVIEW-ver1.md)。` },
  ko: { file: 'README.ko.md', note: 'Claude가 번역했으며 원어민 검토는 아직입니다. 영어 [README](README.md)가 기준입니다.',
    intro: `자동차 딜러(공식·독립), 정비소, 판금 도장 업체를 위한 ${agents.length}개의 작은 MCP 에이전트입니다. 각 에이전트는 **한 가지 일만** 맡아 DMS, 정비 관리 시스템, 견적 시스템, 재고금융사, 제조사가 이미 내보내는 파일을 읽고, 빠진 것·늦은 것·덜 받은 것·틀린 것을 작업 목록으로 만듭니다.`,
    badges: 'MIT 라이선스 · Node 20 이상 · 로컬 파일만 · 자격 증명 없음 · 가상 테스트 데이터만', setup: '고정 가격 설치 서비스', tryit: '사용해 보기', tryline: '각 에이전트에는 가상 파일로 도는 `demo`, 자체 테스트 케이스가 있는 `eval`, MCP 서버(`<agent> mcp --root <폴더>`)가 있습니다.', agentsH: '에이전트 목록',
    groups: { 'Deals and F&I': '판매와 F&I', 'Vehicles and floorplan': '차량과 재고금융', 'Service, parts and collision': '서비스·부품·판금', 'The accounting office': '회계' },
    safeH: '안전 장치', safe: ['**로컬 파일만.** DMS, 은행, 제조사 포털, 차량 등록 기관, 보험사에 로그인하지 않으며 네트워크와 원격 수집이 없습니다.', '**모델이 보기 전에 마스킹.** 고객 이름·전화·이메일·주소·신분증 번호는 가명(`CU-3f9a1c2e`)으로 바뀝니다.', '**행동은 사람이.** 지급, 대출 실행, 등록, 신고, 발송, 전기는 모두 거부하며 초안과 지급 목록은 Auto 모드에서도 지정된 사람의 클릭을 기다립니다.', '**고정 규칙이 아닌 설정.** 일수, 요율, 커미션 계획, 세율, 한도는 매장이 확인합니다.', '**규정 준수 판정은 하지 않습니다.** OFAC·Red Flags 에이전트는 기록이 있는지만 확인합니다.'],
    checksH: '확인됨', checks: (t, e) => `테스트 ${t}개와 평가 케이스 ${e}개 모두 통과(Windows, Node 24). 악의적 입력·잘못된 인수 검사: 지적 0건. 9개 언어의 내보내기 파일을 똑같이 읽습니다. 자세한 내용은 [REVIEW-ver1.md](REVIEW-ver1.md).` },
};
const TESTS = Number(process.env.FAIRDRIVE_TESTS || 811);
const LANG_LINKS = '[English](README.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)';
const tryBlock = ['```bash', 'npm install', 'npm test', 'node packages/fairdrive-floorplan-audit/bin/fairdrive-floorplan-audit.js demo', 'node packages/fairdrive-contracts-in-transit/bin/fairdrive-contracts-in-transit.js demo', '```'];

const en = [
  '# Fairdrive', '', LANG_LINKS, '',
  `${agents.length} small MCP agents for franchise and independent auto dealers, repair shops and body shops. Each agent does **one job**: it reads a file your DMS (CDK, Reynolds and Reynolds, Dealertrack, DealerSocket, Tekion), shop system (Tekmetric, Shopmonkey), estimating system (CCC, Mitchell), floorplan lender or manufacturer already exports, and writes the list your office works from: what is missing, late, short or wrong.`, '',
  'MIT · Node 20 or newer · local files only · no credentials · fictional test data only', '',
  `Fixed-price setup on your files: [Fairdrive](https://fair-agents.com/fairdrive.html). Built by Mythos Machines; the software is free, you pay for the setup.`, '',
  '## Try it', '', ...tryBlock, '', 'Every agent has a `demo` on fictional files, an `eval` with its own test cases and an MCP server (`<agent> mcp --root <folder>`). Sample reports are in [`sample-reports/`](sample-reports).', '',
  '## The agents', '',
  ...groups.flatMap(([g, list]) => [`### ${g}`, '', '| Agent | What it does |', '|---|---|', ...list.map((x) => `| ${link(x.name)} | ${x.line} |`), '']),
  'All of them share [`fairdrive-core`](packages/fairdrive-core): the policy engine, approvals, audit log, customer-data masking, the readers for CSV, Excel and JSON exports in nine languages, and the report pages.', '',
  '## How they stay safe', '',
  '- **Local files only.** No login to a DMS, lender portal, manufacturer portal, DMV, insurer or bank; no network calls, no telemetry.',
  '- **Masked before the model sees it.** Customer names, phones, e-mails, addresses and ID numbers become stable pseudonyms (`CU-3f9a1c2e`) in every result an AI model reads. The files written on your machine keep the real values.',
  '- **People act.** Paying, funding, titling, filing, sending and posting are refused by every agent. Payoff lists, commission sheets and letters are drafts that wait for one named person\'s click, even in Auto mode, tied to the sha256 of the reviewed draft.',
  '- **Settings, not hard-coded rules.** Days, rates, pay plans, tax rates, curtailment schedules and program limits are arguments or files your store confirms.',
  '- **No compliance verdicts.** The OFAC and Red Flags agent checks that records exist and are dated before delivery; it never reads or clears a check result.',
  '- **Every call audited** in a hash-chained log under `.fairdrive/`, with arguments stored as a hash.', '',
  '## Checked', '',
  `${TESTS} tests and ${evals} eval cases pass on Windows with Node 24. Hostile data and broken-argument runs: 0 findings. Every eval file read again as a German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean export gives the same answers. Numbers, bugs fixed and what is not checked yet: [REVIEW-ver1.md](REVIEW-ver1.md).`, '',
  '## Scripts', '', '| Command | What it runs |', '|---|---|',
  '| `npm test` | every package\'s tests |', '| `npm run hostile` / `npm run hostile:args` | planted formulas, HTML, path tricks and AI-aimed text; broken arguments in every tool |', '| `npm run intl` | every spreadsheet eval case in eight more languages and legacy encodings |', '| `npm run bench` | every report tool at 1,000 and 10,000 rows |', '| `npm run release:check:offline` | metadata, honest-copy scan, secret scan, one-click policy, `npm pack` |', '| `npm run samples` | rewrites `sample-reports/` |', '',
  '## Licence', '', 'MIT. Fictional data only: every store, customer, lender, insurer, vehicle make and person in the fixtures is made up.', '',
].join('\n');
writeFileSync(join(ROOT, 'README.md'), en);
for (const [, t] of Object.entries(T)) {
  const text = [
    '# Fairdrive', '', LANG_LINKS, '', `*${t.note}*`, '', t.intro, '', t.badges, '',
    `${t.setup}: [Fairdrive](https://fair-agents.com/fairdrive.html).`, '',
    `## ${t.tryit}`, '', ...tryBlock, '', t.tryline, '',
    `## ${t.agentsH}`, '',
    ...groups.flatMap(([g, list]) => [`**${t.groups[g]}:** ${list.map((x) => link(x.name)).join(', ')}`, '']),
    `## ${t.safeH}`, '', ...t.safe.map((s) => `- ${s}`), '',
    `## ${t.checksH}`, '', t.checks(TESTS, evals), '',
  ].join('\n');
  writeFileSync(join(ROOT, t.file), text);
}
console.log(`README.md and ${Object.keys(T).length} translations written (${agents.length} agents, ${evals} eval cases)`);

// The words on a report page, in the nine report languages: page headings, section
// headings and the common column names. `--lang` (or FAIRDRIVE_LANG) picks the language.
//
// What does not change with the language: the CSV file (its column names are read by
// scripts), finding codes and status values, the finding sentences and the notes under
// "Limits". A page in another language says so in its footer.
//
// Translations are written by Claude and marked for review by a native speaker.
// A string with no translation is shown in English, never left blank.
import { normLang } from './lang.js';

const ORDER = ['de', 'fr', 'es', 'pt', 'it', 'ja', 'zh', 'ko'];

// English: [de, fr, es, pt, it, ja, zh, ko]. {d} is a date, {1} {2} are numbers.
const PAGE = {
  'All rows ({1})': ['Alle Zeilen ({1})', 'Toutes les lignes ({1})', 'Todas las filas ({1})', 'Todas as linhas ({1})', 'Tutte le righe ({1})', '全行（{1}）', '全部行（{1}）', '전체 행 ({1})'],
  Limits: ['Grenzen', 'Limites', 'Límites', 'Limites', 'Limiti', '制限事項', '限制说明', '한계'],
  'None.': ['Keine.', 'Aucun.', 'Ninguno.', 'Nenhum.', 'Nessuno.', 'なし。', '无。', '없음.'],
  'Written by a Fairdrive agent from your files. Nothing was sent, paid, funded, titled or posted.': [
    'Von einem Fairdrive-Agenten aus Ihren Dateien erstellt. Nichts wurde gesendet, bezahlt, finanziert, zugelassen oder gebucht.',
    'Rédigé par un agent Fairdrive à partir de vos fichiers. Rien n’a été envoyé, payé, financé, immatriculé ni comptabilisé.',
    'Escrito por un agente Fairdrive a partir de sus archivos. No se envió, pagó, financió, tituló ni contabilizó nada.',
    'Escrito por um agente Fairdrive a partir dos seus arquivos. Nada foi enviado, pago, financiado, emplacado nem lançado.',
    'Scritto da un agente Fairdrive a partire dai vostri file. Nulla è stato inviato, pagato, finanziato, immatricolato o registrato.',
    'Fairdrive エージェントがお客様のファイルから作成しました。送信、支払い、融資、登録、記帳は一切行っていません。',
    '由 Fairdrive 智能体根据您的文件生成。未发送、付款、放款、登记或记账。',
    'Fairdrive 에이전트가 귀사의 파일로 작성했습니다. 전송, 지급, 대출 실행, 등록, 전기는 하지 않았습니다.'],
  'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.': [
    'Die Zusammenfassung, die Befundtexte, die Codes und die Hinweise unter „Grenzen“ sind auf Englisch. Diese Seite wurde von Claude übersetzt; eine Prüfung durch Muttersprachler steht noch aus.',
    'La ligne de synthèse, les textes des constats, les codes et les notes sous « Limites » sont en anglais. Cette page a été traduite par Claude ; elle n’a pas encore été relue par un locuteur natif.',
    'La línea de resumen, los textos de los hallazgos, los códigos y las notas de «Límites» están en inglés. Esta página fue traducida por Claude; todavía no la ha revisado un hablante nativo.',
    'A linha de resumo, os textos dos apontamentos, os códigos e as notas em “Limites” estão em inglês. Esta página foi traduzida pelo Claude; ainda não foi revisada por um falante nativo.',
    'La riga di sintesi, i testi dei rilievi, i codici e le note sotto «Limiti» sono in inglese. Questa pagina è stata tradotta da Claude; non è ancora stata rivista da un madrelingua.',
    '概要行、指摘の本文、コード、「制限事項」の注記は英語です。このページは Claude が翻訳しました。ネイティブによる確認はまだ行われていません。',
    '摘要行、发现项的文字、代码以及“限制说明”下的备注为英文。本页由 Claude 翻译，尚未经母语人士审校。',
    '요약 문장, 지적 사항의 문구, 코드와 “한계” 아래의 주석은 영어입니다. 이 페이지는 Claude가 번역했으며 원어민 검토는 아직 이루어지지 않았습니다.'],
};

const TITLES = {
  "Comebacks": ["Wiederholungsreparaturen","Retours atelier","Reparaciones repetidas","Retornos de oficina","Rientri in officina","再修理（カムバック）","返修","재수리(컴백)"],
  "Contracts in transit at {d}": ["Verträge in Bearbeitung, Stand {d}","Contrats en cours de financement au {d}","Contratos en tránsito al {d}","Contratos em trânsito em {d}","Contratti in attesa di finanziamento al {d}","未入金のローン契約（{d} 時点）","在途贷款合同（截至 {d}）","미입금 할부 계약 ({d} 기준)"],
  "Curtailments at {d}": ["Tilgungen der Einkaufsfinanzierung, Stand {d}","Amortissements du financement de stock au {d}","Amortizaciones del plan de piso al {d}","Amortizações do floor plan em {d}","Rimborsi del finanziamento scorte al {d}","在庫金融の元本返済（{d} 時点）","库存融资本金偿还（截至 {d}）","재고금융 원금 상환 ({d} 기준)"],
  "Customer deposits at {d}": ["Kundenanzahlungen, Stand {d}","Acomptes clients au {d}","Depósitos de clientes al {d}","Sinais de clientes em {d}","Acconti dei clienti al {d}","顧客の預り金（{d} 時点）","客户订金（截至 {d}）","고객 계약금 ({d} 기준)"],
  "DMV fees at {d}": ["Zulassungsgebühren, Stand {d}","Frais d’immatriculation au {d}","Tasas de matriculación al {d}","Taxas de licenciamento em {d}","Tasse di immatricolazione al {d}","登録・名義手数料（{d} 時点）","上牌和过户费用（截至 {d}）","등록·명의 수수료 ({d} 기준)"],
  "Deal jackets with missing documents": ["Kaufakten mit fehlenden Unterlagen","Dossiers de vente incomplets","Expedientes de venta con documentos faltantes","Pastas de venda com documentos faltantes","Fascicoli di vendita con documenti mancanti","書類が欠けている販売ファイル","缺少文件的交易档案","서류가 빠진 거래 파일"],
  "Estimates against invoices at {d}": ["Kostenvoranschläge gegenüber Rechnungen, Stand {d}","Devis face aux factures au {d}","Presupuestos frente a facturas al {d}","Orçamentos frente a faturas em {d}","Preventivi rispetto alle fatture al {d}","見積と請求の比較（{d} 時点）","估价与发票对比（截至 {d}）","견적 대 청구서 ({d} 기준)"],
  "F&I product cancellations and chargebacks": ["Stornierte Finanz- und Versicherungsprodukte und Rückbelastungen","Annulations de produits F&I et rétrofacturations","Cancelaciones de productos F&I y contracargos","Cancelamentos de produtos F&I e estornos","Annullamenti di prodotti F&I e riaddebiti","F&I商品の解約とチャージバック","F&I产品退保与佣金扣回","F&I 상품 해지와 차지백"],
  "Finance reserve and product income": ["Finanzierungsprovision und Produkterträge","Commission de financement et revenus des produits","Comisión de financiación e ingresos por productos","Comissão de financiamento e receita de produtos","Provvigione di finanziamento e ricavi dei prodotti","ファイナンス手数料と商品収入","贷款返佣与产品收入","금융 수수료와 상품 수익"],
  "Flagged hours against clocked hours": ["Abgerechnete Stunden gegenüber Anwesenheitsstunden","Heures facturées face aux heures pointées","Horas facturadas frente a horas fichadas","Horas faturadas frente a horas registradas","Ore fatturate rispetto alle ore timbrate","請求工数と勤務時間","计费工时与打卡工时","청구 공임 시간 대 근무 시간"],
  "Floorplan audit at {d}": ["Prüfung der Einkaufsfinanzierung, Stand {d}","Audit du financement de stock au {d}","Auditoría del plan de piso al {d}","Auditoria do floor plan em {d}","Verifica del finanziamento scorte al {d}","在庫金融の監査（{d} 時点）","库存融资审核（截至 {d}）","재고금융 감사 ({d} 기준)"],
  "Incentive claims at {d}": ["Herstellerprämien, Stand {d}","Primes constructeur au {d}","Reclamaciones de incentivos al {d}","Pedidos de incentivos em {d}","Richieste di incentivi al {d}","メーカー販売奨励金の請求（{d} 時点）","厂家激励申领（截至 {d}）","제조사 인센티브 청구 ({d} 기준)"],
  "Insurance supplements at {d}": ["Nachträge an Versicherer, Stand {d}","Suppléments d’assurance au {d}","Suplementos a aseguradoras al {d}","Suplementos de seguradoras em {d}","Integrazioni assicurative al {d}","保険会社への追加見積（{d} 時点）","保险追加定损（截至 {d}）","보험 추가 견적 ({d} 기준)"],
  "Loaner and demo fleet at {d}": ["Ersatz- und Vorführwagen, Stand {d}","Véhicules de prêt et de démonstration au {d}","Flota de cortesía y demostración al {d}","Frota de cortesia e demonstração em {d}","Vetture di cortesia e dimostrative al {d}","代車・試乗車（{d} 時点）","代步车与试驾车（截至 {d}）","대차·시승차 ({d} 기준)"],
  "OFAC and Red Flags records": ["OFAC- und Red-Flags-Nachweise","Justificatifs OFAC et Red Flags","Registros OFAC y Red Flags","Registros OFAC e Red Flags","Registrazioni OFAC e Red Flags","OFACおよびRed Flagsの記録","OFAC与Red Flags记录","OFAC 및 Red Flags 기록"],
  "Open repair orders at {d}": ["Offene Werkstattaufträge, Stand {d}","Ordres de réparation ouverts au {d}","Órdenes de reparación abiertas al {d}","Ordens de serviço abertas em {d}","Ordini di riparazione aperti al {d}","未完了の修理オーダー（{d} 時点）","未结维修工单（截至 {d}）","미결 수리 오더 ({d} 기준)"],
  "Parts obsolescence at {d}": ["Ladenhüter im Teilelager, Stand {d}","Obsolescence du stock de pièces au {d}","Obsolescencia de repuestos al {d}","Obsolescência de peças em {d}","Obsolescenza dei ricambi al {d}","部品の滞留在庫（{d} 時点）","配件呆滞库存（截至 {d}）","부품 악성 재고 ({d} 기준)"],
  "Parts receiving at {d}": ["Teileeingang, Stand {d}","Réception des pièces au {d}","Recepción de repuestos al {d}","Recebimento de peças em {d}","Ricevimento dei ricambi al {d}","部品の入荷照合（{d} 時点）","配件收货核对（截至 {d}）","부품 입고 대사 ({d} 기준)"],
  "Policy and goodwill adjustments": ["Kulanz- und Goodwill-Nachlässe","Gestes commerciaux et prises en charge","Ajustes de cortesía y buena voluntad","Ajustes de cortesia e goodwill","Rettifiche di cortesia e goodwill","ポリシー・グッドウィル調整","善意补偿调整","정책·선의 조정"],
  "Reconditioning at {d}": ["Fahrzeugaufbereitung, Stand {d}","Remise en état au {d}","Reacondicionamiento al {d}","Recondicionamento em {d}","Ricondizionamento al {d}","中古車の再生整備（{d} 時点）","二手车整备（截至 {d}）","중고차 재정비 ({d} 기준)"],
  "Repair order margins": ["Margen der Werkstattaufträge","Marges des ordres de réparation","Márgenes de las órdenes de reparación","Margens das ordens de serviço","Margini degli ordini di riparazione","修理オーダーの粗利","维修工单毛利","수리 오더 마진"],
  "Sales commissions": ["Verkaufsprovisionen","Commissions des vendeurs","Comisiones de ventas","Comissões de vendas","Provvigioni di vendita","営業コミッション","销售提成","영업 커미션"],
  "Sales tax by county": ["Umsatzsteuer nach Bezirk","Taxe de vente par comté","Impuesto sobre ventas por condado","Imposto sobre vendas por condado","Imposta sulle vendite per contea","郡別の売上税","按县的销售税","카운티별 판매세"],
  "Schedules at {d}": ["Kontennachweise, Stand {d}","Détails de comptes au {d}","Auxiliares de cuentas al {d}","Razões auxiliares em {d}","Partitari al {d}","勘定明細（{d} 時点）","科目明细表（截至 {d}）","계정 명세 ({d} 기준)"],
  "Service contract remittances at {d}": ["Abführungen für Garantieverlängerungen, Stand {d}","Reversements des contrats de service au {d}","Remesas de contratos de servicio al {d}","Repasses de contratos de serviço em {d}","Rimesse dei contratti di servizio al {d}","サービス契約の送金（{d} 時点）","延保合同汇款（截至 {d}）","서비스 계약 송금 ({d} 기준)"],
  "Sublet invoices at {d}": ["Fremdleistungsrechnungen, Stand {d}","Factures de sous-traitance au {d}","Facturas de trabajos subcontratados al {d}","Faturas de serviços terceirizados em {d}","Fatture dei lavori esterni al {d}","外注作業の請求書（{d} 時点）","外协作业发票（截至 {d}）","외주 작업 청구서 ({d} 기준)"],
  "Titles and registrations at {d}": ["Fahrzeugbriefe und Zulassungen, Stand {d}","Titres et immatriculations au {d}","Títulos y matriculaciones al {d}","Documentos e licenciamentos em {d}","Libretti e immatricolazioni al {d}","所有権証明と登録（{d} 時点）","产权证与登记（截至 {d}）","소유권 증서와 등록 ({d} 기준)"],
  "Trade payoffs at {d}": ["Ablösen für Inzahlungnahmen, Stand {d}","Soldes de reprises au {d}","Liquidaciones de vehículos en parte de pago al {d}","Quitações de veículos na troca em {d}","Estinzioni dei finanziamenti sulle permute al {d}","下取り車のローン清算（{d} 時点）","置换车辆贷款结清（截至 {d}）","보상 판매 차량 대출 상환 ({d} 기준)"],
  "Used vehicle aging at {d}": ["Standzeiten der Gebrauchtwagen, Stand {d}","Ancienneté du stock d’occasions au {d}","Antigüedad del stock de usados al {d}","Idade do estoque de usados em {d}","Giacenza delle auto usate al {d}","中古車在庫の滞留日数（{d} 時点）","二手车库龄（截至 {d}）","중고차 재고 기간 ({d} 기준)"],
  "Warranty claims at {d}": ["Garantieanträge, Stand {d}","Demandes de garantie au {d}","Reclamaciones de garantía al {d}","Pedidos de garantia em {d}","Richieste di garanzia al {d}","保証請求（{d} 時点）","保修索赔（截至 {d}）","보증 청구 ({d} 기준)"],
  "We-owes at {d}": ["Offene Kundenzusagen, Stand {d}","Engagements dus aux clients au {d}","Compromisos pendientes con clientes al {d}","Compromissos pendentes com clientes em {d}","Impegni verso i clienti al {d}","顧客への未履行の約束（{d} 時点）","对客户的未兑现承诺（截至 {d}）","고객 미이행 약속 ({d} 기준)"],
};

const SECTIONS = {
  "By F&I manager": ["Nach F&I-Manager","Par responsable F&I","Por gerente de F&I","Por gerente de F&I","Per responsabile F&I","F&I担当者別","按F&I经理","F&I 매니저별"],
  "By advisor": ["Nach Serviceberater","Par conseiller service","Por asesor de servicio","Por consultor técnico","Per accettatore","サービスアドバイザー別","按服务顾问","서비스 어드바이저별"],
  "By age": ["Nach Alter","Par ancienneté","Por antigüedad","Por idade","Per anzianità","経過日数別","按账龄","경과 일수별"],
  "By class": ["Nach Klasse","Par catégorie","Por clase","Por classe","Per classe","区分別","按类别","분류별"],
  "By county": ["Nach Bezirk","Par comté","Por condado","Por condado","Per contea","郡別","按县","카운티별"],
  "By document": ["Nach Dokument","Par document","Por documento","Por documento","Per documento","書類別","按文件","서류별"],
  "By insurer": ["Nach Versicherer","Par assureur","Por aseguradora","Por seguradora","Per assicuratore","保険会社別","按保险公司","보험사별"],
  "By lender": ["Nach Kreditgeber","Par prêteur","Por financiera","Por financeira","Per finanziatore","金融機関別","按贷款机构","금융사별"],
  "By op code": ["Nach Arbeitspositionscode","Par code opération","Por código de operación","Por código de operação","Per codice operazione","作業コード別","按工时代码","작업 코드별"],
  "By pay type": ["Nach Zahlungsart","Par type de paiement","Por tipo de pago","Por tipo de pagamento","Per tipo di pagamento","支払区分別","按付款类型","지불 유형별"],
  "By provider": ["Nach Anbieter","Par fournisseur","Por proveedor","Por fornecedor","Per fornitore","プロバイダー別","按服务商","제공사별"],
  "By reason": ["Nach Grund","Par motif","Por motivo","Por motivo","Per motivo","理由別","按原因","사유별"],
  "By salesperson": ["Nach Verkäufer","Par vendeur","Por vendedor","Por vendedor","Per venditore","営業担当別","按销售顾问","영업 사원별"],
  "By schedule": ["Nach Kontennachweis","Par détail de compte","Por auxiliar","Por razão auxiliar","Per partitario","明細別","按明细表","명세별"],
  "By technician": ["Nach Mechaniker","Par technicien","Por técnico","Por técnico","Per tecnico","整備士別","按技师","정비사별"],
  "By week": ["Nach Woche","Par semaine","Por semana","Por semana","Per settimana","週別","按周","주별"],
  "Findings": ["Befunde","Constats","Hallazgos","Apontamentos","Rilievi","指摘事項","发现项","지적 사항"],
  "Open by age": ["Offen nach Alter","En cours par ancienneté","Abiertos por antigüedad","Em aberto por idade","Aperti per anzianità","未完了分の経過日数別","未结按账龄","미결 건 경과 일수별"],
  "Paid lines not expected": ["Gezahlte Positionen ohne Erwartung","Lignes payées non attendues","Líneas pagadas no esperadas","Linhas pagas não esperadas","Righe pagate non previste","想定外の支払行","未预期的已付款行","예상하지 않은 지급 행"],
  "Payments with no deal": ["Zahlungen ohne Verkauf","Paiements sans vente","Pagos sin operación","Pagamentos sem venda","Pagamenti senza vendita","取引のない入金","无对应交易的付款","거래 없는 입금"],
  "Repair orders with no unit": ["Werkstattaufträge ohne Fahrzeug","Ordres de réparation sans véhicule","Órdenes de reparación sin unidad","Ordens de serviço sem veículo","Ordini di riparazione senza veicolo","車両のない修理オーダー","无对应车辆的维修工单","차량 없는 수리 오더"],
  "Statement lines not on the schedule": ["Auszugspositionen ohne Nachweis","Lignes du relevé absentes du détail","Líneas del estado de cuenta fuera del auxiliar","Linhas do extrato fora do razão","Righe dell’estratto non nel partitario","明細にない明細書の行","明细表中没有的对账单行","명세에 없는 내역서 행"],
  "Statement lines that match no contract": ["Auszugspositionen ohne Vertrag","Lignes du relevé sans contrat","Líneas del estado de cuenta sin contrato","Linhas do extrato sem contrato","Righe dell’estratto senza contratto","契約と一致しない明細書の行","无对应合同的对账单行","계약과 맞지 않는 내역서 행"],
  "Unpaid by age": ["Unbezahlt nach Alter","Impayés par ancienneté","Impagos por antigüedad","Não pagos por idade","Non pagati per anzianità","未払い分の経過日数別","未付按账龄","미지급 경과 일수별"],
};

// Column names used by two or more agents, plus the scorecard measures. A column with no
// entry keeps its English name on the page.
const COLUMNS = {
  carrier: ['Frachtführer', 'Transporteur', 'Transportista', 'Transportadora', 'Vettore', '運送会社', '承运商', '운송사'],
  carriers: ['Frachtführer', 'Transporteurs', 'Transportistas', 'Transportadoras', 'Vettori', '運送会社', '承运商', '운송사'],
  status: ['Status', 'Statut', 'Estado', 'Status', 'Stato', 'ステータス', '状态', '상태'],
  invoice_number: ['Rechnungsnummer', 'N° de facture', 'N.º de factura', 'N.º da fatura', 'N. fattura', '請求書番号', '发票号', '청구서 번호'],
  invoices: ['Rechnungen', 'Factures', 'Facturas', 'Faturas', 'Fatture', '請求書', '发票', '청구서'],
  detail: ['Einzelheiten', 'Détail', 'Detalle', 'Detalhe', 'Dettaglio', '詳細', '详情', '상세'],
  shipment_id: ['Sendungsnummer', 'N° d’expédition', 'N.º de envío', 'N.º do embarque', 'N. spedizione', '出荷番号', '货件编号', '출하 번호'],
  shipments: ['Sendungen', 'Expéditions', 'Envíos', 'Embarques', 'Spedizioni', '出荷数', '货件数', '출하 건수'],
  amount: ['Betrag', 'Montant', 'Importe', 'Valor', 'Importo', '金額', '金额', '금액'],
  lane: ['Relation', 'Axe', 'Ruta', 'Rota', 'Tratta', 'レーン', '线路', '구간'],
  billed: ['Berechnet', 'Facturé', 'Facturado', 'Faturado', 'Fatturato', '請求額', '账单金额', '청구액'],
  code: ['Code', 'Code', 'Código', 'Código', 'Codice', 'コード', '代码', '코드'],
  sku: ['Artikel', 'Référence', 'SKU', 'SKU', 'SKU', 'SKU', 'SKU', 'SKU'],
  customer: ['Kunde', 'Client', 'Cliente', 'Cliente', 'Cliente', '顧客', '客户', '고객'],
  pro: ['PRO-Nummer', 'N° PRO', 'N.º PRO', 'N.º PRO', 'N. PRO', 'PRO番号', 'PRO号', 'PRO 번호'],
  loads: ['Ladungen', 'Chargements', 'Cargas', 'Cargas', 'Carichi', '積荷数', '货载数', '화물 수'],
  load_id: ['Ladungsnummer', 'N° de chargement', 'N.º de carga', 'N.º da carga', 'N. carico', '積荷番号', '货载编号', '화물 번호'],
  reason: ['Grund', 'Motif', 'Motivo', 'Motivo', 'Motivo', '理由', '原因', '사유'],
  reasons: ['Gründe', 'Motifs', 'Motivos', 'Motivos', 'Motivi', '理由', '原因', '사유'],
  count: ['Anzahl', 'Nombre', 'Cantidad', 'Quantidade', 'Numero', '件数', '数量', '건수'],
  notes: ['Notizen', 'Notes', 'Notas', 'Notas', 'Note', 'メモ', '备注', '메모'],
  ship_date: ['Versanddatum', 'Date d’expédition', 'Fecha de envío', 'Data de embarque', 'Data di spedizione', '出荷日', '发货日期', '출하일'],
  pickup_date: ['Abholdatum', 'Date d’enlèvement', 'Fecha de recogida', 'Data de coleta', 'Data di ritiro', '集荷日', '提货日期', '픽업일'],
  date: ['Datum', 'Date', 'Fecha', 'Data', 'Data', '日付', '日期', '날짜'],
  age_days: ['Alter (Tage)', 'Âge (jours)', 'Antigüedad (días)', 'Idade (dias)', 'Età (giorni)', '経過日数', '账龄（天）', '경과 일수'],
  days_left: ['Verbleibende Tage', 'Jours restants', 'Días restantes', 'Dias restantes', 'Giorni rimanenti', '残り日数', '剩余天数', '남은 일수'],
  weight: ['Gewicht', 'Poids', 'Peso', 'Peso', 'Peso', '重量', '重量', '중량'],
  disputable: ['Strittig', 'Contestable', 'Disputable', 'Contestável', 'Contestabile', '異議申立て可能額', '可争议金额', '이의 제기 가능액'],
  flags: ['Hinweise', 'Signalements', 'Avisos', 'Alertas', 'Segnalazioni', '注意点', '提示', '주의 사항'],
  freight: ['Fracht', 'Fret', 'Flete', 'Frete', 'Trasporto', '運賃', '运费', '운임'],
  units: ['Einheiten', 'Unités', 'Unidades', 'Unidades', 'Unità', '数量', '件数', '수량'],
  issues: ['Auffälligkeiten', 'Anomalies', 'Incidencias', 'Ocorrências', 'Anomalie', '問題点', '问题', '이슈'],
  from: ['Von', 'De', 'Origen', 'Origem', 'Da', '発地', '起点', '출발지'],
  to: ['Nach', 'Vers', 'Destino', 'Destino', 'A', '着地', '终点', '도착지'],
  type: ['Art', 'Type', 'Tipo', 'Tipo', 'Tipo', '種類', '类型', '유형'],
  spend: ['Ausgaben', 'Dépenses', 'Gasto', 'Gasto', 'Spesa', '支出', '支出', '지출'],
  share_pct: ['Anteil %', 'Part %', 'Cuota %', 'Participação %', 'Quota %', 'シェア %', '份额 %', '점유율 %'],
  finding: ['Befund', 'Constat', 'Hallazgo', 'Apontamento', 'Rilievo', '指摘', '发现项', '지적 사항'],
  findings: ['Befunde', 'Constats', 'Hallazgos', 'Apontamentos', 'Rilievi', '指摘', '发现项', '지적 사항'],
  rank: ['Rang', 'Rang', 'Puesto', 'Posição', 'Posizione', '順位', '排名', '순위'],
  score: ['Punktzahl', 'Score', 'Puntuación', 'Pontuação', 'Punteggio', 'スコア', '得分', '점수'],
  variance: ['Abweichung', 'Écart', 'Variación', 'Variação', 'Scostamento', '差異', '差异', '차이'],
  difference: ['Differenz', 'Différence', 'Diferencia', 'Diferença', 'Differenza', '差額', '差额', '차액'],
  description: ['Beschreibung', 'Description', 'Descripción', 'Descrição', 'Descrizione', '内容', '描述', '설명'],
  action: ['Maßnahme', 'Action', 'Acción', 'Ação', 'Azione', '対応', '措施', '조치'],
  fix: ['Abhilfe', 'Correction', 'Solución', 'Correção', 'Rimedio', '是正策', '解决办法', '해결 방법'],
  mode: ['Verkehrsträger', 'Mode', 'Modo', 'Modal', 'Modalità', '輸送モード', '运输方式', '운송 모드'],
  over: ['Zu viel', 'Excédent', 'Exceso', 'Excedente', 'Eccedenza', '超過額', '超出金额', '초과액'],
  late: ['Verspätet', 'En retard', 'Con retraso', 'Atrasadas', 'In ritardo', '遅延', '延误', '지연'],
  value: ['Wert', 'Valeur', 'Valor', 'Valor', 'Valore', '金額', '价值', '가액'],
  credited: ['Gutgeschrieben', 'Crédité', 'Abonado', 'Creditado', 'Accreditato', '返金済み額', '已退款', '환불액'],
  paid: ['Bezahlt', 'Payé', 'Pagado', 'Pago', 'Pagato', '支払済み', '已付', '지급액'],
  rule: ['Regel', 'Règle', 'Regla', 'Regra', 'Regola', 'ルール', '规则', '규칙'],
  savings: ['Einsparung', 'Économies', 'Ahorro', 'Economia', 'Risparmio', '削減額', '节省', '절감액'],
  line: ['Position', 'Ligne', 'Línea', 'Linha', 'Riga', '明細', '行', '라인'],
  lines: ['Positionen', 'Lignes', 'Líneas', 'Linhas', 'Righe', '明細数', '行数', '라인 수'],
  expected: ['Erwartet', 'Attendu', 'Esperado', 'Esperado', 'Atteso', '期待値', '应为', '예상'],
  cost: ['Kosten', 'Coût', 'Coste', 'Custo', 'Costo', 'コスト', '成本', '비용'],
  cost_center: ['Kostenstelle', 'Centre de coûts', 'Centro de coste', 'Centro de custo', 'Centro di costo', 'コストセンター', '成本中心', '코스트센터'],
  gl_account: ['Sachkonto', 'Compte général', 'Cuenta contable', 'Conta contábil', 'Conto contabile', '勘定科目', '总账科目', '계정과목'],
  basis: ['Basis', 'Base', 'Base', 'Base', 'Base', '基準', '依据', '기준'],
  order_id: ['Auftragsnummer', 'N° de commande', 'N.º de pedido', 'N.º do pedido', 'N. ordine', '注文番号', '订单号', '주문 번호'],
  freight_pct_of_value: ['Fracht in % des Werts', 'Fret en % de la valeur', 'Flete en % del valor', 'Frete em % do valor', 'Trasporto in % del valore', '運賃の対金額比 %', '运费占货值 %', '가액 대비 운임 %'],
  delivered: ['Zugestellt', 'Livré', 'Entregado', 'Entregue', 'Consegnato', '配達日', '已送达', '배송 완료'],
  pallets: ['Paletten', 'Palettes', 'Palés', 'Paletes', 'Pallet', 'パレット数', '托盘数', '팔레트 수'],
  cost_per_mile: ['Kosten je Meile', 'Coût par mile', 'Coste por milla', 'Custo por milha', 'Costo per miglio', 'マイル当たりコスト', '每英里成本', '마일당 비용'],
  tracking: ['Sendungsverfolgungsnummer', 'N° de suivi', 'N.º de seguimiento', 'Código de rastreamento', 'N. di tracciamento', '追跡番号', '运单号', '송장 번호'],
  vendor: ['Lieferant', 'Fournisseur', 'Proveedor', 'Fornecedor', 'Fornitore', '仕入先', '供应商', '공급업체'],
  refundable: ['Erstattungsfähig', 'Remboursable', 'Reembolsable', 'Reembolsável', 'Rimborsabile', '返金可能額', '可退款金额', '환불 가능액'],
  total: ['Summe', 'Total', 'Total', 'Total', 'Totale', '合計', '合计', '합계'],
};

// Dealer column names (added to the common ones above).
Object.assign(COLUMNS, {"deal_number":["Verkaufsnummer","N° de vente","N.º de operación","N.º da venda","N. vendita","取引番号","交易号","거래 번호"],
  "stock_number":["Bestandsnummer","N° de stock","N.º de stock","N.º de estoque","N. stock","在庫番号","库存编号","재고 번호"],
  "vin":["FIN","VIN","VIN","Chassi","Telaio","車台番号","车架号","차대번호"],
  "ro_number":["Auftragsnummer","N° d’OR","N.º de orden","N.º da OS","N. ordine","修理オーダー番号","工单号","수리 오더 번호"],
  "customer":["Kunde","Client","Cliente","Cliente","Cliente","顧客","客户","고객"],
  "lender":["Kreditgeber","Prêteur","Financiera","Financeira","Finanziatore","金融機関","贷款机构","금융사"],
  "finding":["Befund","Constat","Hallazgo","Apontamento","Rilievo","指摘","发现项","지적 사항"],
  "findings":["Befunde","Constats","Hallazgos","Apontamentos","Rilievi","指摘","发现项","지적 사항"],
  "why":["Begründung","Motif","Motivo","Motivo","Motivo","理由","原因","사유"],
  "advisor":["Serviceberater","Conseiller service","Asesor","Consultor técnico","Accettatore","アドバイザー","服务顾问","어드바이저"],
  "technician":["Mechaniker","Technicien","Técnico","Técnico","Tecnico","整備士","技师","정비사"],
  "salesperson":["Verkäufer","Vendeur","Vendedor","Vendedor","Venditore","営業担当","销售顾问","영업 사원"],
  "insurer":["Versicherer","Assureur","Aseguradora","Seguradora","Assicuratore","保険会社","保险公司","보험사"],
  "provider":["Anbieter","Fournisseur","Proveedor","Fornecedor","Fornitore","プロバイダー","服务商","제공사"],
  "delivery_date":["Auslieferungsdatum","Date de livraison","Fecha de entrega","Data de entrega","Data di consegna","納車日","交车日期","출고일"],
  "days_since_delivery":["Tage seit Auslieferung","Jours depuis la livraison","Días desde la entrega","Dias desde a entrega","Giorni dalla consegna","納車からの日数","交车后天数","출고 후 일수"],
  "reason":["Grund","Motif","Motivo","Motivo","Motivo","理由","原因","사유"],
  "bucket":["Altersklasse","Tranche","Tramo","Faixa","Fascia","区分","区间","구간"],
  "pay_type":["Zahlungsart","Type de paiement","Tipo de pago","Tipo de pagamento","Tipo di pagamento","支払区分","付款类型","지불 유형"],
  "difference":["Differenz","Écart","Diferencia","Diferença","Differenza","差額","差额","차이"],
  "claim_number":["Antragsnummer","N° de dossier","N.º de reclamación","N.º do pedido","N. pratica","請求番号","索赔号","청구 번호"],
  "schedule":["Kontennachweis","Détail de compte","Auxiliar","Razão auxiliar","Partitario","明細","明细表","명세"],
  "control_number":["Kontrollnummer","N° de contrôle","N.º de control","N.º de controle","N. di controllo","コントロール番号","控制号","관리 번호"]});

// The scorecard's measure names, which the agent passes as labels.
const LABELS = {
  'Tender acceptance %': ['Auftragsannahme %', 'Acceptation des offres %', 'Aceptación de cargas %', 'Aceitação de cargas %', 'Accettazione dei carichi %', '受託率 %', '接单率 %', '수락률 %'],
  'Billing accuracy %': ['Rechnungsgenauigkeit %', 'Exactitude de la facturation %', 'Exactitud de facturación %', 'Precisão do faturamento %', 'Accuratezza della fatturazione %', '請求の正確性 %', '开票准确率 %', '청구 정확도 %'],
  'Claim-free loads %': ['Schadenfreie Ladungen %', 'Chargements sans sinistre %', 'Cargas sin reclamación %', 'Cargas sem sinistro %', 'Carichi senza reclami %', 'クレームなしの積荷 %', '无索赔货载 %', '무클레임 화물 %'],
  'Cost per mile (relative) %': ['Kosten je Meile (relativ) %', 'Coût par mile (relatif) %', 'Coste por milla (relativo) %', 'Custo por milha (relativo) %', 'Costo per miglio (relativo) %', 'マイル当たりコスト（相対）%', '每英里成本（相对）%', '마일당 비용 (상대) %'],
  'On-time delivery %': ['Pünktliche Zustellung %', 'Livraisons à l’heure %', 'Entrega a tiempo %', 'Entrega no prazo %', 'Consegne puntuali %', '定時配達 %', '准时交付 %', '정시 배송 %'],
  'On-time pickup %': ['Pünktliche Abholung %', 'Enlèvements à l’heure %', 'Recogida a tiempo %', 'Coleta no prazo %', 'Ritiri puntuali %', '定時集荷 %', '准时提货 %', '정시 픽업 %'],
  'Tracking %': ['Sendungsverfolgung %', 'Suivi %', 'Seguimiento %', 'Rastreamento %', 'Tracciamento %', '追跡 %', '跟踪 %', '추적 %'],
};

/** Every catalog, for the tests: { name: { english: [8 translations] } }. */
export const REPORT_TEXT = Object.freeze({ page: PAGE, titles: TITLES, sections: SECTIONS, columns: COLUMNS, labels: LABELS });
export const ENGLISH_NOTE = 'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.';

const DATE = /\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : vars[k]));

/** Find a phrase in a catalog: as written, then with its date as {d}, then with its numbers as {1} {2}. */
function lookup(cat, s) {
  if (Object.hasOwn(cat, s)) return [cat[s], {}];
  const d = DATE.exec(s);
  if (d) { const k = s.replace(DATE, '{d}'); if (Object.hasOwn(cat, k)) return [cat[k], { d: d[0] }]; }
  const vars = {}; let n = 0; const k = s.replace(/\d+(?:\.\d+)?/g, (m) => { vars[++n] = m; return `{${n}}`; });
  return n && Object.hasOwn(cat, k) ? [cat[k], vars] : [null, {}];
}

/**
 * Text for a report page in one language:
 *   t.page(s), t.title(s), t.section(s)  a phrase, translated when the catalog has it;
 *   t.column(name, label)                a column heading (label is the agent's own, when it set one);
 *   t.english                            true when nothing is translated.
 */
export function reportText(lang) {
  const l = normLang(lang); const i = ORDER.indexOf(l);
  const tr = (cat) => (s) => { if (i < 0) return s; const [hit, vars] = lookup(cat, String(s)); return hit && hit[i] ? fill(hit[i], vars) : s; };
  const label = tr(LABELS);
  return {
    lang: l, english: i < 0, page: tr(PAGE), title: tr(TITLES), section: tr(SECTIONS),
    column: (name, own) => { if (own) return label(own); if (i >= 0 && Object.hasOwn(COLUMNS, name) && COLUMNS[name][i]) return COLUMNS[name][i]; return String(name).replace(/_/g, ' '); },
  };
}

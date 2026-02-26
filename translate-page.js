const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

// Add use client
if (!content.includes('"use client";')) {
    content = '"use client";\n\n' + content;
}

// Add import
if (!content.includes('useTranslation')) {
    content = content.replace(
        'import Navbar from "./components/Navbar";',
        'import { useTranslation } from "./i18n/LanguageContext";\nimport Navbar from "./components/Navbar";'
    );
}

// Add hook
if (!content.includes('const { t } = useTranslation();')) {
    content = content.replace(
        'export default function Page() {',
        'export default function Page() {\n  const { t } = useTranslation();'
    );
}

// Hero replacements
content = content.replace('Reputation Infrastructure', '{t("landing.hero.chip")}');
content = content.replace('Where Skill', '{t("landing.hero.title1")}');
content = content.replace('Becomes Capital.', '{t("landing.hero.title2")}');
content = content.replace(
    'Prima diventi <span className="text-white/80 font-medium">misurabile</span> →',
    '{t("landing.hero.desc1")}<span className="text-white/80 font-medium">{t("landing.hero.desc1_hl")}</span>{t("landing.hero.desc2")}'
);
content = content.replace(
    'poi diventi <span className="text-white/80 font-medium">credibile</span> →',
    '<span className="text-white/80 font-medium">{t("landing.hero.desc2_hl")}</span>{t("landing.hero.desc3")}'
);
content = content.replace(
    'poi diventi <span className="text-white/80 font-medium">capital-ready</span>.<br />',
    '<span className="text-white/80 font-medium">{t("landing.hero.desc3_hl")}</span><br />'
);
content = content.replace(
    'La prima infrastruttura dove la disciplina è un <em className="not-italic text-white">asset verificato.</em>',
    '{t("landing.hero.desc4")}'
);
content = content.replace('>Request Early Access<', '>{t("landing.hero.req_btn")}<');
content = content.replace('>Explore the System →<', '>{t("landing.hero.exp_btn")}<');
content = content.replace(
    'Private build phase — founding cohort opening soon.',
    '{t("landing.hero.footer")}'
);
content = content.replace('SDI Score', '{t("landing.hero.card_sdi")}');
content = content.replace('>Initiate<', '>{t("landing.hero.card_init")}<');
content = content.replace('Risk Control', '"+t("landing.hero.card_rc")+"');
content = content.replace('{ label: "Stability", v: 74 }', '{ label: t("landing.hero.card_st"), v: 74 }');
content = content.replace('{ label: "Consistency", v: 78 }', '{ label: t("landing.hero.card_co"), v: 78 }');
content = content.replace('Drawdown Discipline', '"+t("landing.hero.card_dd")+"');
content = content.replace('Behavioral Stability', '"+t("landing.hero.card_bs")+"');
content = content.replace('Sharpe', '"+t("landing.hero.card_sh")+"');
content = content.replace('Win Rate', '"+t("landing.hero.card_wr")+"');
content = content.replace('Max DD', '"+t("landing.hero.card_md")+"');
content = content.replace('Illustrative profile — not indicative of a real user', '{t("landing.hero.card_ill")}');
content = content.replace('🔒 Read-only only', '"+t("landing.hero.t1")+"');
content = content.replace('🔑 Non-custodial', '"+t("landing.hero.t2")+"');
content = content.replace('🛡 Encrypted', '"+t("landing.hero.t3")+"');
content = content.replace('📐 Transparent methodology', '"+t("landing.hero.t4")+"');
content = content.replace('⚖ No financial advice', '"+t("landing.hero.t5")+"');

// Paradigm replacements
content = content.replace('>Philosophy<', '>{t("landing.paradigm.label")}<');
content = content.replace('The Shift From{" "}', '{t("landing.paradigm.title1")}{" "}');
content = content.replace('Performance to Reputation', '{t("landing.paradigm.title2")}');
content = content.replace('Markets reward risk.', '"+t("landing.paradigm.c1_l")+"');
content = content.replace('Skillion rewards discipline.', '"+t("landing.paradigm.c1_r")+"');
content = content.replace('Performance is self-declared.', '"+t("landing.paradigm.c2_l")+"');
content = content.replace('Skillion makes it verified.', '"+t("landing.paradigm.c2_r")+"');
content = content.replace('Discipline is invisible.', '"+t("landing.paradigm.c3_l")+"');
content = content.replace('Skillion makes it measurable.', '"+t("landing.paradigm.c3_r")+"');
content = content.replace(
    'In modern trading and investing, performance is often self-declared and unverified. True financial discipline remains invisible.\n              Skillion introduces a measurable standard of <span className="text-white/65">behavioral consistency</span> and <span className="text-white/65">risk control</span>.',
    '{t("landing.paradigm.desc")}'
);
content = content.replace("Cos'è davvero Skillion. E cosa <span className=\"text-rose-400\">NON</span> è.", '{t("landing.paradigm.box_title")}');
content = content.replace('Skillion non è: una prop firm · un broker · un exchange · un fondo · un venditore di segnali', '{t("landing.paradigm.box_subtitle")}');
content = content.replace('>Prop Firm Model<', '>{t("landing.paradigm.prop_title")}<');
content = content.replace('✗ Valuta su 30 giorni', '{t("landing.paradigm.prop_1")}');
content = content.replace('✗ Ricerca di guadagni veloci', '{t("landing.paradigm.prop_2")}');
content = content.replace('✗ Alta rotazione (churn rate)', '{t("landing.paradigm.prop_3")}');
content = content.replace('✗ Premia la speculazione e la visibilità', '{t("landing.paradigm.prop_4")}');
content = content.replace('>Skillion Standard<', '>{t("landing.paradigm.skl_title")}<');
content = content.replace('✓ Valuta la disciplina a lungo termine', '{t("landing.paradigm.skl_1")}');
content = content.replace('✓ Costruisce una reputazione on-chain solida', '{t("landing.paradigm.skl_2")}');
content = content.replace('✓ Crescita sostenibile e progressiva', '{t("landing.paradigm.skl_3")}');
content = content.replace('✓ Premia la stabilità e la coerenza comportamentale', '{t("landing.paradigm.skl_4")}');

// Aurion Visual Section replacements
content = content.replace('>Aurion<', '>{t("landing.aurion_layer.title")}<');
content = content.replace('Intelligence Layer · Skillion', '{t("landing.aurion_layer.subtitle")}');
content = content.replace('{ k: "Mode", v: "Behavioral Analysis" }', '{ k: t("landing.aurion_layer.k1"), v: t("landing.aurion_layer.v1") }');
content = content.replace('{ k: "Function", v: "Pattern Recognition" }', '{ k: t("landing.aurion_layer.k2"), v: t("landing.aurion_layer.v2") }');
content = content.replace('{ k: "Layer", v: "Intelligence" }', '{ k: t("landing.aurion_layer.k3"), v: t("landing.aurion_layer.v3") }');
content = content.replace('{ k: "Status", v: "Active" }', '{ k: t("landing.aurion_layer.k4"), v: t("landing.aurion_layer.v4") }');
content = content.replace('"Aurion surfaces verified behavioral patterns — not recommendations."', '{t("landing.aurion_layer.quote")}');
content = content.replace('>Intelligence Layer<', '>{t("landing.aurion_layer.label")}<');
content = content.replace('Aurion —{" "}', '{t("landing.aurion_layer.h2_1")}{" "}');
content = content.replace('>The Intelligence Layer<', '>{t("landing.aurion_layer.h2_2")}<');
content = content.replace(
    'Aurion interprets behavioral data patterns and tracks progression across the Skillion ecosystem.\n                It is the analytical intelligence layer of the platform — not a traditional assistant.',
    '{t("landing.aurion_layer.desc")}'
);
content = content.replace('Performance Interpretation', '"+t("landing.aurion_layer.b1_t")+"');
content = content.replace('Translates verified metrics into comprehensible behavioral insights.', '"+t("landing.aurion_layer.b1_d")+"');
content = content.replace('Stability Tracking', '"+t("landing.aurion_layer.b2_t")+"');
content = content.replace('Monitors consistency patterns across time and market conditions.', '"+t("landing.aurion_layer.b2_d")+"');
content = content.replace('Progression Feedback', '"+t("landing.aurion_layer.b3_t")+"');
content = content.replace('Identifies trajectory toward the next reputation tier.', '"+t("landing.aurion_layer.b3_d")+"');
content = content.replace('Behavioral Analytics', '"+t("landing.aurion_layer.b4_t")+"');
content = content.replace('Surfaces risk patterns, deviations, and consistency signals.', '"+t("landing.aurion_layer.b4_d")+"');

// Security replacements
content = content.replace('>Foundations<', '>{t("landing.security.label")}<');
content = content.replace('Security, Privacy &{" "}', '{t("landing.security.title1")}{" "}');
content = content.replace('>Methodology<', '>{t("landing.security.title2")}<');
content = content.replace('Data Privacy', '"+t("landing.security.p1_t")+"');
content = content.replace('Processed for scoring only. Never sold.', '"+t("landing.security.p1_d")+"');
content = content.replace('t: "Read-Only"', 't: t("landing.security.p2_t")');
content = content.replace('No trading or withdrawal permissions ever.', '"+t("landing.security.p2_d")+"');
content = content.replace('Non-Custodial', '"+t("landing.security.p3_t")+"');
content = content.replace('Skillion holds no funds or private keys.', '"+t("landing.security.p3_d")+"');
content = content.replace('Open Methodology', '"+t("landing.security.p4_t")+"');
content = content.replace('Based on accepted financial mathematics.', '"+t("landing.security.p4_d")+"');
content = content.replace('No Advice', '"+t("landing.security.p5_t")+"');
content = content.replace('Reputation system only — not a financial advisor.', '"+t("landing.security.p5_d")+"');
content = content.replace(
    'Skillion is not a financial institution, broker, or investment advisor. Nothing on this platform constitutes investment advice or a solicitation to trade.',
    '{t("landing.security.footer")}'
);

// CTA replacements
content = content.replace('>Early Access<', '>{t("landing.cta.label")}<');
content = content.replace('The Future of Financial<br />', '{t("landing.cta.title1")}<br />');
content = content.replace('>Reputation Starts Here.<', '>{t("landing.cta.title2")}<');
content = content.replace('Early participants will shape the first version of the reputation standard.', '{t("landing.cta.desc")}');
content = content.replace('No spam. No financial solicitation. Early access only.', '{t("landing.cta.footer")}');

// Fix string concatenations
content = content.replace(/\\r\\n/g, '\\n');
content = content.split("'\"+t(").join("t(");
content = content.split(")+\"'").join(")");

fs.writeFileSync('app/page.tsx', content);
console.log('REPLACED SUCCESS');

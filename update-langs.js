const fs = require('fs');

const en = {
    landing: {
        hero: {
            chip: "Reputation Infrastructure",
            title1: "Where Skill",
            title2: "Becomes Capital.",
            desc1: "First you become ",
            desc1_hl: "measurable",
            desc2: " → then you become ",
            desc2_hl: "credible",
            desc3: " → then you become ",
            desc3_hl: "capital-ready.",
            desc4: "The first infrastructure where discipline is a verified asset.",
            req_btn: "Request Early Access",
            exp_btn: "Explore the System",
            footer: "Private build phase — founding cohort opening soon.",
            card_sdi: "SDI Score",
            card_init: "Initiate",
            card_rc: "Risk Control",
            card_st: "Stability",
            card_co: "Consistency",
            card_dd: "Drawdown Discipline",
            card_bs: "Behavioral Stability",
            card_sh: "Sharpe",
            card_wr: "Win Rate",
            card_md: "Max DD",
            card_ill: "Illustrative profile — not indicative of a real user",
            t1: "🔒 Read-only only",
            t2: "🔑 Non-custodial",
            t3: "🛡 Encrypted",
            t4: "📐 Transparent methodology",
            t5: "⚖ No financial advice"
        },
        paradigm: {
            label: "Philosophy",
            title1: "The Shift From",
            title2: "Performance to Reputation",
            c1_l: "Markets reward risk.",
            c1_r: "Skillion rewards discipline.",
            c2_l: "Performance is self-declared.",
            c2_r: "Skillion makes it verified.",
            c3_l: "Discipline is invisible.",
            c3_r: "Skillion makes it measurable.",
            desc: "In modern trading and investing, performance is often self-declared and unverified. True financial discipline remains invisible. Skillion introduces a measurable standard of behavioral consistency and risk control.",
            box_title: "What Skillion truly is. And what it is NOT.",
            box_subtitle: "Skillion is not: a prop firm · a broker · an exchange · a fund · a signal seller",
            prop_title: "Prop Firm Model",
            prop_1: "✗ Evaluates on 30 days",
            prop_2: "✗ Search for fast profits",
            prop_3: "✗ High churn rate",
            prop_4: "✗ Rewards speculation and visibility",
            skl_title: "Skillion Standard",
            skl_1: "✓ Evaluates long-term discipline",
            skl_2: "✓ Builds a solid on-chain reputation",
            skl_3: "✓ Sustainable and progressive growth",
            skl_4: "✓ Rewards stability and behavioral consistency"
        },
        aurion_layer: {
            title: "Aurion",
            subtitle: "Intelligence Layer · Skillion",
            k1: "Mode", v1: "Behavioral Analysis",
            k2: "Function", v2: "Pattern Recognition",
            k3: "Layer", v3: "Intelligence",
            k4: "Status", v4: "Active",
            quote: "Aurion surfaces verified behavioral patterns — not recommendations.",
            label: "Intelligence Layer",
            h2_1: "Aurion —",
            h2_2: "The Intelligence Layer",
            desc: "Aurion interprets behavioral data patterns and tracks progression across the Skillion ecosystem. It is the analytical intelligence layer of the platform — not a traditional assistant.",
            b1_t: "Performance Interpretation", b1_d: "Translates verified metrics into comprehensible behavioral insights.",
            b2_t: "Stability Tracking", b2_d: "Monitors consistency patterns across time and market conditions.",
            b3_t: "Progression Feedback", b3_d: "Identifies trajectory toward the next reputation tier.",
            b4_t: "Behavioral Analytics", b4_d: "Surfaces risk patterns, deviations, and consistency signals."
        },
        security: {
            label: "Foundations",
            title1: "Security, Privacy &",
            title2: "Methodology",
            p1_t: "Data Privacy", p1_d: "Processed for scoring only. Never sold.",
            p2_t: "Read-Only", p2_d: "No trading or withdrawal permissions ever.",
            p3_t: "Non-Custodial", p3_d: "Skillion holds no funds or private keys.",
            p4_t: "Open Methodology", p4_d: "Based on accepted financial mathematics.",
            p5_t: "No Advice", p5_d: "Reputation system only — not a financial advisor.",
            footer: "Skillion is not a financial institution, broker, or investment advisor. Nothing on this platform constitutes investment advice or a solicitation to trade."
        },
        cta: {
            label: "Early Access",
            title1: "The Future of Financial",
            title2: "Reputation Starts Here.",
            desc: "Early participants will shape the first version of the reputation standard.",
            footer: "No spam. No financial solicitation. Early access only."
        }
    }
};

const it = JSON.parse(JSON.stringify(en));
it.landing.hero.title1 = "Dove la Competenza";
it.landing.hero.title2 = "Diventa Capitale.";
it.landing.hero.desc1 = "Prima diventi ";
it.landing.hero.desc1_hl = "misurabile";
it.landing.hero.desc2 = " → poi diventi ";
it.landing.hero.desc2_hl = "credibile";
it.landing.hero.desc3 = " → poi diventi ";
it.landing.hero.desc3_hl = "capital-ready.";
it.landing.hero.desc4 = "La prima infrastruttura dove la disciplina è un asset verificato.";
it.landing.hero.req_btn = "Richiedi Accesso Anticipato";
it.landing.hero.exp_btn = "Esplora il Sistema";
it.landing.hero.footer = "Fase di build privata — l'apertura della founding cohort è imminente.";
it.landing.hero.card_ill = "Profilo illustrativo — non indicativo di un utente reale";

it.landing.paradigm.label = "Filosofia";
it.landing.paradigm.title1 = "Il Passaggio Da";
it.landing.paradigm.title2 = "Performance a Reputazione";
it.landing.paradigm.c1_l = "I mercati premiano il rischio.";
it.landing.paradigm.c1_r = "Skillion premia la disciplina.";
it.landing.paradigm.c2_l = "La performance è dichiarata.";
it.landing.paradigm.c2_r = "Skillion la rende verificata.";
it.landing.paradigm.c3_l = "La disciplina è invisibile.";
it.landing.paradigm.c3_r = "Skillion la rende misurabile.";
it.landing.paradigm.desc = "Nel trading e negli investimenti moderni, le performance sono spesso autodichiarate e non verificate. La vera disciplina finanziaria rimane invisibile. Skillion introduce uno standard misurabile di coerenza comportamentale e controllo del rischio.";
it.landing.paradigm.box_title = "Cos'è davvero Skillion. E cosa NON è.";
it.landing.paradigm.box_subtitle = "Skillion non è: una prop firm · un broker · un exchange · un fondo · un venditore di segnali";
it.landing.paradigm.prop_title = "Prop Firm Model";
it.landing.paradigm.prop_1 = "✗ Valuta su 30 giorni";
it.landing.paradigm.prop_2 = "✗ Ricerca di guadagni veloci";
it.landing.paradigm.prop_3 = "✗ Alta rotazione (churn rate)";
it.landing.paradigm.prop_4 = "✗ Premia la speculazione e la visibilità";
it.landing.paradigm.skl_title = "Skillion Standard";
it.landing.paradigm.skl_1 = "✓ Valuta la disciplina a lungo termine";
it.landing.paradigm.skl_2 = "✓ Costruisce una reputazione on-chain solida";
it.landing.paradigm.skl_3 = "✓ Crescita sostenibile e progressiva";
it.landing.paradigm.skl_4 = "✓ Premia la stabilità e la coerenza comportamentale";

const es = JSON.parse(JSON.stringify(en));
const fr = JSON.parse(JSON.stringify(en));

const langs = { en, it, es, fr };
['en', 'it', 'es', 'fr'].forEach(lang => {
    const filePath = 'app/messages/' + lang + '.json';
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.landing = langs[lang].landing;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
});
console.log('DONE');

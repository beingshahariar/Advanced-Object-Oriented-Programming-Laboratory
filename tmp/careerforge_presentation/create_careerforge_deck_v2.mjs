import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "F:/AOOP/CareerForge_Motivation_Presentation_v2.pptx";
const TMP = "F:/AOOP/tmp/careerforge_presentation/v2";
const ASSETS = "F:/AOOP/frontend/src/assets";

// Exact active public-landing palette and type pairing from frontend/src/styles.css.
const C = {
  ink: "#3C6071",
  accent: "#1D7374",
  accentDark: "#176061",
  steel: "#3C6071",
  mist: "#BEC7D8",
  paper: "#FFFFFF",
  pale: "#E7F0EF",
  paleBlue: "#E9F1F4",
  line: "#D6E2E4",
  faded: "#EFF5F4",
  body: "#597382",
  white: "#FFFFFF",
};

async function loadPng(path) {
  const bytes = await fs.readFile(path);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addShape(slide, geometry, position, fill = "none", lineFill = "none", lineWidth = 0, extra = {}) {
  return slide.shapes.add({ geometry, position, fill, line: { style: "solid", fill: lineFill, width: lineWidth }, ...extra });
}

function addText(slide, value, position, opts = {}) {
  const box = addShape(slide, "textbox", position, opts.fill || "none", "none", 0, { name: opts.name });
  box.text = value;
  box.text.style = {
    fontSize: opts.size || 22,
    color: opts.color || C.ink,
    bold: Boolean(opts.bold),
    fontFace: opts.font || (opts.bold ? "Sora" : "DM Sans"),
    alignment: opts.align || "left",
    verticalAlignment: opts.valign || "top",
    lineSpacing: opts.leading,
  };
  return box;
}

function image(slide, blob, position, alt, crop) {
  return slide.images.add({ blob, contentType: "image/png", alt, fit: "cover", position, crop, geometry: "roundRect", borderRadius: 22 });
}

function wordmark(slide, x = 72, y = 40, light = false) {
  addText(slide, "career", { left: x, top: y, width: 157, height: 32 }, { size: 27, font: "Sora", bold: true, color: light ? C.white : C.ink });
  addText(slide, "forge", { left: x + 76, top: y, width: 118, height: 32 }, { size: 27, font: "Sora", bold: true, color: light ? C.mist : C.accent });
}

function kicker(slide, value, x = 72, y = 102, color = C.accent) {
  return addText(slide, value.toUpperCase(), { left: x, top: y, width: 470, height: 24 }, { size: 12, font: "DM Mono", bold: false, color });
}

function footer(slide, n, dark = false) {
  addShape(slide, "line", { left: 72, top: 679, width: 1136, height: 0 }, "none", dark ? "#93A9B3" : C.line, 1);
  addText(slide, "CAREERFORGE  /  BYTEBOTS", { left: 72, top: 690, width: 310, height: 18 }, { size: 10, font: "DM Mono", color: dark ? C.mist : C.body });
  addText(slide, String(n).padStart(2, "0"), { left: 1152, top: 690, width: 56, height: 18 }, { size: 10, font: "DM Mono", color: dark ? C.mist : C.accent, align: "right" });
}

function notes(slide, story, visuals = []) {
  slide.speakerNotes.textFrame.setText(`${story}\n\n[Sources]\n- Slide copy: user-provided CareerForge motivation speech.\n- Design tokens: local frontend/src/styles.css.\n${visuals.map((v) => `- Visual: local project asset ${v}.`).join("\n")}\n[/Sources]`);
  slide.speakerNotes.setVisible(true);
}

function miniLabel(slide, value, x, y, width, tone = "pale") {
  const fill = tone === "dark" ? C.ink : tone === "mist" ? C.paleBlue : C.pale;
  const color = tone === "dark" ? C.white : C.accent;
  addShape(slide, "roundRect", { left: x, top: y, width, height: 31 }, fill, "none", 0, { borderRadius: 9 });
  addText(slide, value, { left: x + 12, top: y + 8, width: width - 24, height: 17 }, { size: 10, font: "DM Mono", color, align: "center" });
}

function actionRow(slide, y, number, title, description, status) {
  addShape(slide, "roundRect", { left: 730, top: y, width: 416, height: 78 }, C.paper, C.line, 1, { borderRadius: 12 });
  addShape(slide, "roundRect", { left: 746, top: y + 19, width: 38, height: 38 }, C.pale, "none", 0, { borderRadius: 10 });
  addText(slide, number, { left: 746, top: y + 30, width: 38, height: 18 }, { size: 11, font: "DM Mono", color: C.accent, align: "center" });
  addText(slide, title, { left: 800, top: y + 18, width: 220, height: 22 }, { size: 15, font: "Sora", bold: true, color: C.ink });
  addText(slide, description, { left: 800, top: y + 44, width: 220, height: 16 }, { size: 11, font: "DM Sans", color: C.body });
  miniLabel(slide, status, 1040, y + 24, 84, status === "READY" ? "pale" : "mist");
}

async function build() {
  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const hero = await loadPng(`${ASSETS}/hero-bangladeshi-job-search.png`);
  const success = await loadPng(`${ASSETS}/hero-student-success.png`);
  const cv = await loadPng(`${ASSETS}/auth-register-student.png`);
  const skills = await loadPng(`${ASSETS}/auth-student-login.png`);
  const guidance = await loadPng(`${ASSETS}/auth-admin-career-services.png`);

  // 1 — project hero: derived directly from .cf-hero treatment.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    image(s, hero, { left: 0, top: 0, width: 1280, height: 720 }, "Bangladeshi student exploring career opportunities");
    addShape(s, "rect", { left: 0, top: 0, width: 760, height: 720 }, C.paper);
    addShape(s, "rect", { left: 650, top: 0, width: 155, height: 720 }, "#FFFFFF");
    wordmark(s, 72, 54);
    kicker(s, "Career tools for focused students", 72, 136);
    addText(s, "Turn career uncertainty\ninto a clear plan.", { left: 72, top: 174, width: 564, height: 142 }, { size: 49, font: "Sora", bold: true, color: C.ink, leading: 0.95 });
    addText(s, "CareerForge brings jobs, CVs, learning, and guidance into one focused workspace for students.", { left: 72, top: 345, width: 476, height: 60 }, { size: 18, font: "DM Sans", color: C.body });
    addShape(s, "roundRect", { left: 72, top: 457, width: 388, height: 82 }, C.ink, "none", 0, { borderRadius: 13 });
    addText(s, "API-INTEGRATED PLATFORM", { left: 92, top: 475, width: 270, height: 18 }, { size: 10, font: "DM Mono", color: C.mist });
    addText(s, "Jobs  ·  YouTube  ·  Gemini / Groq", { left: 92, top: 503, width: 324, height: 24 }, { size: 15, font: "Sora", bold: true, color: C.white });
    addShape(s, "roundRect", { left: 812, top: 83, width: 221, height: 71 }, "#FFFFFF", "#DCE6E5", 1, { borderRadius: 12 });
    addText(s, "CAREER JOURNEY", { left: 830, top: 101, width: 158, height: 16 }, { size: 9, font: "DM Mono", color: C.accent });
    addText(s, "One place. Every next step.", { left: 830, top: 123, width: 178, height: 19 }, { size: 12, font: "Sora", bold: true, color: C.ink });
    addShape(s, "roundRect", { left: 842, top: 575, width: 218, height: 76 }, "#FFFFFF", "#FFFFFF", 1, { borderRadius: 12, shadow: "shadow-md" });
    addText(s, "TOP JOB MATCH", { left: 861, top: 592, width: 120, height: 14 }, { size: 9, font: "DM Mono", color: C.accent });
    addText(s, "Plan ready", { left: 861, top: 615, width: 94, height: 17 }, { size: 12, font: "Sora", bold: true, color: C.ink });
    miniLabel(s, "READY", 970, 608, 76, "pale");
    addText(s, "React  ·  Spring Boot REST APIs  ·  MySQL", { left: 72, top: 612, width: 430, height: 20 }, { size: 11, font: "DM Mono", color: C.body });
    footer(s, 1);
    notes(s, "Open with CareerForge as a focused student career workspace. Highlight that the project combines its own REST API backend with job, YouTube, and AI-learning integrations.", ["hero-bangladeshi-job-search.png"]);
  }

  // 2 — team screen, styled as the project's clean white content surfaces.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    wordmark(s);
    kicker(s, "The people behind CareerForge", 72, 120);
    addText(s, "ByteBots", { left: 72, top: 154, width: 520, height: 78 }, { size: 62, font: "Sora", bold: true, color: C.ink });
    addText(s, "We built CareerForge to make the student career journey feel more organised, more focused, and more achievable.", { left: 72, top: 250, width: 518, height: 72 }, { size: 18, font: "DM Sans", color: C.body });
    addShape(s, "roundRect", { left: 674, top: 116, width: 474, height: 458 }, C.faded, "#D6E2E4", 1, { borderRadius: 18 });
    addText(s, "TEAM BYTEBOTS", { left: 706, top: 148, width: 220, height: 18 }, { size: 11, font: "DM Mono", color: C.accent });
    const members = [
      ["Md. All Shahariar Shakib", "0112330360"],
      ["Sadeed S'aad Zaman Shefin", "0112330362"],
      ["Md. Imran Iqbal", "0112230138"],
      ["Md. Mazharul Islam", "0112330700"],
    ];
    members.forEach(([name, id], i) => {
      const y = 197 + i * 83;
      addText(s, String(i + 1).padStart(2, "0"), { left: 706, top: y + 5, width: 36, height: 18 }, { size: 10, font: "DM Mono", color: C.accent });
      addText(s, name, { left: 759, top: y, width: 282, height: 25 }, { size: 15, font: "Sora", bold: true, color: C.ink });
      addText(s, `ID  ${id}`, { left: 759, top: y + 30, width: 190, height: 17 }, { size: 11, font: "DM Sans", color: C.body });
      if (i < members.length - 1) addShape(s, "line", { left: 706, top: y + 66, width: 402, height: 0 }, "none", C.line, 1);
    });
    miniLabel(s, "AOOP PROJECT", 72, 433, 150, "pale");
    addText(s, "A student-first system built around practical career actions.", { left: 72, top: 487, width: 440, height: 48 }, { size: 25, font: "Sora", bold: true, color: C.ink });
    footer(s, 2);
    notes(s, "Introduce the ByteBots team and project context before explaining why the platform was needed.");
  }

  // 3 — emotional opening, with the project hero's editorial visual direction.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    image(s, success, { left: 0, top: 0, width: 1280, height: 720 }, "Student looking ahead while preparing her career");
    addShape(s, "rect", { left: 0, top: 0, width: 720, height: 720 }, C.paper);
    addShape(s, "rect", { left: 615, top: 0, width: 160, height: 720 }, C.paper);
    wordmark(s);
    kicker(s, "Our motivation", 72, 131);
    addText(s, "Students know\nthey need a job.", { left: 72, top: 175, width: 496, height: 132 }, { size: 49, font: "Sora", bold: true, color: C.ink, leading: 0.94 });
    addText(s, "But many do not know the right way to prepare for it.", { left: 72, top: 333, width: 484, height: 86 }, { size: 27, font: "Sora", bold: true, color: C.accent });
    addShape(s, "roundRect", { left: 72, top: 488, width: 473, height: 94 }, C.faded, "none", 0, { borderRadius: 14 });
    addText(s, "THE GAP", { left: 94, top: 508, width: 100, height: 16 }, { size: 10, font: "DM Mono", color: C.accent });
    addText(s, "Ambition is present. A clear preparation path is often missing.", { left: 94, top: 535, width: 420, height: 28 }, { size: 15, font: "Sora", bold: true, color: C.ink });
    footer(s, 3);
    notes(s, "Begin the motivation: students know they need a job, but many do not know how to prepare for one in a structured way.", ["hero-student-success.png"]);
  }

  // 4 — scattered job discovery; one coherent information flow instead of a generic list.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    wordmark(s);
    kicker(s, "Challenge 01  /  Job discovery", 72, 120);
    addText(s, "Opportunity is\nscattered.", { left: 72, top: 158, width: 500, height: 125 }, { size: 57, font: "Sora", bold: true, color: C.ink, leading: 0.92 });
    addText(s, "Students search across multiple platforms, often switching context before they can decide what fits them.", { left: 72, top: 314, width: 440, height: 74 }, { size: 18, font: "DM Sans", color: C.body });
    addText(s, "The search is not one journey.", { left: 72, top: 513, width: 460, height: 31 }, { size: 22, font: "Sora", bold: true, color: C.accent });
    addText(s, "It is many disconnected starting points.", { left: 72, top: 550, width: 490, height: 25 }, { size: 16, font: "DM Sans", color: C.body });
    addShape(s, "roundRect", { left: 678, top: 115, width: 470, height: 471 }, C.faded, "#D6E2E4", 1, { borderRadius: 18 });
    addText(s, "A STUDENT’S SEARCH PATH", { left: 711, top: 147, width: 250, height: 18 }, { size: 10, font: "DM Mono", color: C.accent });
    const sources = [["LinkedIn", "Professional listings"], ["Facebook groups", "Informal updates"], ["Bdjobs", "Local opportunities"], ["Company websites", "Direct career pages"]];
    sources.forEach(([title, copy], i) => {
      const y = 190 + i * 84;
      addShape(s, "roundRect", { left: 711, top: y, width: 46, height: 46 }, i % 2 === 0 ? C.pale : C.paleBlue, "none", 0, { borderRadius: 12 });
      addText(s, String(i + 1).padStart(2, "0"), { left: 711, top: y + 15, width: 46, height: 16 }, { size: 10, font: "DM Mono", color: C.accent, align: "center" });
      addText(s, title, { left: 781, top: y + 3, width: 250, height: 22 }, { size: 17, font: "Sora", bold: true, color: C.ink });
      addText(s, copy, { left: 781, top: y + 29, width: 250, height: 17 }, { size: 12, font: "DM Sans", color: C.body });
      if (i < sources.length - 1) addShape(s, "line", { left: 735, top: y + 48, width: 0, height: 36 }, "none", C.mist, 2);
    });
    miniLabel(s, "TIME LOST", 982, 520, 124, "dark");
    footer(s, 4);
    notes(s, "Explain that students look across LinkedIn, Facebook groups, Bdjobs, and company websites. The information is scattered, so searches take longer and suitable opportunities may be missed.");
  }

  // 5 — CV mismatch.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    addShape(s, "roundRect", { left: 707, top: 42, width: 409, height: 563 }, C.mist, "none", 0, { borderRadius: 26 });
    // Image comes back to front after its soft project-colour backdrop.
    image(s, cv, { left: 752, top: 72, width: 382, height: 548 }, "Student preparing a CV for an opportunity");
    wordmark(s);
    kicker(s, "Challenge 02  /  CV preparation", 72, 120);
    addText(s, "Found a job?\nThe CV problem begins.", { left: 72, top: 164, width: 586, height: 130 }, { size: 48, font: "Sora", bold: true, color: C.ink, leading: 0.94 });
    addText(s, "Students may not know how to adapt a CV for a specific role—or how to highlight the skills that a job actually asks for.", { left: 72, top: 325, width: 542, height: 90 }, { size: 18, font: "DM Sans", color: C.body });
    addShape(s, "roundRect", { left: 72, top: 470, width: 548, height: 93 }, C.faded, "#D6E2E4", 1, { borderRadius: 14 });
    addText(s, "WHAT A STRONG APPLICATION NEEDS", { left: 96, top: 490, width: 310, height: 15 }, { size: 10, font: "DM Mono", color: C.accent });
    addText(s, "A clear connection between profile, CV, and job requirements.", { left: 96, top: 518, width: 475, height: 22 }, { size: 15, font: "Sora", bold: true, color: C.ink });
    footer(s, 5);
    notes(s, "Explain that finding a job is only the beginning. Students may struggle to prepare a CV that highlights skills relevant to a specific role.", ["auth-register-student.png"]);
  }

  // 6 — readiness and skill preparation, built like the CareerForge task-flow interface.
  {
    const s = deck.slides.add();
    s.background.fill = C.faded;
    wordmark(s);
    kicker(s, "Challenge 03  /  Skill readiness", 72, 120);
    addText(s, "“Am I ready\nfor this role?”", { left: 72, top: 162, width: 505, height: 122 }, { size: 52, font: "Sora", bold: true, color: C.ink, leading: 0.92 });
    addText(s, "A student may find an interesting role, but still be unsure what to learn, where to learn it, or whether they are ready to apply.", { left: 72, top: 322, width: 488, height: 92 }, { size: 18, font: "DM Sans", color: C.body });
    addText(s, "Preparation becomes difficult when the answer is scattered across different tools.", { left: 72, top: 516, width: 516, height: 55 }, { size: 20, font: "Sora", bold: true, color: C.accent });
    addShape(s, "roundRect", { left: 678, top: 106, width: 500, height: 485 }, C.ink, "none", 0, { borderRadius: 20 });
    addText(s, "YOUR CAREER READINESS", { left: 710, top: 137, width: 280, height: 18 }, { size: 10, font: "DM Mono", color: C.mist });
    addText(s, "One role. Three questions.", { left: 710, top: 170, width: 370, height: 32 }, { size: 22, font: "Sora", bold: true, color: C.white });
    const questions = [["01", "Which skills are required?", "Role requirements"], ["02", "Where should I learn them?", "Resources & learning"], ["03", "How do I measure readiness?", "Assessments & progress"]];
    questions.forEach(([no, title, desc], i) => {
      const y = 229 + i * 94;
      addShape(s, "roundRect", { left: 710, top: y, width: 56, height: 56 }, "#E7F0EF", "none", 0, { borderRadius: 12 });
      addText(s, no, { left: 710, top: y + 20, width: 56, height: 16 }, { size: 11, font: "DM Mono", color: C.accent, align: "center" });
      addText(s, title, { left: 790, top: y + 6, width: 325, height: 23 }, { size: 15, font: "Sora", bold: true, color: C.white });
      addText(s, desc, { left: 790, top: y + 33, width: 268, height: 16 }, { size: 11, font: "DM Sans", color: C.mist });
    });
    footer(s, 6);
    notes(s, "Explain the readiness challenge: students need to know a role’s required skills, find appropriate learning resources, and assess whether they are ready—but those steps are often separate.");
  }

  // 7 — support and guidance; dark feature-panel tone lifted from the live landing page.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    addShape(s, "roundRect", { left: 58, top: 55, width: 1164, height: 596 }, C.ink, "none", 0, { borderRadius: 22 });
    image(s, skills, { left: 794, top: 83, width: 374, height: 540 }, "Student seeking support and career direction");
    addShape(s, "rect", { left: 764, top: 55, width: 95, height: 596 }, C.ink);
    wordmark(s, 92, 91, true);
    kicker(s, "Challenge 04  /  Career guidance", 92, 172, C.mist);
    addText(s, "Career guidance\nshould be within reach.", { left: 92, top: 210, width: 554, height: 120 }, { size: 43, font: "Sora", bold: true, color: C.white, leading: 0.94 });
    addText(s, "Students often need support from seniors, peers, and professionals to understand career paths and prepare for interviews.", { left: 92, top: 367, width: 536, height: 72 }, { size: 17, font: "DM Sans", color: C.mist });
    addShape(s, "roundRect", { left: 92, top: 505, width: 509, height: 78 }, "#FFFFFF", "#FFFFFF", 1, { borderRadius: 12 });
    addText(s, "THE MISSING PIECE", { left: 113, top: 522, width: 190, height: 15 }, { size: 9, font: "DM Mono", color: C.accent });
    addText(s, "Support, mentorship, resources, and opportunities—together.", { left: 113, top: 547, width: 438, height: 20 }, { size: 13, font: "Sora", bold: true, color: C.ink });
    footer(s, 7, true);
    notes(s, "Explain that students seek direction from seniors and professionals, yet mentorship, resources, networking, and opportunities are not usually centralised.", ["auth-student-login.png"]);
  }

  // 8 — the solution: action-list language taken from CareerForge's product UI.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    wordmark(s);
    kicker(s, "Our response", 72, 120);
    addText(s, "CareerForge brings\nthe pieces together.", { left: 72, top: 160, width: 548, height: 120 }, { size: 50, font: "Sora", bold: true, color: C.ink, leading: 0.94 });
    addText(s, "Not just a place to search for jobs—a connected system that helps students prepare, improve, and move forward.", { left: 72, top: 318, width: 507, height: 78 }, { size: 18, font: "DM Sans", color: C.body });
    miniLabel(s, "ONE CONNECTED WORKSPACE", 72, 479, 224, "pale");
    addText(s, "Less switching between tools. More clarity about the next step.", { left: 72, top: 531, width: 545, height: 48 }, { size: 19, font: "Sora", bold: true, color: C.accent });
    addShape(s, "roundRect", { left: 691, top: 95, width: 500, height: 503 }, C.faded, "#D6E2E4", 1, { borderRadius: 20 });
    addText(s, "YOUR ACTION PLAN", { left: 730, top: 129, width: 238, height: 17 }, { size: 11, font: "DM Mono", color: C.accent });
    addText(s, "The CareerForge journey", { left: 730, top: 160, width: 308, height: 27 }, { size: 20, font: "Sora", bold: true, color: C.ink });
    actionRow(s, 208, "01", "Discover the right roles", "Job sources and matching", "EXPLORE");
    actionRow(s, 300, "02", "Prepare with confidence", "Profile, CV, and skills", "BUILD");
    actionRow(s, 392, "03", "Keep moving forward", "Learning, tracking, community", "READY");
    addText(s, "JOBS  ·  CV  ·  LEARNING  ·  NETWORKING", { left: 730, top: 516, width: 404, height: 16 }, { size: 10, font: "DM Mono", color: C.body, align: "center" });
    footer(s, 8);
    notes(s, "Introduce CareerForge as the all-in-one response: job discovery, matching, CV management, learning paths, assessments, resources, networking, and support in one connected workspace.");
  }

  // 9 — close in the same full-image, product-led hero language.
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    image(s, guidance, { left: 0, top: 0, width: 1280, height: 720 }, "Student confidently working toward her future career");
    addShape(s, "rect", { left: 0, top: 0, width: 790, height: 720 }, C.paper);
    addShape(s, "rect", { left: 690, top: 0, width: 155, height: 720 }, C.paper);
    wordmark(s);
    kicker(s, "Our goal", 72, 131);
    addText(s, "A more organised,\nskill-focused,\nopportunity-driven\ncareer journey.", { left: 72, top: 173, width: 590, height: 235 }, { size: 48, font: "Sora", bold: true, color: C.ink, leading: 0.92 });
    addText(s, "For Bangladeshi students, CareerForge turns uncertainty into a practical next step.", { left: 72, top: 453, width: 487, height: 52 }, { size: 18, font: "DM Sans", color: C.body });
    addShape(s, "roundRect", { left: 72, top: 550, width: 485, height: 70 }, C.ink, "none", 0, { borderRadius: 12 });
    addText(s, "CAREERFORGE IS MORE THAN A JOB PORTAL.", { left: 94, top: 568, width: 360, height: 16 }, { size: 10, font: "DM Mono", color: C.mist });
    addText(s, "It is a student’s digital career companion.", { left: 94, top: 592, width: 411, height: 18 }, { size: 13, font: "Sora", bold: true, color: C.white });
    footer(s, 9);
    notes(s, "Close with the goal: CareerForge should make the career journey of Bangladeshi students organised, skill-focused, and opportunity-driven.", ["auth-admin-career-services.png"]);
  }

  await fs.mkdir(TMP, { recursive: true });
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);
  for (const [index, slide] of deck.slides.items.entries()) {
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(`${TMP}/slide-${String(index + 1).padStart(2, "02")}.png`, new Uint8Array(await png.arrayBuffer()));
  }
  const inspect = await deck.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 30000 });
  await fs.writeFile(`${TMP}/inspect.txt`, inspect.ndjson || String(inspect));
}

build().catch((error) => { console.error(error); process.exitCode = 1; });

import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "F:/AOOP/CareerForge_Motivation_Presentation.pptx";
const TMP = "F:/AOOP/tmp/careerforge_presentation";
const ASSETS = "F:/AOOP/frontend/src/assets";

const C = {
  ink: "#1D2538",
  ink2: "#263353",
  purple: "#5264DD",
  lavender: "#B7C3FF",
  paper: "#FFFDFB",
  cream: "#F5F1E9",
  mist: "#EDF0F8",
  muted: "#667084",
  coral: "#F08D72",
  green: "#339776",
  white: "#FFFFFF",
  line: "#DCE0E8",
};

async function img(path) {
  const b = await fs.readFile(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function shape(slide, geometry, pos, fill = "none", lineFill = "none", lineWidth = 0, extra = {}) {
  return slide.shapes.add({
    geometry,
    position: pos,
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...extra,
  });
}

function text(slide, value, pos, opts = {}) {
  const box = shape(slide, "textbox", pos, opts.fill || "none", "none", 0, { name: opts.name });
  box.text = value;
  box.text.style = {
    fontSize: opts.size || 24,
    color: opts.color || C.ink,
    bold: Boolean(opts.bold),
    fontFace: opts.fontFace || (opts.bold ? "Aptos Display" : "Aptos"),
    alignment: opts.align || "left",
    verticalAlignment: opts.valign || "top",
  };
  return box;
}

function addImage(slide, blob, pos, alt, crop = undefined) {
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt,
    fit: "cover",
    position: pos,
    crop,
    geometry: "roundRect",
    borderRadius: 26,
  });
}

function footer(slide, n, label = "CAREERFORGE") {
  shape(slide, "line", { left: 72, top: 674, width: 1136, height: 0 }, "none", C.line, 1);
  text(slide, label, { left: 72, top: 684, width: 320, height: 22 }, { size: 12, bold: true, color: C.muted });
  text(slide, String(n).padStart(2, "0"), { left: 1150, top: 682, width: 58, height: 24 }, { size: 13, bold: true, color: C.purple, align: "right" });
}

function eyebrow(slide, number, label) {
  text(slide, `${String(number).padStart(2, "0")}  /  ${label.toUpperCase()}`, { left: 72, top: 54, width: 420, height: 24 }, { size: 13, bold: true, color: C.purple });
  shape(slide, "line", { left: 72, top: 88, width: 92, height: 0 }, "none", C.coral, 4);
}

function notes(slide, body, assets = []) {
  const sourceBlock = [
    "[Sources]",
    "- Slide copy: user-provided CareerForge motivation speech.",
    ...assets.map((a) => `- Visual: local project asset ${a}.`),
    "[/Sources]",
  ].join("\n");
  slide.speakerNotes.textFrame.setText(`${body}\n\n${sourceBlock}`);
  slide.speakerNotes.setVisible(true);
}

function addTeamRow(slide, y, name, id) {
  text(slide, name, { left: 188, top: y, width: 470, height: 30 }, { size: 22, bold: true, color: C.ink });
  text(slide, `ID  ${id}`, { left: 700, top: y + 4, width: 265, height: 24 }, { size: 17, color: C.muted, bold: true });
  shape(slide, "line", { left: 188, top: y + 43, width: 777, height: 0 }, "none", C.line, 1);
}

async function makeDeck() {
  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const heroJob = await img(`${ASSETS}/hero-bangladeshi-job-search.png`);
  const heroSuccess = await img(`${ASSETS}/hero-student-success.png`);
  const authLogin = await img(`${ASSETS}/auth-student-login.png`);
  const authRegister = await img(`${ASSETS}/auth-register-student.png`);
  const authAdmin = await img(`${ASSETS}/auth-admin-career-services.png`);

  // 1. Project / APIs
  {
    const s = deck.slides.add();
    s.background.fill = C.cream;
    shape(s, "rect", { left: 0, top: 0, width: 1280, height: 720 }, C.cream);
    addImage(s, heroJob, { left: 714, top: 0, width: 566, height: 720 }, "Bangladeshi student preparing for career opportunities");
    shape(s, "rect", { left: 664, top: 0, width: 230, height: 720 }, { color: C.cream, transparency: 0 });
    // subtle opaque cream band intentionally hides the hard image edge
    shape(s, "rect", { left: 650, top: 0, width: 110, height: 720 }, C.cream);
    text(s, "career", { left: 72, top: 78, width: 215, height: 66 }, { size: 52, bold: true, color: C.ink });
    text(s, "forge", { left: 278, top: 78, width: 180, height: 66 }, { size: 52, bold: true, color: C.purple });
    text(s, "A student career platform", { left: 72, top: 202, width: 590, height: 70 }, { size: 44, bold: true, color: C.ink });
    text(s, "From preparation to opportunity—one connected journey.", { left: 72, top: 358, width: 520, height: 42 }, { size: 20, color: C.muted });
    shape(s, "roundRect", { left: 72, top: 466, width: 522, height: 108 }, C.ink2, "none", 0, { borderRadius: 20 });
    text(s, "API-INTEGRATED PLATFORM", { left: 98, top: 488, width: 390, height: 22 }, { size: 13, bold: true, color: C.lavender });
    text(s, "Jobs • YouTube • Gemini / Groq", { left: 98, top: 520, width: 430, height: 30 }, { size: 22, bold: true, color: C.white });
    text(s, "React  •  Spring Boot REST APIs  •  MySQL", { left: 72, top: 616, width: 528, height: 28 }, { size: 16, bold: true, color: C.muted });
    notes(s, "Opening slide: introduce CareerForge and briefly highlight the external API integrations and technology stack.", ["hero-bangladeshi-job-search.png"]);
  }

  // 2. Team
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    eyebrow(s, 2, "The team behind the idea");
    text(s, "We are ByteBots.", { left: 72, top: 124, width: 575, height: 72 }, { size: 50, bold: true, color: C.ink });
    text(s, "A team focused on turning the student career journey into one clear, useful experience.", { left: 72, top: 210, width: 560, height: 62 }, { size: 21, color: C.muted });
    shape(s, "roundRect", { left: 72, top: 320, width: 82, height: 218 }, C.purple, "none", 0, { borderRadius: 22 });
    text(s, "BYTE\nBOTS", { left: 82, top: 358, width: 64, height: 120 }, { size: 16, bold: true, color: C.white, align: "center", valign: "middle" });
    addTeamRow(s, 320, "Md. All Shahariar Shakib", "0112330360");
    addTeamRow(s, 376, "Sadeed S'aad Zaman Shefin", "0112330362");
    addTeamRow(s, 432, "Md. Imran Iqbal", "0112230138");
    addTeamRow(s, 488, "Md. Mazharul Islam", "0112330700");
    footer(s, 2, "BYTEBOTS  /  CAREERFORGE");
    notes(s, "Introduce the team members before moving into the motivation behind the project.");
  }

  // 3. Core motivation
  {
    const s = deck.slides.add();
    s.background.fill = C.ink;
    addImage(s, heroSuccess, { left: 740, top: 0, width: 540, height: 720 }, "Student looking toward a successful career");
    shape(s, "rect", { left: 670, top: 0, width: 130, height: 720 }, C.ink);
    eyebrow(s, 3, "Our motivation");
    text(s, "Students know they need a job.", { left: 72, top: 148, width: 575, height: 70 }, { size: 42, bold: true, color: C.white });
    text(s, "But many do not know the right way to prepare for it.", { left: 72, top: 234, width: 570, height: 105 }, { size: 42, bold: true, color: C.lavender });
    text(s, "That gap between ambition and preparation is where the career journey becomes difficult.", { left: 72, top: 387, width: 518, height: 86 }, { size: 22, color: "#E8E8F2" });
    text(s, "A better career journey should be clear, connected, and student-centered.", { left: 72, top: 570, width: 560, height: 50 }, { size: 18, bold: true, color: C.coral });
    footer(s, 3);
    notes(s, "Start the motivation: students often know they need a job, yet are unsure how to prepare for one.", ["hero-student-success.png"]);
  }

  // 4. Fragmented job discovery
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    eyebrow(s, 4, "Challenge one");
    text(s, "Opportunity is scattered.", { left: 72, top: 124, width: 630, height: 64 }, { size: 48, bold: true, color: C.ink });
    text(s, "Students search for jobs across many separate places.", { left: 72, top: 205, width: 615, height: 48 }, { size: 23, color: C.muted });
    text(s, "LinkedIn", { left: 76, top: 360, width: 150, height: 36 }, { size: 26, bold: true, color: C.purple });
    text(s, "Facebook groups", { left: 246, top: 360, width: 220, height: 36 }, { size: 26, bold: true, color: C.ink });
    text(s, "Bdjobs", { left: 492, top: 360, width: 125, height: 36 }, { size: 26, bold: true, color: C.purple });
    text(s, "Company websites", { left: 76, top: 423, width: 285, height: 36 }, { size: 26, bold: true, color: C.ink });
    shape(s, "line", { left: 72, top: 321, width: 540, height: 0 }, "none", C.coral, 3);
    text(s, "Result: time is lost—and suitable opportunities can be missed.", { left: 72, top: 520, width: 560, height: 64 }, { size: 28, bold: true, color: C.ink2 });
    addImage(s, authLogin, { left: 790, top: 80, width: 348, height: 545 }, "Student navigating a career search online");
    footer(s, 4);
    notes(s, "Explain that job information is spread across LinkedIn, Facebook groups, Bdjobs, and company websites—making discovery time-consuming.", ["auth-student-login.png"]);
  }

  // 5. Job-specific CV
  {
    const s = deck.slides.add();
    s.background.fill = C.mist;
    eyebrow(s, 5, "Challenge two");
    addImage(s, authRegister, { left: 72, top: 126, width: 392, height: 468 }, "Student preparing for a professional opportunity");
    text(s, "Finding a job\nis only the beginning.", { left: 548, top: 142, width: 590, height: 122 }, { size: 45, bold: true, color: C.ink });
    text(s, "Many students do not know how to adapt their CV for a specific role—or how to show the most relevant skills.", { left: 552, top: 305, width: 550, height: 98 }, { size: 23, color: C.muted });
    shape(s, "line", { left: 552, top: 442, width: 510, height: 0 }, "none", C.coral, 3);
    text(s, "A strong application needs a clear connection between a student’s profile and a job’s requirements.", { left: 552, top: 478, width: 540, height: 90 }, { size: 25, bold: true, color: C.ink2 });
    footer(s, 5);
    notes(s, "Explain the second challenge: after finding a job, students may struggle to make a role-specific CV and present the relevant skills.", ["auth-register-student.png"]);
  }

  // 6. Skills and readiness
  {
    const s = deck.slides.add();
    s.background.fill = C.ink2;
    eyebrow(s, 6, "Challenge three");
    text(s, "“Am I ready\nfor this role?”", { left: 72, top: 132, width: 486, height: 128 }, { size: 48, bold: true, color: C.white });
    text(s, "Students may find a role they want, but still be unsure about the skills it needs, where to learn them, and how to measure their readiness.", { left: 72, top: 315, width: 520, height: 116 }, { size: 22, color: "#E8E8F2" });
    text(s, "Required skills", { left: 716, top: 157, width: 330, height: 35 }, { size: 26, bold: true, color: C.lavender });
    text(s, "Learning resources", { left: 716, top: 280, width: 400, height: 35 }, { size: 26, bold: true, color: C.lavender });
    text(s, "Assessments & progress", { left: 716, top: 403, width: 420, height: 35 }, { size: 26, bold: true, color: C.lavender });
    shape(s, "line", { left: 652, top: 206, width: 416, height: 0 }, "none", C.coral, 3);
    shape(s, "line", { left: 652, top: 329, width: 416, height: 0 }, "none", C.coral, 3);
    shape(s, "line", { left: 652, top: 452, width: 416, height: 0 }, "none", C.coral, 3);
    text(s, "When these are disconnected, preparation becomes harder than it needs to be.", { left: 72, top: 561, width: 665, height: 56 }, { size: 22, bold: true, color: C.coral });
    footer(s, 6);
    notes(s, "Explain the skill-preparation problem: required skills, learning materials, and assessment platforms are separate, so students cannot easily judge readiness.");
  }

  // 7. Guidance and centralization
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    eyebrow(s, 7, "Challenge four");
    text(s, "Career guidance should\nnot be difficult to reach.", { left: 72, top: 128, width: 580, height: 124 }, { size: 44, bold: true, color: C.ink });
    text(s, "Students often need support from seniors and peers to understand career paths, improve their skills, and prepare for interviews.", { left: 72, top: 295, width: 575, height: 100 }, { size: 22, color: C.muted });
    text(s, "But support, mentorship, resources, and opportunities are rarely available in one connected place.", { left: 72, top: 492, width: 575, height: 72 }, { size: 27, bold: true, color: C.ink2 });
    addImage(s, authAdmin, { left: 792, top: 76, width: 352, height: 550 }, "Student accessing career guidance and support");
    footer(s, 7);
    notes(s, "Explain why mentorship, peer support, resources, and opportunities should be accessible through one connected platform.", ["auth-admin-career-services.png"]);
  }

  // 8. Solution
  {
    const s = deck.slides.add();
    s.background.fill = C.cream;
    eyebrow(s, 8, "Our response");
    text(s, "This is why we built CareerForge.", { left: 72, top: 126, width: 990, height: 64 }, { size: 47, bold: true, color: C.ink });
    text(s, "One platform that connects the full student career journey.", { left: 72, top: 208, width: 850, height: 40 }, { size: 22, color: C.muted });
    text(s, "Discover", { left: 94, top: 347, width: 155, height: 36 }, { size: 24, bold: true, color: C.purple });
    text(s, "Prepare", { left: 319, top: 347, width: 155, height: 36 }, { size: 24, bold: true, color: C.ink });
    text(s, "Improve", { left: 540, top: 347, width: 155, height: 36 }, { size: 24, bold: true, color: C.purple });
    text(s, "Connect", { left: 765, top: 347, width: 155, height: 36 }, { size: 24, bold: true, color: C.ink });
    text(s, "Jobs & matching", { left: 94, top: 393, width: 180, height: 30 }, { size: 17, color: C.muted });
    text(s, "CV & applications", { left: 319, top: 393, width: 190, height: 30 }, { size: 17, color: C.muted });
    text(s, "Learning & assessments", { left: 540, top: 393, width: 210, height: 30 }, { size: 17, color: C.muted });
    text(s, "Community & chat", { left: 765, top: 393, width: 180, height: 30 }, { size: 17, color: C.muted });
    shape(s, "line", { left: 88, top: 320, width: 770, height: 0 }, "none", C.purple, 3);
    text(s, "CareerForge brings job discovery, CV management, skill development, assessments, resources, networking, and support together.", { left: 72, top: 524, width: 860, height: 72 }, { size: 25, bold: true, color: C.ink2 });
    footer(s, 8);
    notes(s, "Present CareerForge as the integrated response: job discovery, CV management, learning, assessments, resources, networking, and career support in one place.");
  }

  // 9. Goal / close
  {
    const s = deck.slides.add();
    s.background.fill = C.purple;
    text(s, "career", { left: 72, top: 72, width: 210, height: 58 }, { size: 44, bold: true, color: C.white });
    text(s, "forge", { left: 247, top: 72, width: 160, height: 58 }, { size: 44, bold: true, color: C.lavender });
    text(s, "Our goal", { left: 72, top: 198, width: 250, height: 34 }, { size: 21, bold: true, color: C.lavender });
    text(s, "Make the career journey\nof Bangladeshi students\nmore organized,\nskill-focused, and\nopportunity-driven.", { left: 72, top: 252, width: 780, height: 270 }, { size: 44, bold: true, color: C.white });
    shape(s, "line", { left: 72, top: 566, width: 900, height: 0 }, "none", C.coral, 4);
    text(s, "CareerForge is more than a job portal—it is a student’s digital career companion.", { left: 72, top: 596, width: 900, height: 32 }, { size: 20, bold: true, color: C.paper });
    text(s, "BYTEBOTS", { left: 1050, top: 640, width: 160, height: 26 }, { size: 15, bold: true, color: C.lavender, align: "right" });
    notes(s, "Close with the main goal: make the career journey of Bangladeshi students organized, skill-focused, and opportunity-driven.");
  }

  // Export
  await fs.mkdir(TMP, { recursive: true });
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);
  for (const [i, slide] of deck.slides.items.entries()) {
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(`${TMP}/slide-${String(i + 1).padStart(2, "0")}.png`, new Uint8Array(await png.arrayBuffer()));
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(`${TMP}/montage.webp`, new Uint8Array(await montage.arrayBuffer()));
  const report = await deck.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 30000 });
  await fs.writeFile(`${TMP}/inspect.txt`, report.ndjson || String(report));
}

makeDeck().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

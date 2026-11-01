/**
 * Deterministic Scenario Simulation Engine for NeuroSim Pro
 * Replaces external AI runtime with structured data-driven dialogue branching
 * and transparent 4-dimensional rubric-based evaluation.
 */

export interface DialogueOption {
  id: string;
  label: string;
  text: string;
  intent: 'clarification' | 'boundary' | 'solution' | 'direct' | 'defensive' | 'vague';
  scoreImpact: {
    clarity: number; // -1 to +2
    context: number;
    goal: number;
    boundaries: number;
  };
}

export interface DialogueNode {
  speaker: string;
  speakerRole: string;
  portrait: string;
  replyText: string;
  suggestedOptions?: DialogueOption[];
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  partnerName: string;
  partnerRole: string;
  zone: string;
  targetSkill: string;
  hiddenIntent: string;
  initialDialogue: string;
  defaultGoal: string;
  goals: string[];
  portrait: string;
  hint: string;
  dialogueBranches: {
    keywords: string[];
    reply: string;
    level: 1 | 2 | 3;
    clarityScore: 'perlu dilatih' | 'berkembang' | 'efektif';
    contextScore: 'perlu dilatih' | 'berkembang' | 'efektif';
  }[];
  fallbackReplies: string[];
}

export interface DimensionAssessment {
  tingkat: 'perlu dilatih' | 'berkembang' | 'efektif';
  alasan: string;
}

export interface DeterministicEvaluation {
  kejelasan_pesan: DimensionAssessment;
  pemahaman_konteks: DimensionAssessment;
  ketercapaian_tujuan: DimensionAssessment;
  rasa_hormat_dan_batasan: DimensionAssessment;
  maksud_tersembunyi_karakter: string;
  rekomendasi_level: 'tetap' | 'naik' | 'turun';
  alternatif_respons: {
    versi_ringkas: string;
    versi_rinci: string;
  };
}

export const DETERMINISTIC_SCENARIOS: Record<string, ScenarioDefinition> = {
  'skenario-1': {
    id: 'skenario-1',
    title: 'Klarifikasi Tugas Halaman Beranda',
    partnerName: 'Manajemen Proyek (Bu Rina)',
    partnerRole: 'Project Director & Product Lead',
    zone: 'Ruang Eksekutif & Manajemen',
    targetSkill: 'Mengajukan pertanyaan klarifikasi spesifik & deadline pasti',
    hiddenIntent: 'Tata letak header navigation dan banner atas harus rapi sebelum jam 09.00 WIB untuk direksi.',
    initialDialogue: 'Halaman beranda tolong dirapikan ya. Besok pagi saya lihat.',
    defaultGoal: 'Mendapat kejelasan instruksi spesifik',
    goals: [
      'Mendapat kejelasan instruksi spesifik',
      'Memastikan prioritas tugas dan batas waktu pasti',
      'Menjaga batas kerja tanpa terkesan menolak tugas',
    ],
    portrait: '/assets/characters/office-worker/standing/south.png',
    hint: 'Tanyakan dua hal utama: bagian mana yang spesifik dirapikan (tampilan vs kode) dan jam berapa batas waktu besok pagi.',
    dialogueBranches: [
      {
        keywords: ['jam', 'pukul', 'kapan', 'deadline', 'waktu'],
        reply: 'Jam 09.00 WIB tepat sebelum rapat mingguan direksi. Fokus ke bagian header dan banner atas.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['tampilan', 'kode', 'padding', 'margin', 'header', 'navigasi'],
        reply: 'Tampilan visualnya. Jarak logo dengan menu navigasi terlalu mepet dan banner kurang proporsional di tablet.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['prioritas', 'bagian mana', 'fokus', 'detail', 'rincian'],
        reply: 'Prioritas utama adalah navigation bar dan jarak logo. Selesaikan itu dulu sebelum pukul 09.00 besok.',
        level: 2,
        clarityScore: 'efektif',
        contextScore: 'berkembang',
      },
      {
        keywords: ['siap', 'baik', 'oke', 'langsung kerjakan', 'mengerti'],
        reply: 'Bagus kalau paham, tapi pastikan kamu tahu apa yang harus diperbaiki: bagian header sebelum jam 09.00 pagi.',
        level: 3,
        clarityScore: 'perlu dilatih',
        contextScore: 'perlu dilatih',
      },
    ],
    fallbackReplies: [
      'Tolong fokus pada kerapian header dan logo. Jam 09.00 besok pagi harus sudah siap ditinjau.',
      'Yang paling penting adalah tampilan navigasi atas agar tidak berantakan saat presentasi besok.',
      'Baik, silakan lanjutkan tugasnya dengan fokus pada bagian atas beranda ya.',
    ],
  },
  'skenario-2': {
    id: 'skenario-2',
    title: 'Diskusi Alur Formulir Pendaftaran',
    partnerName: 'Senior Peer (Dimas)',
    partnerRole: 'Senior Staff Engineer',
    zone: 'Pantry & Dapur',
    targetSkill: 'Menanyakan maksud tersirat dan meminta contoh konkret',
    hiddenIntent: 'Formulir pendaftaran memiliki langkah verifikasi yang membingungkan dan tombol simpan tidak responsif.',
    initialDialogue: 'Menarik sih kemarin formulirnya, tapi kayaknya alurnya masih bisa dipikirkan lagi deh.',
    defaultGoal: 'Menanyakan maksud dan meminta contoh konkret',
    goals: [
      'Menanyakan maksud dan meminta contoh konkret',
      'Memahami alasan kritik tanpa bersikap defensif',
      'Mendiskusikan solusi perbaikan alur pengguna',
    ],
    portrait: '/assets/characters/resident/standing/south.png',
    hint: 'Jangan defensif. Tanyakan bagian alur mana yang kurang jelas dan minta contoh interaksi yang lebih mulus.',
    dialogueBranches: [
      {
        keywords: ['contoh', 'bagian mana', 'spesifik', 'langkah', 'step'],
        reply: 'Waktu user klik tombol simpan, loading-nya tidak ada indikator dan langkah verifikasi email muncul tiba-tiba.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['masukan', 'saran', 'revisi', 'perbaikan', 'ide'],
        reply: 'Menurutku tambahkan progress bar kecil dan beri notifikasi transparan saat data tersimpan sebelum pindah layar.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['kenapa', 'mengapa', 'kurang apa', 'salahnya apa'],
        reply: 'Bukan salah kok, cuma alurnya agak membingungkan untuk pengguna baru yang belum paham alur kerja form itu.',
        level: 2,
        clarityScore: 'berkembang',
        contextScore: 'berkembang',
      },
    ],
    fallbackReplies: [
      'Coba cek lagi interaksi tombol simpan dan step verifikasi akunnya ya, di situ letak masalahnya.',
      'Saran saya sederhanakan alur simpan data agar user tidak bingung apakah input mereka sudah masuk.',
      'Secara keseluruhan sudah bagus, tinggal poles alur validasi formulirnya saja.',
    ],
  },
  'skenario-3': {
    id: 'skenario-3',
    title: 'Negosiasi Permintaan Revisi Mendadak',
    partnerName: 'Klien Eksternal (Pak Hendra)',
    partnerRole: 'Client Representative & Product Owner',
    zone: 'Ruang Rapat & Konferensi',
    targetSkill: 'Menetapkan batasan jam kerja & negosiasi tenggat realistis',
    hiddenIntent: 'Klien cemas menghadapi rapat dewan direksi jam 11 siang dan membutuhkan modul laporan inti terpasang.',
    initialDialogue: 'Malam, tolong perombakan fitur laporan diselesaikan malam ini ya. Besok jam 11 siang harus saya bawa ke direksi!',
    defaultGoal: 'Menetapkan batas jam kerja & negosiasi tenggat realistis',
    goals: [
      'Menetapkan batas jam kerja & negosiasi tenggat realistis',
      'Menawarkan alternatif kompromi untuk demo esok hari',
      'Menjaga profesionalisme di bawah tekanan mendadak',
    ],
    portrait: '/assets/characters/courier/standing/south.png',
    hint: 'Validasi kekhawatiran klien, tetapkan batasan jam kerja secara sopan, dan tawarkan bagian laporan esensial untuk demo besok pagi.',
    dialogueBranches: [
      {
        keywords: ['kompromi', 'alternatif', 'bagian inti', 'prioritas', 'demo', 'esensial'],
        reply: 'Ide bagus. Tolong pastikan ringkasan tabel eksekutif dan export PDF-nya selesai dulu. Fitur detailnya bisa menyusul.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['besok pagi', 'pukul 8', 'pukul 9', 'sebelum jam 11', 'pagi'],
        reply: 'Baik, asalkan jam 09.30 pagi besok sudah terpasang di staging agar sempat saya review sebelum rapat jam 11.',
        level: 1,
        clarityScore: 'efektif',
        contextScore: 'efektif',
      },
      {
        keywords: ['jam kerja', 'malam ini', 'di luar jam', 'istirahat', 'kapasitas'],
        reply: 'Saya paham ini mendadak, tapi direksi sangat tegas soal tenggat. Asal besok pagi jam 9 siap, saya setuju kompromi.',
        level: 2,
        clarityScore: 'efektif',
        contextScore: 'berkembang',
      },
    ],
    fallbackReplies: [
      'Tolong amankan bagian ringkasan laporan untuk rapat jam 11 siang besok. Itu yang paling krusial.',
      'Saya hargai konfirmasinya, yang penting besok sebelum jam 10 pagi sudah bisa saya coba demonya.',
      'Terima kasih atas kerja samanya, mari fokus pada modul utama laporan keuangan dulu.',
    ],
  },
};

/**
 * Generate deterministic roleplay reply based on transcript and scenario branching
 */
export function getDeterministicReply(
  scenarioId: string,
  transcript: Array<{ speaker: string; text: string }>,
  level: 1 | 2 | 3 = 2
): string {
  const sc = DETERMINISTIC_SCENARIOS[scenarioId] || DETERMINISTIC_SCENARIOS['skenario-1'];
  if (!transcript || transcript.length === 0) {
    return sc.initialDialogue;
  }

  // Get last user message
  const userMessages = transcript.filter((t) => t.speaker === 'user' || t.speaker === 'Anda');
  const lastUserText = (userMessages[userMessages.length - 1]?.text || '').toLowerCase();

  // Match keyword branches
  for (const branch of sc.dialogueBranches) {
    const isMatched = branch.keywords.some((kw) => lastUserText.includes(kw));
    if (isMatched) {
      return branch.reply;
    }
  }

  // Fallback reply by turn index
  const turnIndex = Math.min(userMessages.length - 1, sc.fallbackReplies.length - 1);
  return sc.fallbackReplies[Math.max(0, turnIndex)] || sc.fallbackReplies[0];
}

/**
 * Deterministic Rubric Evaluation assessing 4 core dimensions
 */
export function evaluateDeterministicSession(
  scenarioId: string,
  userGoal: string,
  transcript: Array<{ speaker: string; text: string }>,
  level: 1 | 2 | 3 = 2
): DeterministicEvaluation {
  const sc = DETERMINISTIC_SCENARIOS[scenarioId] || DETERMINISTIC_SCENARIOS['skenario-1'];
  const userMessages = transcript.filter((t) => t.speaker === 'user' || t.speaker === 'Anda');
  const userTextFull = userMessages.map((m) => m.text.toLowerCase()).join(' ');

  // 1. Kejelasan Pesan (Clarity)
  let clarityLevel: 'perlu dilatih' | 'berkembang' | 'efektif' = 'berkembang';
  let clarityReason = 'Pesan Anda sudah mulai terarah, namun masih dapat ditingkatkan dengan detail spesifik.';
  const hasSpecificQuestions =
    userTextFull.includes('jam') ||
    userTextFull.includes('pukul') ||
    userTextFull.includes('bagian') ||
    userTextFull.includes('contoh') ||
    userTextFull.includes('kapan') ||
    userTextFull.includes('spesifik');

  if (hasSpecificQuestions && userMessages.length >= 2) {
    clarityLevel = 'efektif';
    clarityReason = 'Pesan Anda terstruktur jelas, tidak ambigu, dan secara spesifik menanyakan detail yang dibutuhkan.';
  } else if (userMessages.length <= 1 || userTextFull.length < 20) {
    clarityLevel = 'perlu dilatih';
    clarityReason = 'Pesan terlalu singkat atau belum menyertakan pertanyaan klarifikasi yang konkret.';
  }

  // 2. Pemahaman Konteks (Context Understanding)
  let contextLevel: 'perlu dilatih' | 'berkembang' | 'efektif' = 'berkembang';
  let contextReason = 'Konteks situasi tersirat mulai terbaca dengan baik dalam respons.';
  const hasContextRecognition =
    userTextFull.includes('tampilan') ||
    userTextFull.includes('direksi') ||
    userTextFull.includes('formulir') ||
    userTextFull.includes('header') ||
    userTextFull.includes('rapat') ||
    userTextFull.includes('urgent') ||
    userTextFull.includes('besok');

  if (hasContextRecognition) {
    contextLevel = 'efektif';
    contextReason = 'Anda mampu membaca urgensi dan latar belakang situasi lawan bicara secara tepat.';
  }

  // 3. Ketercapaian Tujuan (Goal Achievement)
  let goalLevel: 'perlu dilatih' | 'berkembang' | 'efektif' = 'berkembang';
  let goalReason = 'Diskusi sudah mendekati sasaran latihan komunikasi yang ditetapkan.';
  if (clarityLevel === 'efektif' && contextLevel === 'efektif') {
    goalLevel = 'efektif';
    goalReason = `Tujuan latihan "${userGoal || sc.defaultGoal}" tercapai secara memuaskan dengan kesepakatan kerja konkret.`;
  } else if (userMessages.length < 2) {
    goalLevel = 'perlu dilatih';
    goalReason = 'Sesi berakhir sebelum kesepakatan kerja spesifik berhasil dicapai.';
  }

  // 4. Rasa Hormat dan Batasan (Respect & Boundaries)
  let boundariesLevel: 'perlu dilatih' | 'berkembang' | 'efektif' = 'efektif';
  let boundariesReason = 'Komunikasi berlangsung sopan, profesional, dan menjaga batas kerja yang sehat.';
  const isTooPassive = userTextFull.includes('terserah') || userTextFull.includes('bebas aja');
  if (isTooPassive) {
    boundariesLevel = 'berkembang';
    boundariesReason = 'Sikap sopan terjaga, namun disarankan lebih proaktif mengusulkan solusi konkret.';
  }

  // Calculate Overall Level Recommendation
  const effectiveCount = [clarityLevel, contextLevel, goalLevel, boundariesLevel].filter((l) => l === 'efektif').length;
  const needsTrainingCount = [clarityLevel, contextLevel, goalLevel, boundariesLevel].filter((l) => l === 'perlu dilatih').length;

  let levelRec: 'tetap' | 'naik' | 'turun' = 'tetap';
  if (effectiveCount >= 3) {
    levelRec = 'naik';
  } else if (needsTrainingCount >= 2) {
    levelRec = 'turun';
  }

  // Alternative Responses
  let altConcise = 'Boleh konfirmasi bagian mana yang paling prioritas dan batas waktunya besok?';
  let altDetailed = 'Supaya pengerjaannya tepat sasaran, boleh saya pastikan prioritas bagian header serta batas waktu jam 09.00 besok pagi?';

  if (scenarioId === 'skenario-2') {
    altConcise = 'Boleh minta contoh langkah yang menurutmu kurang pas di formulir tadi?';
    altDetailed = 'Agar revisinya langsung tepat sasaran, boleh tunjukkan langkah tombol simpan mana yang membingungkan agar saya rapikan?';
  } else if (scenarioId === 'skenario-3') {
    altConcise = 'Malam ini saya amankan ringkasan laporan utamanya, besok pagi jam 09.00 kita rampungkan sebelum rapat.';
    altDetailed = 'Saya memahami urgensi rapat direksi jam 11 besok. Bagaimana jika tabel eksekutifnya saya selesaikan malam ini, lalu fitur pelengkapnya besok pagi pukul 09.00?';
  }

  return {
    kejelasan_pesan: { tingkat: clarityLevel, alasan: clarityReason },
    pemahaman_konteks: { tingkat: contextLevel, alasan: contextReason },
    ketercapaian_tujuan: { tingkat: goalLevel, alasan: goalReason },
    rasa_hormat_dan_batasan: { tingkat: boundariesLevel, alasan: boundariesReason },
    maksud_tersembunyi_karakter: sc.hiddenIntent,
    rekomendasi_level: levelRec,
    alternatif_respons: {
      versi_ringkas: altConcise,
      versi_rinci: altDetailed,
    },
  };
}


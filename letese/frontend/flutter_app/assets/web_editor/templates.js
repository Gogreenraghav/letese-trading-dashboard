/**
 * LETESE● Legal Document Templates
 * Pre-built templates with {{placeholder}} markers highlighted in neon cyan
 * Supports Gurmukhi (Punjabi) / Devanagari (Hindi) / English
 */

window.LEGAL_TEMPLATES = {

  // ─────────────────────────────────────────────────────────────────
  // WRIT PETITION (CWP) — Article 226, High Court
  // ─────────────────────────────────────────────────────────────────
  cwp: `<h1>IN THE HIGH COURT OF PUNJAB AND HARYANA AT CHANDIGARH</h1>
<h2>WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA</h2>
<p style="text-align:center; font-size:13px; color:#7a82a0; margin-bottom:20px;">(Filed under Order VI, Rule 1 of the Original Side Rules)</p>

<h3>IN THE MATTER OF:</h3>
<p><strong>Petitioner:</strong> {{petitioner_name}}, S/D/W {{petitioner_address}}</p>
<p style="margin-top:4px;"><strong>VERSUS</strong></p>
<p><strong>Respondent(s):</strong> {{respondent_name}}, {{respondent_address}}</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>LIST OF DATES AND EVENTS</h3>
<ul>
  <li><span class="placeholder">{{date_1}}</span> — {{event_1}}</li>
  <li><span class="placeholder">{{date_2}}</span> — {{event_2}}</li>
  <li><span class="placeholder">{{date_3}}</span> — {{event_3}}</li>
</ul>

<h3>SYNOPSIS</h3>
<p>{{synopsis_text}}</p>

<h3>FACTS OF THE CASE</h3>
<p>{{facts_text}}</p>

<h3>GROUNDS OF WRIT PETITION</h3>
<ol>
  <li>{{ground_1}}</li>
  <li>{{ground_2}}</li>
  <li>{{ground_3}}</li>
  <li>{{ground_4}}</li>
</ol>

<h3>RELIEF PRAYED</h3>
<p>The Petitioner most respectfully prays that this Hon'ble Court may be pleased to:</p>
<ol>
  <li>{{relief_1}}</li>
  <li>{{relief_2}}</li>
  <li>{{relief_3}}</li>
</ol>

<h3>INTERIM RELIEF PRAYED</h3>
<p>{{interim_relief}}</p>

<h3>GROUNDS FOR URGENT INTERLOCUTORY RELIEF</h3>
<p>{{urgent_grounds}}</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>VERIFICATION</h3>
<p>I, <span class="placeholder">{{petitioner_name}}</span>, S/D/W of <span class="placeholder">{{father_name}}</span>, aged <span class="placeholder">{{age}}</span> years, residing at <span class="placeholder">{{petitioner_address}}</span>, do hereby verify that the contents of paragraphs <span class="placeholder">{{para_nos}}</span> of this Writ Petition are true and correct to the best of my knowledge and belief. Nothing material has been concealed therein.</p>
<p style="margin-top:16px;">Verified at <span class="placeholder">{{verification_place}}</span> on this <span class="placeholder">{{verification_date}}</span> day.</p>
<p style="margin-top:24px;"><strong>{{petitioner_name}}</strong><br/>Petitioner</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>MEMORIUM OF FEES</h3>
<p>Court fee of Rs. <span class="placeholder">{{court_fee}}</span> affixed.</p>`,

  // ─────────────────────────────────────────────────────────────────
  // SLP DRAFT — Supreme Court of India
  // ─────────────────────────────────────────────────────────────────
  slp: `<h1>IN THE SUPREME COURT OF INDIA</h1>
<h2>SPECIAL LEAVE PETITION UNDER ARTICLE 136 OF THE CONSTITUTION OF INDIA</h2>
<p style="text-align:center; font-size:13px; color:#7a82a0; margin-bottom:20px;">(Against the Judgment dated {{judgment_date}} of the {{high_court_name}})</p>

<p><strong>Petitioner:</strong> {{petitioner_name}}, S/D/W {{petitioner_address}}</p>
<p><strong>Through:</strong> {{advocate_name}}, Advocate</p>
<p style="margin-top:8px;"><strong>VERSUS</strong></p>
<p><strong>Respondent:</strong> {{respondent_name}}, {{respondent_address}}</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>MOST RESPECTFULLY SHOWETH:</h3>

<h4>1. facts of the case</h4>
<p>{{facts_text}}</p>

<h4>2. Grounds of Special Leave Petition</h4>
<ol>
  <li>{{ground_1}}</li>
  <li>{{ground_2}}</li>
  <li>{{ground_3}}</li>
  <li>{{ground_4}}</li>
  <li>{{ground_5}}</li>
</ol>

<h4>3. Relief Prayed</h4>
<ol>
  <li>{{relief_1}}</li>
  <li>{{relief_2}}</li>
</ol>

<h4>4. Interim Relief</h4>
<p>{{interim_relief}}</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>CERTIFICATE OF URGENCY</h3>
<p><em>This Special Leave Petition is filed with a prayer for urgent admission and hearing in view of the following:</em></p>
<ol>
  <li>{{urgency_reason_1}}</li>
  <li>{{urgency_reason_2}}</li>
</ol>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>VERIFICATION</h3>
<p>I, <span class="placeholder">{{petitioner_name}}</span>, the Petitioner above-named, do hereby verify that the contents of paragraphs <span class="placeholder">{{para_nos}}</span> are true and correct to the best of my knowledge and no part has been concealed.</p>
<p style="margin-top:16px;">Verified at {{verification_place}} on this {{verification_date}} day.</p>
<p style="margin-top:24px;"><strong>{{petitioner_name}}</strong><br/>Petitioner</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>MEMORANDUM OF FEES</h3>
<p>Court fee of Rs. <span class="placeholder">{{court_fee}}</span> affixed. Payment via demand draft No. <span class="placeholder">{{dd_no}}</span> dated <span class="placeholder">{{dd_date}}</span>.</p>`,

  // ─────────────────────────────────────────────────────────────────
  // PLAINT — Civil Suit (CS)
  // ─────────────────────────────────────────────────────────────────
  plaint: `<h1>IN THE COURT OF THE DISTRICT JUDGE / CIVIL JUDGE</h1>
<h2>AT {{court_location}}</h2>
<h2>SUIT NO. <span class="placeholder">{{suit_no}}</span> OF <span class="placeholder">{{year}}</span></h2>
<p style="text-align:center; font-size:13px; color:#7a82a0; margin-bottom:20px;">Under Order VII of the Code of Civil Procedure, 1908</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>TITLE OF THE SUIT</h3>
<p><strong>Plaintiff:</strong> {{plaintiff_name}}, S/D/W of {{plaintiff_father}}, R/O {{plaintiff_address}}</p>
<p><strong>VERSUS</strong></p>
<p><strong>Defendant No. 1:</strong> {{defendant_1_name}}, S/D/W of {{defendant_1_father}}, R/O {{defendant_1_address}}</p>
<p><strong>Defendant No. 2:</strong> {{defendant_2_name}}, S/D/W of {{defendant_2_father}}, R/O {{defendant_2_address}}</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>PARTIES AND THEIR DESCRIPTION</h3>
<p><strong>Plaintiff:</strong> {{plaintiff_description}}</p>
<p><strong>Defendant No. 1:</strong> {{defendant_1_description}}</p>

<h3>CAUSE OF ACTION</h3>
<p>{{cause_of_action_text}}</p>

<h3>JURISDICTION</h3>
<p>This Hon'ble Court has jurisdiction to try this suit as the cause of action arose at {{cause_of_action_place}} and the Defendant(s) reside/are served within the jurisdiction of this Court.</p>

<h3>FACTS OF THE SUIT</h3>
<p>{{facts_text}}</p>

<h3>RELIEF SOUGHT</h3>
<ol>
  <li>{{relief_1}}</li>
  <li>{{relief_2}}</li>
  <li>{{relief_3}}</li>
</ol>

<h3>VALUATION OF SUIT</h3>
<p><strong>Valuation for purpose of court fees:</strong> Rs. <span class="placeholder">{{valuation_amount}}</span></p>
<p><strong>Valuation for purpose of jurisdiction:</strong> Rs. <span class="placeholder">{{jurisdiction_value}}</span></p>

<h3>DOCUMENTS RELIED UPON</h3>
<ol>
  <li>Document A: {{doc_a_name}} (Mark A)</li>
  <li>Document B: {{doc_b_name}} (Mark B)</li>
  <li>Document C: {{doc_c_name}} (Mark C)</li>
</ol>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>VERIFICATION</h3>
<p>I, <span class="placeholder">{{plaintiff_name}}</span>, the Plaintiff above-named, do hereby verify that the contents of paragraphs <span class="placeholder">{{para_nos}}</span> are true and correct to the best of my knowledge and information, and no part has been concealed.</p>
<p style="margin-top:16px;">Verified at {{verification_place}} on this {{verification_date}} day.</p>
<p style="margin-top:24px;"><strong>{{plaintiff_name}}</strong><br/>Plaintiff</p>`,

  // ─────────────────────────────────────────────────────────────────
  // AFFIDAVIT — General format
  // ─────────────────────────────────────────────────────────────────
  affidavit: `<h1>IN THE <span class="placeholder">{{court_name}}</span></h1>
<h2>AFFIDAVIT</h2>
<p style="text-align:center; font-size:13px; color:#7a82a0; margin-bottom:20px;">(Filed in {{matter_type}} — Case No. <span class="placeholder">{{case_no}}</span>)</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<p><strong>Affidavit of:</strong> <span class="placeholder">{{deponent_name}}</span>, S/D/W of <span class="placeholder">{{deponent_father}}</span>, aged <span class="placeholder">{{age}}</span> years, R/O <span class="placeholder">{{deponent_address}}</span>.</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>PROLOGUE</h3>
<p style="font-style:italic;">I, the above-named Deponent, do hereby solemnly affirm and state on oath as follows:</p>

<h3>1. FACTS STATED</h3>
<p>{{fact_1}}</p>
<p>{{fact_2}}</p>
<p>{{fact_3}}</p>
<p>{{fact_4}}</p>

<h3>2. DOCUMENTS REFERENCED</h3>
<p>The deponent refers to the following documents marked as exhibits:</p>
<ul>
  <li>Exhibit A: {{exhibit_a}}</li>
  <li>Exhibit B: {{exhibit_b}}</li>
  <li>Exhibit C: {{exhibit_c}}</li>
</ul>

<h3>3. PRAYER</h3>
<p>The Deponent humbly submits that this Hon'ble Court may be pleased to:</p>
<ol>
  <li>{{prayer_1}}</li>
  <li>{{prayer_2}}</li>
</ol>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>VERIFICATION</h3>
<p style="font-style:italic;">Solemnly affirmed at <span class="placeholder">{{verification_place}}</span> on this <span class="placeholder">{{verification_date}}</span> day.</p>
<p style="font-style:italic; margin-top:8px;">The contents of paragraphs <span class="placeholder">{{para_nos}}</span> have been read over and explained to the Deponent who has understood the same and confirmed its correctness.</p>
<p style="margin-top:24px;"><strong>{{deponent_name}}</strong><br/>Deponent</p>

<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;" />

<h3>IDENTITY VERIFICATION</h3>
<p>Verified by me, Advocate on record, who has identified the Deponent.</p>
<p style="margin-top:16px;"><strong>{{advocate_name}}</strong><br/>Advocate on Record</p>
<p>Bar Council Enrolment No.: {{bar_enrolment_no}}</p>`,
};
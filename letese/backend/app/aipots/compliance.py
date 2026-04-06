"""
LETESE● AIPOT-COMPLIANCE — Document Validation Engine
Consumes: letese.compliance.checks (async batch)
Responds to: POST /api/v1/compliance/check (sync)
Validates: Word count, mandatory sections, party designations,
           paragraph numbering, court fee.
"""
import re
import spacy
from app.aipots.base import BaseAIPOT

# Load spaCy model (en_core_web_sm — lightweight)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

MANDATORY_SECTIONS = {
    "CWP": ["prayer", "list of dates", "synopsis", "facts", "grounds", "verification"],
    "SLP": ["prayer", "list of dates", "synopsis", "facts", "grounds", "certificate of urgency"],
    "CS": ["plaint", "prayer", "valuation", "cause of action", "limitation"],
    "WP": ["prayer", "facts", "grounds", "verification"],
    "default": ["prayer", "facts", "grounds", "verification"],
}

MIN_WORD_COUNTS = {
    "CWP": 500, "SLP": 800, "CS": 600, "WP": 400, "default": 400
}


class AIPOTCompliance(BaseAIPOT):
    """
    Document compliance validator.
    Kept warm (minimum 1 replica) for fast sync responses.
    Also processes async batch checks via Kafka.
    """
    input_topic = "letese.compliance.checks"

    async def process_message(self, payload: dict):
        result = await self.validate_document(
            document_text=payload["document_text"],
            court_code=payload["court_code"],
            petition_type=payload["petition_type"],
            tenant_id=payload.get("tenant_id"),
        )
        # Store result back to PostgreSQL (async retrieval by client)
        await self._save_compliance_result(payload["doc_id"], result, payload["tenant_id"])

    async def validate_document(
        self,
        document_text: str,
        court_code: str,
        petition_type: str,
        tenant_id: str = None,
    ) -> dict:
        """
        Run full compliance check on a legal document.
        Returns: {passed, failed, warnings, summary}
        """
        passed = []
        failed = []
        warnings = []
        text_lower = document_text.lower()

        # ── CHECK 1: Word Count ─────────────────────────────────────
        word_count = len(document_text.split())
        min_wc = MIN_WORD_COUNTS.get(petition_type, MIN_WORD_COUNTS["default"])
        if word_count >= min_wc:
            passed.append({
                "rule": "word_count",
                "detail": f"{word_count} words (minimum {min_wc})",
            })
        else:
            failed.append({
                "rule": "word_count",
                "severity": "CRITICAL",
                "detail": f"Only {word_count} words. Minimum {min_wc} required.",
                "suggested_fix": f"Expand to at least {min_wc} words.",
            })

        # ── CHECK 2: Mandatory Sections ────────────────────────────
        sections = MANDATORY_SECTIONS.get(
            petition_type, MANDATORY_SECTIONS["default"]
        )
        for section in sections:
            if section in text_lower:
                passed.append({
                    "rule": f"section_{section}",
                    "detail": f"Section '{section.upper()}' found",
                })
            else:
                failed.append({
                    "rule": f"section_{section}",
                    "severity": "CRITICAL",
                    "detail": f"Mandatory section '{section.upper()}' is missing.",
                    "suggested_fix": f"Add a clearly labelled '{section.upper()}' section.",
                })

        # ── CHECK 3: Party Designations ─────────────────────────────
        doc = nlp(document_text[:5000])
        has_petitioner = any(
            t.text.lower() in ("petitioner", "appellant", "complainant")
            for t in doc
        )
        has_respondent = any(
            t.text.lower() in ("respondent", "defendant", "opposite party")
            for t in doc
        )
        if has_petitioner and has_respondent:
            passed.append({
                "rule": "party_designations",
                "detail": "Both parties correctly designated",
            })
        else:
            warnings.append({
                "rule": "party_designations",
                "severity": "WARNING",
                "detail": "Party designations (Petitioner/Respondent) not clearly found.",
            })

        # ── CHECK 4: Paragraph Numbering ───────────────────────────
        numbered = bool(re.search(r"^\s*\d+[\.\)]\s", document_text, re.MULTILINE))
        if numbered:
            passed.append({
                "rule": "paragraph_numbering",
                "detail": "Numbered paragraphs found",
            })
        else:
            warnings.append({
                "rule": "paragraph_numbering",
                "severity": "WARNING",
                "detail": "Paragraphs do not appear to be numbered.",
                "suggested_fix": "Number all paragraphs (1., 2., 3., …)",
            })

        # ── CHECK 5: Court Fee Mentioned ────────────────────────────
        if "court fee" in text_lower or "stamp paper" in text_lower or "court-fee" in text_lower:
            passed.append({"rule": "court_fee", "detail": "Court fee mentioned"})
        else:
            warnings.append({
                "rule": "court_fee",
                "severity": "WARNING",
                "detail": "Court fee not mentioned. Verify filing fee for this petition type.",
            })

        return {
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
            "summary": {
                "total": len(passed) + len(failed) + len(warnings),
                "critical_failures": len(failed),
                "is_filing_ready": len(failed) == 0,
                "word_count": word_count,
            },
        }

    async def _save_compliance_result(self, doc_id: str, result: dict, tenant_id: str):
        """Store compliance result in PostgreSQL."""
        # Implementation: INSERT into compliance_results table
        pass

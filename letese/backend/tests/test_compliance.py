"""
LETESE● AIPOT-COMPLIANCE Agent Tests
Tests document validation logic for mandatory sections, word count,
party designations, and filing-readiness gate.
"""
import pytest
from app.aipots.compliance import AIPOTCompliance


@pytest.fixture
def validator():
    """Instantiate AIPOTCompliance without Kafka/Redis dependencies."""
    return AIPOTCompliance.__new__(AIPOTCompliance)


VALID_CWP = """
IN THE HIGH COURT OF PUNJAB AND HARYANA AT CHANDIGARH

CIVIL WRIT PETITION

PRAYER: Wherefore, it is most respectfully prayed that this Hon'ble Court may be
pleased to issue a writ in the nature of certiorari to quash the impugned order
dated 01.01.2024 passed by the competent authority, and further direct the
respondents to grant the relief as claimed by the petitioner under the law.

LIST OF DATES:
1. 01.01.2024 - Cause of action arose
2. 15.03.2024 - First cause of action
3. 10.06.2024 - Impugned order passed
4. 05.09.2024 - Filing of present petition

SYNOPSIS:
The petitioner challenges the impugned order on the grounds that it is contrary
to the provisions of Articles 14 and 16 of the Constitution of India and is
without jurisdiction and malice in law.

FACTS:
1. That the petitioner is a citizen of India and a resident of Chandigarh.
2. That the petitioner is employed with the State of Punjab and has served for
   over ten years without any disciplinary proceedings.
3. That the impugned order dated 01.01.2024 was passed without following the
   principles of natural justice.
4. That the petitioner had submitted a representation on 01.02.2024 which
   was not considered by the respondents.

GROUNDS:
1. That the action of the respondents is arbitrary and violative of Article 14
   of the Constitution of India.
2. That the principles of natural justice have been violated as no opportunity
   of hearing was provided to the petitioner before passing the impugned order.
3. That the impugned order is motivated by malice in law.

VERIFICATION:
I, the above named deponent, do hereby verify that the contents of paragraphs
1 to 4 of the above statement of facts and paragraphs 1 to 3 of the grounds
are true and correct to the best of my knowledge and belief and nothing
material has been concealed therefrom.

Signed this day of September 2024 at Chandigarh.
"""


@pytest.mark.asyncio
async def test_compliance_passes_valid_cwp(validator):
    """A well-formed CWP with all mandatory sections passes all checks."""
    result = await validator.validate_document(
        document_text=VALID_CWP,
        court_code="PHAHC",
        petition_type="CWP",
    )

    summary = result["summary"]
    assert summary["is_filing_ready"] is True
    assert summary["critical_failures"] == 0
    assert summary["word_count"] >= 500


@pytest.mark.asyncio
async def test_compliance_fails_missing_prayer(validator):
    """Document missing the mandatory PRAYER section must fail."""
    short_text = "This is a short document without proper legal structure. " * 50
    result = await validator.validate_document(
        document_text=short_text,
        court_code="PHAHC",
        petition_type="CWP",
    )

    summary = result["summary"]
    assert summary["critical_failures"] > 0
    # Should fail on: prayer, facts, grounds, verification, word count
    failed_rules = {f["rule"] for f in result["failed"]}
    assert "section_prayer" in failed_rules


@pytest.mark.asyncio
async def test_compliance_fails_word_count(validator):
    """Document below 500 words for CWP must fail word_count check."""
    tiny_text = "Short. " * 30  # ~30 words
    result = await validator.validate_document(
        document_text=tiny_text,
        court_code="PHAHC",
        petition_type="CWP",
    )

    failed_rules = {f["rule"] for f in result["failed"]}
    assert "word_count" in failed_rules


@pytest.mark.asyncio
async def test_compliance_missing_facts_and_grounds(validator):
    """Missing FACTS and GROUNDS must be flagged as CRITICAL."""
    no_substance = (
        "PRAYER: Grant relief. "
        "LIST OF DATES: 01.01.2024. "
        "VERIFICATION: I verify. "
    ) * 80  # enough words but missing sections
    result = await validator.validate_document(
        document_text=no_substance,
        court_code="PHAHC",
        petition_type="CWP",
    )

    failed_rules = {f["rule"] for f in result["failed"]}
    assert "section_facts" in failed_rules
    assert "section_grounds" in failed_rules


@pytest.mark.asyncio
async def test_compliance_warnings_for_unnumbered_paragraphs(validator):
    """Unnumbered paragraphs generate WARNING, not FAIL."""
    unnumbered = ("This is paragraph content. " * 20 + "\n\n") * 10
    result = await validator.validate_document(
        document_text=unnumbered,
        court_code="PHAHC",
        petition_type="CWP",
    )

    warning_rules = {w["rule"] for w in result["warnings"]}
    assert "paragraph_numbering" in warning_rules


@pytest.mark.asyncio
async def test_compliance_slp_min_word_count(validator):
    """SLP has a higher minimum word count (800) than CWP."""
    sarp_text = (
        "PRAYER: The Hon'ble Court may be pleased to grant special leave. "
        "LIST OF DATES: 01.01.2024 - Cause of action arose. "
        "SYNOPSIS: Brief summary of facts. "
        "FACTS: 1. The facts are as stated herein. "
        "GROUNDS: 1. Grounds of special leave petition. "
        "CERTIFICATE OF URGENCY: Certificate attached. "
        "VERIFICATION: I verify. "
    ) * 20  # ~560 words — below SLP minimum of 800

    result = await validator.validate_document(
        document_text=sarp_text,
        court_code="PHAHC",
        petition_type="SLP",
    )

    failed_rules = {f["rule"] for f in result["failed"]}
    assert "word_count" in failed_rules


@pytest.mark.asyncio
async def test_compliance_summary_structure(validator):
    """Summary object always contains expected keys."""
    result = await validator.validate_document(
        document_text=VALID_CWP,
        court_code="PHAHC",
        petition_type="CWP",
    )

    summary = result["summary"]
    assert "total" in summary
    assert "critical_failures" in summary
    assert "is_filing_ready" in summary
    assert "word_count" in summary
    assert isinstance(summary["total"], int)
    assert isinstance(summary["critical_failures"], int)
    assert isinstance(summary["is_filing_ready"], bool)

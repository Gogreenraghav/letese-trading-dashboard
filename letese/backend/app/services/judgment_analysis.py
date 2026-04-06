"""
LETESE● Post-Judgment Remedy Analysis Service
Analyzes court judgments and identifies available remedies.
Enterprise plan feature.
Reference: SYSTEM_MASTER_BLUEPRINT Section 9.5
"""
from app.services.llm_gateway import LLMGateway

REMEDY_SYSTEM_PROMPT = """You are a senior Indian legal analyst. Extract structured data
from Indian court judgments. Return ONLY valid JSON matching this schema:
{
  "court": "court name",
  "case_citation": "full citation",
  "date": "YYYY-MM-DD",
  "bench": "judge names",
  "parties": {"petitioner": "...", "respondent": "..."},
  "result": "ALLOWED|DISMISSED|PARTLY_ALLOWED|INCONCLUSIVE",
  "relief_granted": ["list of reliefs granted"],
  "directions": ["key directions to parties"],
  "key_findings": ["legal findings"],
  "remedies": [
    {
      "remedy_type": "APPEAL|REVIEW|REVISION|CURATIVE|SLP|CONTEMPT",
      "forum": "where to file",
      "limitation_period": "days or specific provision",
      "grounds": ["available grounds"],
      "applicable_provision": "Article/Section"
    }
  ],
  "summary": "200-word plain language summary"
}
"""


class JudgmentAnalysisService:
    """Analyzes judgments and extracts structured remedy information."""

    async def analyze_judgment(
        self, judgment_text: str, case_id: str, tenant_id: str
    ) -> dict:
        """
        Full judgment analysis pipeline.
        1. Call LLM with structured extraction prompt
        2. Find similar precedents via pgvector
        3. Generate plain-language client summary
        4. Store results
        """
        # Step 1: Structured analysis
        analysis = await LLMGateway.complete(
            prompt=f"Analyze this judgment. Return JSON:\n\n{judgment_text}",
            system=REMEDY_SYSTEM_PROMPT,
            task_type="draft",
            max_tokens=4000,
        )

        import json

        try:
            result = json.loads(analysis.text)
        except json.JSONDecodeError:
            result = {
                "error": "LLM did not return valid JSON",
                "raw": analysis.text[:500]
            }

        # Step 2: Generate plain-language client summary
        if "result" in result:
            summary_prompt = (
                f"Your case in {result.get('court', 'court')} was "
                f"{result.get('result')} on {result.get('date', 'recently')}.\n"
                "What does this mean for the client in simple Hindi-English "
                "(legal Hinglish)? Be specific about what happens next and the timeline.\n"
            )
            client_summary = await LLMGateway.complete(
                prompt=summary_prompt,
                system=(
                    "You are a helpful legal assistant explaining case outcomes "
                    "to clients in simple language."
                ),
                task_type="general",
                max_tokens=500,
            )
            result["client_summary"] = client_summary.text

        return result

    async def find_similar_precedents(
        self,
        court_code: str,
        remedy_grounds: str,
        limit: int = 3,
    ) -> list[dict]:
        """
        Find similar precedents via pgvector similarity search.

        Would use:
          SELECT case_citation, summary_text
          FROM case_embeddings
          WHERE court_code = X
          ORDER BY embedding_vector <=> embed(remedy_grounds)
          LIMIT 3

        For now, returns a placeholder until pgvector is set up.
        """
        return [
            {
                "case_citation": "Similar precedents require pgvector setup",
                "summary_text": "Will be populated after DB setup",
            }
        ]

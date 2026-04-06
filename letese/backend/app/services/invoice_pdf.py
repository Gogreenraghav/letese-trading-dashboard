"""
LETESE● Invoice PDF Generator using WeasyPrint
Generates professional legal firm invoices with LETESE● branding.
"""
from datetime import date
from pathlib import Path

import weasyprint
import boto3

from app.core.config import settings

INVOICE_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #1a1a2e; padding: 40px; }
  
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #1A4FBF; padding-bottom: 20px; }
  .firm-name { font-size: 28px; font-weight: 700; color: #1A4FBF; }
  .firm-dot { color: #22C55E; }
  .firm-tagline { font-size: 12px; color: #666; margin-top: 4px; }
  .invoice-label { text-align: right; }
  .invoice-label h2 { color: #1A4FBF; font-size: 20px; }
  
  .meta { display: flex; justify-content: space-between; margin: 30px 0; }
  .meta-block { width: 48%; }
  .meta-block h4 { color: #1A4FBF; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; }
  .meta-block p { font-size: 13px; line-height: 1.8; }
  
  .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
  .items-table th { background: #1A4FBF; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
  .items-table th:last-child { text-align: right; }
  .items-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .items-table td:last-child { text-align: right; }
  .items-table tr:nth-child(even) { background: #f9fafb; }
  
  .totals { margin-left: auto; width: 300px; }
  .totals table { width: 100%; }
  .totals td { padding: 8px 0; font-size: 13px; }
  .totals td:last-child { text-align: right; }
  .totals .grand-total td { font-weight: 700; font-size: 16px; color: #1A4FBF; border-top: 2px solid #1A4FBF; padding-top: 10px; }
  
  .payment-info { background: #f0f9ff; border: 1px solid #1A4FBF; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .payment-info h4 { color: #1A4FBF; margin-bottom: 8px; }
  .payment-info p { font-size: 13px; color: #374151; }
  .payment-link { color: #1A4FBF; font-weight: 600; }
  
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
    font-size: 80px; color: rgba(26,79,191,0.04); pointer-events: none; z-index: -1; }
  
  .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; }
  .footer p { margin: 4px 0; }
</style>
</head>
<body>
<div class="watermark">LETESE</div>

<div class="header">
  <div>
    <div class="firm-name">LETESE<span class="firm-dot">●</span></div>
    <div class="firm-tagline">Legal Practice Management | letese.xyz | info@letese.xyz</div>
  </div>
  <div class="invoice-label">
    <h2>INVOICE</h2>
    <p>{{invoice_number}}</p>
    <p>Date: {{issue_date}}</p>
    <p>Due: {{due_date}}</p>
  </div>
</div>

<div class="meta">
  <div class="meta-block">
    <h4>Bill To</h4>
    <p><strong>{{client_name}}</strong></p>
    <p>{{client_gstin}}</p>
  </div>
  <div class="meta-block">
    <h4>From</h4>
    <p><strong>LETESE● Legal Technologies Pvt. Ltd.</strong></p>
    <p>info@letese.xyz</p>
    <p>GSTIN: 03AAACL1234C1Z5</p>
  </div>
</div>

<table class="items-table">
  <thead>
    <tr><th>Description</th><th>Amount (₹)</th></tr>
  </thead>
  <tbody>
    {{line_items_html}}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Subtotal</td><td>₹ {{subtotal_inr}}</td></tr>
    <tr><td>GST ({{gst_pct}}%)</td><td>₹ {{gst_inr}}</td></tr>
    <tr class="grand-total"><td>Total Due</td><td>₹ {{total_inr}}</td></tr>
    <tr><td>Already Paid</td><td>₹ {{paid_inr}}</td></tr>
    <tr class="grand-total"><td>Balance Due</td><td>₹ {{balance_due}}</td></tr>
  </table>
</div>

<div class="payment-info">
  <h4>Payment Instructions</h4>
  <p>Pay via UPI/Net Banking/Razorpay: <span class="payment-link">{{payment_link}}</span></p>
  <p>UPI ID: letese@razorpay | Account: LETESE Legal Technologies Pvt. Ltd. | A/C: 1234567890 | IFSC: HDCB0001234</p>
</div>

<div class="footer">
  <p>This is a computer-generated invoice. No signature required.</p>
  <p>LETESE● Legal Technologies Pvt. Ltd. | www.letese.xyz | support@letese.xyz | GSTIN: 03AAACL1234C1Z5</p>
</div>
</body>
</html>
"""


class InvoicePDFService:
    def __init__(self):
        self.s3_bucket = settings.AWS_S3_BUCKET_DOCS
        self.region = settings.AWS_REGION

    def generate(self, invoice_data: dict) -> bytes:
        """Generate PDF from invoice data dict."""
        html = INVOICE_HTML_TEMPLATE

        # Build line items HTML
        line_items_html = ""
        for item in invoice_data.get("line_items", []):
            line_items_html += (
                f"<tr><td>{item['description']}</td>"
                f"<td>₹ {item['amount_inr']:,.2f}</td></tr>\n"
            )

        # Replace placeholders
        total_inr = invoice_data.get("total_inr", 0)
        paid_inr = invoice_data.get("paid_inr", 0)
        balance_due = total_inr - paid_inr

        replacements = {
            "{{invoice_number}}": invoice_data.get("invoice_number", ""),
            "{{issue_date}}": invoice_data.get("issue_date", ""),
            "{{due_date}}": invoice_data.get("due_date", ""),
            "{{client_name}}": invoice_data.get("client_name", ""),
            "{{client_gstin}}": invoice_data.get("client_gstin", "") or "",
            "{{line_items_html}}": line_items_html,
            "{{subtotal_inr}}": f"{invoice_data.get('subtotal_inr', 0):,.2f}",
            "{{gst_pct}}": invoice_data.get("gst_pct", 18),
            "{{gst_inr}}": f"{invoice_data.get('gst_inr', 0):,.2f}",
            "{{total_inr}}": f"{total_inr:,.2f}",
            "{{paid_inr}}": f"{paid_inr:,.2f}",
            "{{balance_due}}": f"{balance_due:,.2f}",
            "{{payment_link}}": invoice_data.get("payment_link", "N/A"),
        }

        for placeholder, value in replacements.items():
            html = html.replace(placeholder, str(value))

        pdf = weasyprint.HTML(string=html).write_pdf()
        return pdf

    async def generate_and_upload(self, invoice_data: dict, s3_key: str) -> str:
        """Generate PDF and upload to S3. Returns S3 URL or local fallback path."""
        pdf_bytes = self.generate(invoice_data)

        try:
            s3 = boto3.client("s3", region_name=self.region)
            s3.put_object(
                Bucket=self.s3_bucket,
                Key=s3_key,
                Body=pdf_bytes,
                ContentType="application/pdf",
            )
            url = f"https://{self.s3_bucket}.s3.{self.region}.amazonaws.com/{s3_key}"
            return url
        except Exception:
            # Dev fallback: save locally
            filename = s3_key.split("/")[-1]
            Path(f"/tmp/{filename}").write_bytes(pdf_bytes)
            return f"/tmp/{filename}"

    def generate_presigned_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate a presigned S3 URL for downloading the PDF."""
        try:
            s3 = boto3.client("s3", region_name=self.region)
            url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.s3_bucket, "Key": s3_key},
                ExpiresIn=expires_in,
            )
            return url
        except Exception:
            return s3_key  # fallback to raw key

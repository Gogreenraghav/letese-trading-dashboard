import os
from PIL import Image, ImageDraw, ImageFont

W, H = 400, 866
RADIUS = 44

def get_font(size, bold=False):
    try:
        path = f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'B' if bold else ''}.ttf"
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0+radius, y0, x1-radius, y1], fill=fill)
    draw.rectangle([x0, y0+radius, x1, y1-radius], fill=fill)
    draw.ellipse([x0, y0, x0+2*radius, y0+2*radius], fill=fill)
    draw.ellipse([x1-2*radius, y0, x1, y0+2*radius], fill=fill)
    draw.ellipse([x0, y1-2*radius, x0+2*radius, y1], fill=fill)
    draw.ellipse([x1-2*radius, y1-2*radius, x1, y1], fill=fill)

def draw_bg_gradient(draw, h, top_color, bot_color):
    for i in range(h):
        ratio = i / h
        r = int(top_color[0] + (bot_color[0]-top_color[0])*ratio)
        g = int(top_color[1] + (bot_color[1]-top_color[1])*ratio)
        b = int(top_color[2] + (bot_color[2]-top_color[2])*ratio)
        draw.line([(0, i), (W, i)], fill=(r, g, b))

# ─── SCREEN 1: Login ─────────────────────────────────────────────────────────
def screen_login():
    canvas = Image.new("RGB", (W, H), (10, 12, 20))
    draw = ImageDraw.Draw(canvas)
    draw_bg_gradient(draw, H, (6, 8, 16), (20, 22, 40))

    # Logo circle
    draw.ellipse([220, 60, 400, 240], fill=(20, 24, 45))
    cx, cy = 200, 155
    for i in range(3):
        r = 38 + i*16
        alpha_v = 180 - i*50
        draw.arc([cx-r, cy-r, cx+r, cy+r], 30, 150, fill=(100, 150, 255), width=3)
    draw.text((160, 90), "L", font=get_font(72, bold=True), fill=(100, 160, 255))

    draw.text((145, 252), "LETESE", font=get_font(40, bold=True), fill=(255,255,255))
    draw.text((148, 302), "Advocate Suite", font=get_font(16), fill=(120,140,200))
    draw.text((158, 326), "वकीलों के लिए AI", font=get_font(13), fill=(90,110,180))

    draw.line([50, 366, 350, 366], fill=(40,45,70))

    rounded_rect(draw, (28, 394, 372, 456), 12, (22, 24, 35))
    draw.text((44, 408), "  advocate@email.com", font=get_font(15), fill=(80,90,120))

    rounded_rect(draw, (28, 470, 372, 532), 12, (22, 24, 35))
    draw.text((44, 484), "  ••••••••••••••", font=get_font(15), fill=(80,90,120))

    rounded_rect(draw, (28, 550, 372, 612), 12, (80, 130, 255))
    draw.text((158, 562), "Login", font=get_font(17, bold=True), fill=(255,255,255))

    draw.line([50, 642, 170, 642], fill=(40,45,70))
    draw.text((185, 630), "or", font=get_font(12), fill=(80,90,120))
    draw.line([230, 642, 350, 642], fill=(40,45,70))

    rounded_rect(draw, (28, 660, 372, 722), 12, (28, 30, 42))
    draw.text((128, 674), "Continue with Google", font=get_font(14), fill=(180,190,220))

    draw.text((108, 760), "Don't have an account?", font=get_font(13), fill=(90,110,160))
    draw.text((228, 760), "Register", font=get_font(13, bold=True), fill=(100,160,255))

    return canvas

# ─── SCREEN 2: Dashboard ──────────────────────────────────────────────────────
def screen_dashboard():
    canvas = Image.new("RGB", (W, H), (10, 11, 18))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, W, 56], fill=(14, 15, 24))
    draw.text((20, 16), "Namaste, Advocate 👋", font=get_font(22, bold=True), fill=(255,255,255))
    draw.ellipse([348, 16, 376, 44], fill=(40,42,60))
    draw.text((354, 18), "🔔", font=get_font(14))

    statuses = [("🔴 Live", (220,30,30)), ("🟡 Pending", (200,170,30)), ("🟢 Done", (30,180,80))]
    x = 20
    for lbl, col in statuses:
        rounded_rect(draw, (x, 72, x+96, 104), 10, (25,26,36))
        draw.text((x+10, 78), lbl, font=get_font(12), fill=(200,200,220))
        x += 106

    # Today's case card
    cy = 116
    rounded_rect(draw, (16, cy, 384, cy+130), 18, (20, 22, 34))
    draw.rectangle([16, cy, 20, cy+130], fill=(80,130,255))
    draw.text((32, cy+14), "📅 Today's Hearing", font=get_font(17, bold=True), fill=(255,255,255))
    draw.text((32, cy+44), "S.C.Jain vs State of Punjab", font=get_font(14), fill=(180,190,220))
    draw.text((32, cy+66), "Case No: SC-2024-00412", font=get_font(12), fill=(120,130,170))
    draw.text((32, cy+88), "⏰ 10:30 AM — P&H High Court", font=get_font(13), fill=(140,155,200))
    draw.rectangle([32, cy+116, 360, cy+122], fill=(35,37,52))
    draw.rectangle([32, cy+116, 200, cy+122], fill=(80,130,255))
    draw.text((32, cy+100), "Case Progress: 68%", font=get_font(11), fill=(100,110,150))

    draw.text((20, 262), "Quick Actions", font=get_font(17, bold=True), fill=(255,255,255))

    actions = [("📝", "New Case", (60,45,100)), ("🤖", "AI Draft", (40,40,80)), ("🔍", "Search", (50,35,70)), ("📋", "Tasks", (45,38,85))]
    ax = 20
    for icon, label, col in actions:
        rounded_rect(draw, (ax, 290, ax+82, 382), 16, (20,22,34))
        draw.ellipse([ax+23, 306, ax+59, 342], fill=col)
        draw.text((ax+22, 312), icon, font=get_font(26))
        draw.text((ax+12, 356), label, font=get_font(12), fill=(180,190,220))
        ax += 92

    # AIPOT feed
    ay = 402
    rounded_rect(draw, (16, ay, 384, ay+180), 18, (20,22,34))
    draw.text((32, ay+12), "⚡ AIPOT Live Feed", font=get_font(17, bold=True), fill=(255,255,255))
    rounded_rect(draw, (268, ay+10, 376, ay+42), 10, (255,30,30))
    draw.text((276, ay+16), "● LIVE", font=get_font(11, bold=True), fill=(255,255,255))

    judgments = [
        ("P&H HC", "Rakesh Kumar vs State", "IPC 420", "10:22 AM"),
        ("Delhi HC", "Mehta vs Union of India", "Article 226", "10:05 AM"),
        ("SC", "State vs Confederation", "Civil Appeal", "09:48 AM"),
    ]
    jy = ay + 52
    for court, case, section, time in judgments:
        rounded_rect(draw, (24, jy, 376, jy+40), 8, (28,30,44))
        draw.text((36, jy+4), f"{court}  {time}", font=get_font(10, bold=True), fill=(80,130,255))
        draw.text((36, jy+18), case, font=get_font(12), fill=(180,190,220))
        draw.text((286, jy+18), section, font=get_font(11), fill=(120,140,200))
        jy += 44

    # Bottom nav
    ny = H - 90
    draw.rectangle([0, ny, W, H], fill=(12,13,20))
    nav_items = [("🏠", "Home", True), ("📁", "Cases", False), ("🤖", "AI", False), ("💬", "Chat", False), ("👤", "Profile", False)]
    nx = 20
    for icon, lbl, active in nav_items:
        col = (100, 160, 255) if active else (80, 90, 120)
        if active:
            draw.ellipse([nx+16, ny-4, nx+44, ny-2], fill=(100,160,255))
        draw.text((nx+10, ny+8), icon, font=get_font(22))
        draw.text((nx+2, ny+50), lbl, font=get_font(11), fill=col)
        nx += 76

    return canvas

# ─── SCREEN 3: Case Chat / AI Draft ──────────────────────────────────────────
def screen_case_chat():
    canvas = Image.new("RGB", (W, H), (10, 11, 18))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, W, 56], fill=(14, 15, 24))
    draw.text((20, 16), "←", font=get_font(20), fill=(180,190,220))
    draw.text((46, 14), "Case #SC-2024-00412", font=get_font(16, bold=True), fill=(255,255,255))
    draw.text((20, 36), "Rakesh Kumar vs State of Punjab", font=get_font(12), fill=(120,130,170))
    draw.ellipse([344, 18, 374, 48], fill=(40,42,60))
    draw.text((352, 22), "⋮", font=get_font(18), fill=(180,190,220))

    draw.rectangle([0, 56, W, 92], fill=(18,19,30))
    draw.text((20, 62), "📂 IPC 420", font=get_font(12), fill=(150,160,200))
    draw.text((110, 62), "⚖️ P&H HC", font=get_font(12), fill=(150,160,200))
    draw.text((195, 62), "📅 Jul 2024", font=get_font(12), fill=(150,160,200))
    draw.text((275, 62), "💰 ₹50K", font=get_font(12), fill=(150,160,200))

    rounded_rect(draw, (70, 100, 372, 172), 16, (80,130,255))
    draw.text((82, 110), "Draft a reply to the opposite", font=get_font(13), fill=(255,255,255))
    draw.text((82, 130), "party's application filed on", font=get_font(13), fill=(255,255,255))
    draw.text((82, 150), "15th July under Section 5...", font=get_font(13), fill=(255,255,255))

    ay = 184
    rounded_rect(draw, (20, ay, 330, ay+210), 16, (24,26,40))
    draw.text((32, ay+10), "🤖 Letese AI", font=get_font(12, bold=True), fill=(100,160,255))
    draw.rectangle([32, ay+34, 312, ay+36], fill=(35,37,55))

    draft_lines = [
        "IN THE HIGH COURT OF PUNJAB & HARYANA",
        "Case No: SC-2024-00412",
        "",
        "I, Advocate Rajesh Sharma, appearing for",
        "the applicant, most respectfully state:",
        "",
        "1. That the application filed by the",
        "respondent under Section 5 of the",
        "Limitation Act deserves to be dismissed...",
    ]
    ly = ay + 44
    for line in draft_lines:
        draw.text((32, ly), line, font=get_font(11), fill=(170,180,210))
        ly += 15

    # Typing indicator
    draw.text((32, ay+196), "Typing", font=get_font(11), fill=(90,100,140))
    for i, bx in enumerate([74, 88, 102]):
        draw.ellipse([bx, ay+198, bx+6, ay+204], fill=(100,160,255))

    # Input area
    iy = H - 110
    draw.rectangle([0, iy, W, H], fill=(12,13,20))
    rounded_rect(draw, (16, iy+10, 310, iy+60), 22, (22,24,38))
    draw.text((28, iy+22), "Ask or draft something...", font=get_font(14), fill=(100,110,140))
    draw.ellipse([318, iy+12, 346, iy+40], fill=(35,37,55))
    draw.text((324, iy+16), "🎤", font=get_font(16))
    draw.ellipse([350, iy+12, 382, iy+40], fill=(80,130,255))
    draw.text((358, iy+16), "➤", font=get_font(16), fill=(255,255,255))

    return canvas

# ─── SCREEN 4: AIPOT Live Feed ────────────────────────────────────────────────
def screen_aipot():
    canvas = Image.new("RGB", (W, H), (10, 11, 18))
    draw = ImageDraw.Draw(canvas)

    # Glow effect
    for i in range(70, 0, -1):
        intensity = 1 - i/70
        draw.ellipse([200-i*3, 80-i, 200+i*3, 80+i],
                     fill=(int(100+intensity*60), int(130+intensity*50), 255))

    draw.rectangle([0, 0, W, 110], fill=(14, 15, 28))
    draw.text((20, 16), "⚡ AIPOT Live Feed", font=get_font(24, bold=True), fill=(255,255,255))
    draw.text((20, 48), "Auto-scraped judgments from Indian courts", font=get_font(13), fill=(120,140,200))
    rounded_rect(draw, (278, 18, 376, 48), 12, (255,30,30))
    draw.text((292, 24), "● LIVE", font=get_font(13, bold=True), fill=(255,255,255))

    stats = [("1,24,680", "Judgments"), ("847", "Today"), ("42", "This Hour")]
    sx = 20
    for val, lbl in stats:
        rounded_rect(draw, (sx, 122, sx+118, 190), 14, (20,22,34))
        draw.text((sx+10, 132), val, font=get_font(20, bold=True), fill=(100,160,255))
        draw.text((sx+10, 162), lbl, font=get_font(12), fill=(120,130,170))
        sx += 126

    filters = ["All", "Supreme Court", "High Court", "Tribunal"]
    fx = 20
    for f in filters:
        active = (f == "All")
        fc = (80,130,255) if active else (30,32,48)
        rounded_rect(draw, (fx, 204, fx+78, 238), 10, fc)
        draw.text((fx+12, 210), f, font=get_font(13), fill=(255 if active else 150))
        fx += 86

    judgments = [
        ("🏛️ Supreme Court", "CA 2345/2024", "M/s XYZ Ltd vs ABC Corp", "Constitutional validity...", "30 Jul"),
        ("⚖️ P&H High Court", "CR 4891/2024", "Kishore Lal vs State", "IPC 420, 467, 471", "30 Jul"),
        ("⚖️ Delhi HC", "WP 1842/2024", "Advocate Ram Singh vs Union", "Art. 226, Service Law", "29 Jul"),
        ("🏛️ Supreme Court", "SLP 11880/2024", "State of UP vs Federation", "Land Acquisition Act", "29 Jul"),
        ("⚖️ Bombay HC", "ARB.A. 203/2024", "Smith Realty vs Metro", "Arbitration Act s.11", "28 Jul"),
    ]

    jy = 252
    for court_type, case_no, parties, section, date in judgments:
        col = (100,160,255) if "Supreme" in court_type else (80,100,200)
        rounded_rect(draw, (16, jy, 384, jy+80), 14, (20,22,36))
        draw.rectangle([16, jy, 20, jy+80], fill=col)
        draw.text((28, jy+6), court_type, font=get_font(11, bold=True), fill=col)
        draw.text((28, jy+24), case_no, font=get_font(13, bold=True), fill=(200,210,230))
        draw.text((28, jy+42), parties, font=get_font(11), fill=(140,150,180))
        draw.text((28, jy+58), f"{section}  •  {date}", font=get_font(10), fill=(100,110,150))
        draw.text((348, jy+6), "🔖", font=get_font(14))
        jy += 88
        if jy > H - 130:
            break

    return canvas

# ─── SCREEN 5: Profile ───────────────────────────────────────────────────────
def screen_profile():
    canvas = Image.new("RGB", (W, H), (10, 11, 18))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, W, 200], fill=(14,15,28))
    draw.ellipse([140, 30, 260, 150], fill=(40,50,80))
    draw.ellipse([148, 38, 252, 142], fill=(60,70,110))
    draw.text((168, 65), "AS", font=get_font(40, bold=True), fill=(100,160,255))
    draw.ellipse([224, 110, 248, 134], fill=(80,130,255))
    draw.text((228, 112), "✏️", font=get_font(12))
    draw.text((145, 160), "Arjun Singh", font=get_font(22, bold=True), fill=(255,255,255))
    draw.text((130, 188), "Advocate • Enrolled 2018", font=get_font(13), fill=(120,140,200))

    prof_stats = [("247", "Cases"), ("1.2K", "Hearings"), ("98%", "Win Rate"), ("₹48L", "Revenue")]
    sx = 20
    for val, lbl in prof_stats:
        rounded_rect(draw, (sx, 210, sx+85, 272), 12, (20,22,34))
        draw.text((sx+16, 218), val, font=get_font(18, bold=True), fill=(100,160,255))
        draw.text((sx+8, 244), lbl, font=get_font(11), fill=(120,130,170))
        sx += 93

    menus = [
        ("⚙️", "Settings", "App preferences, notifications", True),
        ("🔒", "Security", "Password, 2FA, PIN", True),
        ("💳", "Billing", "Plan: Pro • Renewal: Dec 2024", True),
        ("👥", "Team", "3 members • Manage RBAC", True),
        ("📱", "Linked Accounts", "Google, WhatsApp Business", True),
        ("📊", "Analytics", "Usage & performance", True),
        ("🆘", "Help & Support", "FAQ, Chat with us", True),
        ("📤", "Logout", "", False),
    ]

    my = 286
    for icon, label, detail, show_arrow in menus:
        menu_h = 50
        rounded_rect(draw, (16, my, 384, my+menu_h), 12, (20,22,34))
        draw.text((30, my+12), icon, font=get_font(18))
        draw.text((60, my+8), label, font=get_font(15, bold=True), fill=(200,210,230))
        if detail:
            draw.text((60, my+28), detail, font=get_font(11), fill=(100,110,140))
        if show_arrow:
            draw.text((348, my+14), "›", font=get_font(18), fill=(80,90,120))
        my += menu_h + 8

    return canvas

# Generate all
os.makedirs("/root/clawd/mockups", exist_ok=True)
screens = [
    ("1_login.png", screen_login, "🔐 Login / Register"),
    ("2_dashboard.png", screen_dashboard, "🏠 Dashboard"),
    ("3_case_chat.png", screen_case_chat, "💬 AI Case Drafting"),
    ("4_aipot_feed.png", screen_aipot, "⚡ AIPOT Live Feed"),
    ("5_profile.png", screen_profile, "👤 Profile & Settings"),
]

for fname, fn, desc in screens:
    img = fn()
    img.save(f"/root/clawd/mockups/{fname}")
    print(f"✅ {fname} — {desc}")

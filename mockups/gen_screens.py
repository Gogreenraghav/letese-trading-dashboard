"""
LETESE — Premium Mobile App Screens v2
Classic, Clean, Professional Design
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 430, 932

def font(sz, bold=False):
    paths = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'B' if bold else ''}.ttf",
        f"/usr/share/fonts/truetype/liberation/LiberationSans{'Bold' if bold else 'Regular'}.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, sz)
        except:
            pass
    return ImageFont.load_default()

def rr(img, x0,y0,x1,y1, r, fill=None, outline=None, width=1):
    d = ImageDraw.Draw(img)
    def rnd(xa,ya,xb,yb):
        d.ellipse([xa,ya,xb,yb], fill=fill)
        d.rectangle([xa+r,ya,xb-r,yb], fill=fill)
        d.rectangle([xa,ya+r,xb,yb-r], fill=fill)
    if fill:
        d.rectangle([x0+r,y0,x1-r,y1], fill=fill)
        d.rectangle([x0,y0+r,x1,y1-r], fill=fill)
        d.ellipse([x0,y0,x0+2*r,y0+2*r], fill=fill)
        d.ellipse([x1-2*r,y0,x1,y0+2*r], fill=fill)
        d.ellipse([x0,y1-2*r,x0+2*r,y1], fill=fill)
        d.ellipse([x1-2*r,y1-2*r,x1,y1], fill=fill)
    if outline:
        d.rounded_rectangle([x0,y0,x1,y1], r, outline=outline, width=width)

def glow(img, cx, cy, r, col):
    d = ImageDraw.Draw(img)
    for i in range(r, 0, -1):
        a = int(60 * (1 - i/r))
        cr = min(255, col[0] + a//3)
        cg = min(255, col[1] + a//3)
        cb = min(255, col[2] + a//4)
        d.ellipse([cx-i, cy-i, cx+i, cy+i], fill=(cr,cg,cb))

def bg_gradient(img, top, bot):
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y/H
        r_ = int(top[0] + (bot[0]-top[0])*t)
        g_ = int(top[1] + (bot[1]-top[1])*t)
        b_ = int(top[2] + (bot[2]-top[2])*t)
        d.line([(0,y),(W,y)], fill=(r_,g_,b_))

def card(img, x0,y0,x1,y1, r=18, bg=(22,22,34,230), border=(50,60,90)):
    c = Image.new("RGBA", (x1-x0, y1-y0), bg)
    rr(c, 0,0,x1-x0,y1-y0, r, fill=bg)
    if border:
        rr(c, 0,0,x1-x0,y1-y0, r, outline=border, width=1)
    img.paste(c, (x0,y0), c)

def nav_bar(img):
    y = H - 96
    d = ImageDraw.Draw(img)
    d.rectangle([0,y,W,H], fill=(10,11,22))
    items = [("🏠","Home",True),("📁","Cases",False),("🤖","AI",False),("💬","Chat",False),("👤","Profile",False)]
    nx = 20
    for ico,lbl,on in items:
        col = (70,130,255) if on else (70,75,100)
        if on:
            d.ellipse([nx+14,y-6,nx+48,y-2], fill=(70,130,255))
        d.text((nx+10,y+10), ico, font=font(22), fill=(255,255,255))
        d.text((nx+2,y+54), lbl, font=font(11), fill=col)
        nx += 82

# ═══════════════════════════════════════════════════════
# 1. LOGIN SCREEN
# ═══════════════════════════════════════════════════════
def screen_login():
    img = Image.new("RGB", (W,H), (8,10,20))
    bg_gradient(img, (4,6,14), (12,16,30))
    d = ImageDraw.Draw(img)

    # Decorative glows
    glow(img, W//2, 90, 90, (50,80,200))
    glow(img, 60, H-80, 60, (30,20,80))

    # Logo: LETESE with green dot under last E
    lf = font(56, bold=True)
    logo = "LETESE"
    lw_total = 230  # approximate

    # Draw letter by letter
    letters = list(logo)
    spacing = lw_total // len(letters)
    x_start = W//2 - lw_total//2
    for i, ch in enumerate(letters):
        col = (75, 125, 255) if ch != 'E' else (90, 140, 255)
        glow(img, x_start + i*spacing + 12, 82, 20, (60,100,220))
        d.text((x_start + i*spacing, 58), ch, font=lf, fill=col)

    # Green dot below last 'E'
    dot_x = x_start + 4*spacing + 14
    glow(img, dot_x, 148, 14, (0,200,130))
    d.ellipse([dot_x-7, 140, dot_x+7, 154], fill=(0, 215, 135))

    # Taglines
    d.text((W//2 - 60, 172), "Advocate Suite", font=font(18), fill=(200,212,255))
    d.text((W//2 - 52, 200), "वकीलों के लिए AI", font=font(14), fill=(130,150,210))

    d.line([50, 236, W-50, 236], fill=(35,42,72))

    # Email
    card(img, 36, 254, W-36, 320, r=14)
    d.text((52, 272), "advocate@email.com", font=font(15), fill=(100,115,160))

    # Password
    card(img, 36, 332, W-36, 398, r=14)
    d.text((52, 350), "•••••••••••••••", font=font(15), fill=(100,115,160))

    # Login button
    btn = Image.new("RGBA", (W-72, 64), (55,105,240))
    rr(btn, 0,0,W-72,64,16, fill=(55,105,240))
    img.paste(btn, (36, 412), btn)
    d.text((W//2 - 28, 430), "Login", font=font(18, bold=True), fill=(255,255,255))

    d.line([50, 500, 178, 500], fill=(35,42,72))
    d.text((190, 488), "or", font=font(12), fill=(80,90,130))
    d.line([218, 500, W-50, 500], fill=(35,42,72))

    card(img, 36, 514, W-36, 578, r=14)
    d.text((128, 532), "Continue with Google", font=font(15), fill=(185,195,230))

    d.text((108, 624), "Don't have an account?", font=font(13), fill=(90,105,160))
    d.text((252, 624), "Register", font=font(13, bold=True), fill=(75,155,255))

    nav_bar(img)
    return img

# ═══════════════════════════════════════════════════════
# 2. DASHBOARD
# ═══════════════════════════════════════════════════════
def screen_dashboard():
    img = Image.new("RGB", (W,H), (8,10,20))
    bg_gradient(img, (4,6,14), (12,16,30))
    d = ImageDraw.Draw(img)

    d.rectangle([0,0,W,70], fill=(10,11,24))
    d.text((22,20), "Namaste, Advocate 👋", font=font(22, bold=True), fill=(255,255,255))
    glow(img, W-44, 34, 16, (50,70,180))
    d.ellipse([W-66,18,W-34,50], fill=(28,30,50))
    d.text((W-58,20), "🔔", font=font(16))

    chips = [("🔴 Live","12",(215,45,45)),("🟡 Pending","7",(200,168,28)),("🟢 Done","43",(28,188,78))]
    cx = 22
    for lbl, cnt, col in chips:
        card(img, cx,84,cx+104,126,r=12)
        d.text((cx+10,90), lbl, font=font(11), fill=(150,162,210))
        d.text((cx+10,106), cnt, font=font(16,bold=True), fill=col)
        cx += 114

    card(img, 18,144,W-18,292,r=18,border=(50,58,90))
    d.rectangle([18,144,26,292], fill=(55,105,240))
    d.text((38,158), "📅  Today's Hearing", font=font(16,bold=True), fill=(255,255,255))
    d.text((38,184), "S.C.Jain vs State of Punjab", font=font(15), fill=(200,210,238))
    d.text((38,206), "Case No: SC-2024-00412", font=font(12), fill=(95,108,155))
    d.text((38,228), "⏰  10:30 AM — P&H High Court", font=font(13), fill=(145,158,210))
    d.rectangle([38,256,W-38,263], fill=(28,30,50))
    d.rectangle([38,256,int(38+(W-76)*0.68),263], fill=(55,105,240))
    d.text((38,266), "Case Progress: 68%", font=font(11), fill=(85,95,135))

    d.text((22,308), "Quick Actions", font=font(16,bold=True), fill=(255,255,255))
    acts = [("📝","New Case",(55,42,95)),("🤖","AI Draft",(65,38,115)),("🔍","Search",(45,55,95)),("📋","Tasks",(75,45,75))]
    ax = 18
    for ico,lbl,col in acts:
        card(img,ax,338,ax+94,440,r=16)
        glow(img,ax+47,370,28,col)
        d.text((ax+34,366), ico, font=font(28))
        d.text((ax+16,406), lbl, font=font(13), fill=(175,185,220))
        ax += 102

    card(img,18,456,W-18,648,r=18,border=(50,58,90))
    d.text((36,470), "⚡  AIPOT Live Feed", font=font(16,bold=True), fill=(255,255,255))
    lb = Image.new("RGBA",(80,32),(255,35,35))
    rr(lb,0,0,80,32,12,fill=(255,35,35))
    img.paste(lb,(W-106,468),lb)
    d.text((W-98,474), "● LIVE", font=font(11,bold=True), fill=(255,255,255))

    jdata = [("P&H HC","Rakesh Kumar vs State","IPC 420","10:22 AM"),
             ("Delhi HC","Mehta vs Union of India","Art. 226","10:05 AM"),
             ("SC","State vs Confederation","Civil Ap.","09:48 AM")]
    jy = 508
    for ct,case,sec,tm in jdata:
        card(img,28,jy,W-28,jy+44,r=10,border=(40,45,70))
        col_ = (75,108,228) if "SC" in ct else (65,88,200)
        d.text((40,jy+4), f"{ct}  ·  {tm}", font=font(10,bold=True), fill=col_)
        d.text((40,jy+20), case, font=font(13), fill=(188,198,235))
        d.text((W-108,jy+20), sec, font=font(11), fill=(105,120,172))
        jy += 52

    nav_bar(img)
    return img

# ═══════════════════════════════════════════════════════
# 3. CASE LIST
# ═══════════════════════════════════════════════════════
def screen_cases():
    img = Image.new("RGB", (W,H), (8,10,20))
    bg_gradient(img, (4,6,14), (12,16,30))
    d = ImageDraw.Draw(img)

    d.rectangle([0,0,W,70], fill=(10,11,24))
    d.text((22,20), "←", font=font(22), fill=(175,185,220))
    d.text((52,18), "My Cases", font=font(22,bold=True), fill=(255,255,255))
    glow(img,W-48,34,14,(50,70,180))
    d.ellipse([W-66,18,W-34,50],fill=(28,30,50))
    d.text((W-58,20), "🔍", font=font(16))
    d.ellipse([W-32,18,W-6,50],fill=(28,30,50))
    d.text((W-24,20), "☰", font=font(16))

    card(img,18,82,W-18,124,r=14,border=(40,45,70))
    d.text((42,92), "Search case, party or number...", font=font(14), fill=(88,98,140))

    flts = [("All",True),("Supreme Court",False),("High Court",False),("Tribunal",False)]
    fx = 18
    for f,on in flts:
        fw = 88 if on else 100
        fc = (50,95,228) if on else (22,24,40)
        card(img,fx,138,fx+fw,170,r=12)
        d.text((fx+16,144), f, font=font(13), fill=(255 if on else 120))
        fx += fw+8

    cases = [
        ("🔴  ACTIVE",(215,45,45),0.68,"S.C.Jain vs State of Punjab","SC-2024-00412","⚖️ P&H HC","IPC 420","📅 30 Jul · 10:30 AM"),
        ("🟡  PENDING",(200,168,28),0.35,"Mehta Properties vs Union","WP-2024-1182","⚖️ Delhi HC","Art. 226","📅 02 Aug · 11:00 AM"),
        ("🟢  RESOLVED",(28,188,78),1.0,"Advocate R.Singh vs Steel Corp","CA-2023-8891","🏛️ Supreme Court","Civil Ap.","✓ Order Reserved"),
    ]
    cy = 192
    for bdge,bc,prog,cas,no,ct,sc,hr in cases:
        card(img,18,cy,W-18,cy+144,r=16,border=(50,58,90))
        d.rectangle([18,cy,26,cy+144],fill=bc)
        d.text((36,cy+8), bdge, font=font(11,bold=True), fill=bc)
        d.text((36,cy+28), cas, font=font(14,bold=True), fill=(218,225,250))
        d.text((36,cy+50), no, font=font(11), fill=(88,98,140))
        d.text((36,cy+70), ct, font=font(12), fill=(145,158,210))
        d.text((220,cy+70), sc, font=font(12), fill=(105,120,172))
        d.text((36,cy+92), hr, font=font(12), fill=(138,150,198))
        d.rectangle([36,cy+116,W-36,cy+122],fill=(26,28,46))
        px = int(36+(W-72)*prog)
        d.rectangle([36,cy+116,px,cy+122],fill=bc)
        d.text((36,cy+104), f"{int(prog*100)}% Complete", font=font(10), fill=(78,88,125))
        cy += 156

    glow(img,W-48,H-170,30,(50,95,230))
    d.ellipse([W-78,H-200,W-18,H-140],fill=(55,105,240))
    d.text((W-62,H-192), "+", font=font(32,bold=True), fill=(255,255,255))

    nav_items=[("🏠","Home",False),("📁","Cases",True),("🤖","AI",False),("💬","Chat",False),("👤","Profile",False)]
    y=H-96
    d.rectangle([0,y,W,H],fill=(10,11,22))
    nx=20
    for ico,lbl,on in nav_items:
        col=(70,130,255) if on else (70,75,100)
        if on: d.ellipse([nx+14,y-6,nx+48,y-2],fill=(70,130,255))
        d.text((nx+10,y+10),ico,font=font(22))
        d.text((nx+2,y+54),lbl,font=font(11),fill=col)
        nx+=82
    return img

# ═══════════════════════════════════════════════════════
# 4. CASE CHAT + AI DRAFT
# ═══════════════════════════════════════════════════════
def screen_chat():
    img = Image.new("RGB", (W,H), (8,10,20))
    bg_gradient(img, (4,6,14), (12,16,30))
    d = ImageDraw.Draw(img)

    d.rectangle([0,0,W,70],fill=(10,11,24))
    d.text((22,20),"←",font=font(22),fill=(175,185,220))
    d.text((52,14),"SC-2024-00412",font=font(17,bold=True),fill=(255,255,255))
    d.text((52,35),"Rakesh Kumar vs State of Punjab",font=font(11),fill=(95,105,152))
    glow(img,W-38,34,14,(50,70,180))
    d.ellipse([W-56,18,W-24,50],fill=(28,30,50))
    d.text((W-48,20),"⋮",font=font(18),fill=(175,185,220))

    d.rectangle([0,70,W,110],fill=(14,15,28))
    d.text((28,78),"📂 IPC 420",font=font(12),fill=(135,148,198))
    d.text((128,78),"⚖️ P&H HC",font=font(12),fill=(135,148,198))
    d.text((230,78),"📅 Jul 2024",font=font(12),fill=(135,148,198))
    d.text((328,78),"💰 ₹50K",font=font(12),fill=(135,148,198))

    # Timeline
    tlx = 44
    events=[("15 Jun","Case Filed",True,False),("28 Jun","First Hearing",True,False),
            ("10 Jul","Arguments",False,True),("30 Jul","Next Hearing",False,False)]
    d.line([(tlx,128),(tlx,308)],fill=(38,48,88),width=2)
    ty=120
    for dt,ev,done,cur in events:
        if done:
            d.ellipse([tlx-6,ty-6,tlx+6,ty+6],fill=(65,120,245))
        elif cur:
            d.ellipse([tlx-7,ty-7,tlx+7,ty+7],fill=(200,168,28))
            d.text((tlx+18,ty-8),f"{dt} — {ev}",font=font(12,bold=True),fill=(220,200,95))
        else:
            d.ellipse([tlx-5,ty-5,tlx+5,ty+5],outline=(58,63,105),width=2)
            d.text((tlx+18,ty-6),f"{dt} — {ev}",font=font(12),fill=(85,95,135))
        ty+=47

    card(img,80,120,W-22,196,r=18,border=(55,95,220))
    d.text((96,130),"Draft a reply to the opposite",font=font(14),fill=(255,255,255))
    d.text((96,150),"party's application filed on",font=font(14),fill=(255,255,255))
    d.text((96,170),"15th July under Section 5...",font=font(14),fill=(255,255,255))

    card(img,22,210,360,432,r=18,border=(45,75,180))
    d.text((38,218),"🤖  Letese AI",font=font(12,bold=True),fill=(75,138,255))
    d.line([(38,238),(354,238)],fill=(32,36,62))
    lines=[("IN THE HIGH COURT OF PUNJAB",(95,150,255)),("& HARYANA AT CHANDIGARH",(95,150,255)),
           ("",(180,190,235)),("Case No: SC-2024-00412",(95,150,255)),
           ("",(180,190,235)),("I, Advocate Rajesh Sharma,",(180,190,235)),
           ("appearing for the applicant,",(180,190,235)),
           ("most respectfully state:",(180,190,235)),
           ("",(180,190,235)),
           ("1. That the application filed",(178,188,232)),
           ("by the respondent under Section",(178,188,232)),
           ("5 of the Limitation Act deserves",(178,188,232)),
           ("to be dismissed as the same is",(178,188,232)),
           ("barred by limitation...",(178,188,232)),
           ("",(178,188,232)),]
    ly=246
    for txt,col in lines:
        d.text((38,ly),txt,font=font(11),fill=col)
        ly+=14

    d.text((38,408),"Typing",font=font(11),fill=(75,85,128))
    for i,bx in enumerate([82,96,110]):
        d.ellipse([bx,408,bx+7,415],fill=(65,120,245))

    iy=H-118
    d.rectangle([0,iy,W,H],fill=(10,11,22))
    card(img,22,iy+10,306,iy+64,r=24,border=(35,40,68))
    d.text((40,iy+26),"Ask or draft something...",font=font(15),fill=(85,95,135))
    d.ellipse([312,iy+14,346,iy+48],fill=(30,33,55))
    d.text((318,iy+18),"🎤",font=font(16))
    sn=Image.new("RGBA",(50,50),(55,105,240))
    rr(sn,0,0,50,50,25,fill=(55,105,240))
    img.paste(sn,(360,iy+12),sn)
    d.text((370,iy+22),"➤",font=font(18),fill=(255,255,255))
    return img

# ═══════════════════════════════════════════════════════
# 5. AIPOT LIVE FEED
# ═══════════════════════════════════════════════════════
def screen_aipot():
    img = Image.new("RGB",(W,H),(8,10,20))
    bg_gradient(img,(4,6,14),(12,16,30))
    d = ImageDraw.Draw(img)

    glow(img,W//2,55,100,(35,55,150))
    d.rectangle([0,0,W,110],fill=(10,11,26))
    d.text((22,16),"⚡  AIPOT Live Feed",font=font(24,bold=True),fill=(255,255,255))
    d.text((22,48),"Auto-scraped judgments from Indian courts",font=font(13),fill=(115,135,195))
    lb=Image.new("RGBA",(90,34),(255,30,30))
    rr(lb,0,0,90,34,12,fill=(255,30,30))
    img.paste(lb,(W-108,18),lb)
    d.text((W-100,24),"● LIVE",font=font(13,bold=True),fill=(255,255,255))

    stats=[("1,24,680","Judgments"),("847","Today"),("42","This Hour")]
    sx=18
    for val,lbl in stats:
        card(img,sx,120,sx+128,194,r=16,border=(50,58,90))
        glow(img,sx+64,140,32,(38,68,175))
        d.text((sx+14,134),val,font=font(20,bold=True),fill=(78,138,252))
        d.text((sx+22,164),lbl,font=font(12),fill=(105,120,170))
        sx+=136

    flts=[("All",True),("Supreme Court",False),("High Court",False),("Tribunal",False)]
    fx=18
    for f,on in flts:
        fw=90 if on else 100
        fc=(50,95,228) if on else (22,24,42)
        card(img,fx,210,fx+fw,242,r=12)
        d.text((fx+16,216),f,font=font(13),fill=(255 if on else 130))
        fx+=fw+8

    jdata=[
        ("🏛️","SUPREME COURT","CA 2345/2024","M/s XYZ Ltd vs ABC Corp","Constitutional validity...","IPC + Arb.","30 Jul"),
        ("⚖️","P&H HIGH COURT","CR 4891/2024","Kishore Lal vs State","IPC 420, 467, 471","","30 Jul"),
        ("⚖️","DELHI HIGH COURT","WP(C) 1842/2024","Advocate Ram Singh vs Union","Art. 226, Service Law","","29 Jul"),
        ("🏛️","SUPREME COURT","SLP 11880/2024","State of UP vs Federation","Land Acquisition Act","","29 Jul"),
        ("⚖️","BOMBAY HIGH COURT","ARB.A. 203/2024","Smith Realty vs Metro","Arbitration Act s.11","","28 Jul"),
    ]
    jy=258
    for em,ct,no,pt,sc,ex,dt in jdata:
        card(img,18,jy,W-18,jy+88,r=14,border=(50,58,90))
        col_=(70,105,228) if "SUPREME" in ct else (62,82,198)
        d.rectangle([18,jy,26,jy+88],fill=col_)
        d.text((36,jy+6),f"{em} {ct}",font=font(10,bold=True),fill=col_)
        d.text((36,jy+24),no,font=font(13,bold=True),fill=(195,205,240))
        d.text((36,jy+44),pt,font=font(11),fill=(138,150,195))
        d.text((36,jy+60),f"{sc} {ex}  ·  {dt}",font=font(10),fill=(100,112,158))
        d.text((W-52,jy+6),"🔖",font=font(14))
        jy+=96
        if jy > H-140: break

    nav_bar(img)
    return img

# ═══════════════════════════════════════════════════════
# 6. PROFILE
# ═══════════════════════════════════════════════════════
def screen_profile():
    img = Image.new("RGB",(W,H),(8,10,20))
    bg_gradient(img,(4,6,14),(12,16,30))
    d = ImageDraw.Draw(img)

    d.rectangle([0,0,W,220],fill=(10,12,28))
    # Avatar
    glow(img,215,90,60,(35,55,150))
    d.ellipse([155,30,275,150],fill=(38,48,80))
    d.ellipse([163,38,267,142],fill=(55,68,105))
    d.text((185,68),"AS",font=font(38,bold=True),fill=(78,138,252))
    glow(img,241,132,12,(0,200,130))
    d.ellipse([234,124,248,138],fill=(0,215,135))
    d.text((210,162),"Arjun Singh",font=font(22,bold=True),fill=(255,255,255))
    d.text((195,192),"Advocate • Enrolled 2018",font=font(13),fill=(115,130,178))
    d.text((185,212),"PB-2018-49271",font=font(11),fill=(85,95,140))

    pstats=[("247","Cases"),("1,200","Hearings"),("98%","Win Rate"),("₹48L","Revenue")]
    sx=18
    for val,lbl in pstats:
        card(img,sx,230,sx+94,292,r=14,border=(50,58,90))
        d.text((sx+12,238),val,font=font(18,bold=True),fill=(78,138,252))
        d.text((sx+12,264),lbl,font=font(11),fill=(105,118,162))
        sx+=102

    menus=[
        ("⚙️","Settings","App preferences, notifications"),
        ("🔒","Security","Password, 2FA, PIN"),
        ("💳","Billing","Plan: Pro • Renewal: Dec 2024"),
        ("👥","Team","3 members • Manage RBAC"),
        ("📱","Linked Accounts","Google, WhatsApp Business"),
        ("📊","Analytics","Usage & performance"),
        ("🆘","Help & Support","FAQ, Chat with us"),
        ("📤","Logout",""),
    ]
    my=308
    for ico,lbl,det in menus:
        is_logout=(lbl=="Logout")
        h=54 if det else 46
        card(img,16,my,W-16,my+h,r=14,border=(50,58,90) if not is_logout else (120,40,40))
        d.text((30,my+12 if det else my+8),ico,font=font(18))
        d.text((60,my+8 if det else my+10),lbl,font=font(15,bold=True),fill=(220,40,40) if is_logout else (200,210,238))
        if det: d.text((60,my+28),det,font=font(11),fill=(95,105,142))
        if not is_logout: d.text((W-36,my+16 if det else my+12),"›",font=font(18),fill=(75,82,115))
        my+=h+8

    nav_items=[("🏠","Home",False),("📁","Cases",False),("🤖","AI",False),("💬","Chat",False),("👤","Profile",True)]
    y=H-96
    d.rectangle([0,y,W,H],fill=(10,11,22))
    nx=20
    for ico,lbl,on in nav_items:
        col=(70,130,255) if on else (70,75,100)
        if on: d.ellipse([nx+14,y-6,nx+48,y-2],fill=(70,130,255))
        d.text((nx+10,y+10),ico,font=font(22))
        d.text((nx+2,y+54),lbl,font=font(11),fill=col)
        nx+=82
    return img

# ─── GENERATE ALL ───────────────────────────────────────
os.makedirs("/root/clawd/mockups", exist_ok=True)
screens = [
    ("1_login.png", screen_login, "🔐 Login"),
    ("2_dashboard.png", screen_dashboard, "🏠 Dashboard"),
    ("3_cases.png", screen_cases, "📁 Case List"),
    ("4_chat.png", screen_chat, "💬 AI Chat"),
    ("5_aipot.png", screen_aipot, "⚡ AIPOT Feed"),
    ("6_profile.png", screen_profile, "👤 Profile"),
]
for fname, fn, desc in screens:
    img = fn()
    img.save(f"/root/clawd/mockups/{fname}", quality=95)
    print(f"✅ {fname} — {desc}")

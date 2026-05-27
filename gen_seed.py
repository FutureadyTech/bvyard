import csv, json, re

# ── Read CSV ──────────────────────────────────────────────────────────────
with open('C:/FRM/Navy IMS/bvy_inventory.csv', encoding='utf-8') as f:
    raw = list(csv.reader(f))[1:]   # skip header

rows = []
for r in raw:
    if not r[3].strip(): continue
    rows.append({
        'group': r[0].strip(),
        'cat':   r[1].strip(),
        'code':  r[2].strip(),
        'name':  r[3].strip(),
        'unit':  r[4].strip() if len(r) > 4 else 'KG'
    })

# ── Category definitions (names EXACTLY from sheet, title-cased) ──────────
# Duplicates (MISCELLANEOUS appears in BASIC and NECCESARY) are distinguished by group prefix
def cat_key(group, cat): return (group, cat.strip())

CAT_DEF = {
    # (group, cat_name) -> (id, display_name, sectionId, moq, cadence, moqUnit, code_prefix)
    ('BASIC',     'MILLET'):                       ('c_mlt',  'Millet',                      'sec_basic',  200, 'quarterly', 'kg',  'BGMLT'),
    ('BASIC',     'MISCELLANEOUS'):                ('c_nmx',  'Miscellaneous',                 'sec_dry',     50, 'monthly',   'kg',  ''),
    ('BASIC',     'PRE MIX MASALA'):               ('c_pmm',  'Pre Mix Masala',               'sec_masala',  50, 'monthly',   'kg',  'BGPMM'),
    ('BASIC',     'CONDIMENTS AND GARAM MASALA'):  ('c_cgm',  'Condiments And Garam Masala',  'sec_masala', 100, 'monthly',   'kg',  'BGCGM'),
    ('BASIC',     'DAL'):                          ('c_dal',  'Dal',                          'sec_dal',    300, 'monthly',   'kg',  'BGDAL'),
    ('BASIC',     'BASIC'):                        ('c_bas',  'Basic',                        'sec_basic',  500, 'quarterly', 'kg',  'BGBAS'),
    ('FRESH',     'VEGETABLE'):                    ('c_vgt',  'Vegetable',                    'sec_fresh',   50, 'daily',     'kg',  'FGVGT'),
    ('FRESH',     'FRUIT'):                        ('c_frt',  'Fruit',                        'sec_fresh',   50, 'daily',     'kg',  'FGFRT'),
    ('FRESH',     'DAIRY'):                        ('c_dy',   'Dairy',                        'sec_fresh',   50, 'daily',     'kg',  'FGDRY'),
    ('FRESH',     'MEAT'):                         ('c_mt',   'Meat',                         'sec_meat',   100, 'weekly',    'kg',  'FGMT'),
    ('NECCESARY', 'MISCELLANEOUS'):                ('c_nmx',  'Miscellaneous',                 'sec_dry',     50, 'monthly',   'kg',  ''),
    ('NECCESARY', 'DRY FRUIT'):                    ('c_drf',  'Dry Fruit',                    'sec_dry',    100, 'monthly',   'kg',  'NGDRF'),
    ('NECCESARY', 'JUICE'):                        ('c_jus',  'Juice',                        'sec_dry',    100, 'monthly',   'Ltr', 'NGJUS'),
    ('NECCESARY', 'BISCUIT'):                      ('c_bsc',  'Biscuit',                      'sec_dry',    100, 'monthly',   'kg',  'NGBSC'),
    ('NECCESARY', 'CHEESE'):                       ('c_chs',  'Cheese',                       'sec_dry',     50, 'monthly',   'kg',  'NGCHS'),
    ('NECCESARY', 'PATIENT DIET'):                 ('c_pdt',  'Patient Diet',                 'sec_dry',     50, 'monthly',   'kg',  'NGPDT'),
    ('NECCESARY', 'DIVER RATION'):                 ('c_dvr',  'Diver Ration',                 'sec_dry',     50, 'adhoc',     'kg',  'NGDVR'),
    ('NECCESARY', 'COFFEE'):                       ('c_cof',  'Coffee',                       'sec_dry',     50, 'monthly',   'kg',  'NGCOF'),
    ('NECCESARY', 'FRUIT TD'):                     ('c_ftd',  'Fruit TD',                     'sec_dry',    100, 'monthly',   'kg',  'NGFTD'),
    ('NECCESARY', 'SUBMARINE'):                    ('c_sub',  'Submarine',                    'sec_dry',     50, 'adhoc',     'kg',  'NGSUB'),
    ('NECCESARY', 'MRE'):                          ('c_mre',  'MRE',                          'sec_dry',     50, 'adhoc',     'Nos', 'NGMRE'),
    ('NECCESARY', 'OIL'):                          ('c_oil',  'Oil',                          'sec_dry',    200, 'monthly',   'Ltr', 'NGOIL'),
    ('NECCESARY', 'TEA'):                          ('c_tea',  'Tea',                          'sec_dry',    100, 'monthly',   'kg',  'NGTEA'),
    ('NECCESARY', 'VEG TD'):                       ('c_vtd',  'Veg TD',                       'sec_dry',    100, 'monthly',   'kg',  'NGVTD'),
}

def title_case(s):
    words = s.strip().split()
    always_upper = {'TD','MRE','W/O/S','KG','LTR','GMS','GM','PDR','FZ'}
    out = []
    for w in words:
        stripped = w.strip("()/.'\"")
        prefix   = w[:len(w)-len(w.lstrip("()/.'\""))]
        suffix   = w[len(w.rstrip("()/.'\"")):]
        if stripped.upper() in always_upper:
            out.append(prefix + stripped.upper() + suffix)
        elif not stripped:
            out.append(w)
        else:
            out.append(prefix + stripped[0].upper() + stripped[1:].lower() + suffix)
    return ' '.join(out)

def norm_unit(u):
    u = u.strip().upper()
    if u in ('KG','KGS'): return 'kg'
    if u in ('LTR','LTRS','L'): return 'Ltr'
    if u in ('NO','NOS','NUMBER'): return 'Nos'
    return 'kg'

# ── Build categories list (preserve order, deduplicate by id) ────────────
cats_seen_keys = []
cats_seen_ids  = set()
for r in rows:
    k = (r['group'], r['cat'])
    if k in CAT_DEF:
        cid = CAT_DEF[k][0]
        if cid not in cats_seen_ids:
            cats_seen_keys.append(k)
            cats_seen_ids.add(cid)

categories = []
for k in cats_seen_keys:
    cid, dname, sec, moq, cad, mu, cpfx = CAT_DEF[k]
    # Miscellaneous spans both BASIC and NECCESARY — no single group
    grp = '' if cid == 'c_nmx' else k[0]
    categories.append({
        'id': cid,
        'name': dname,
        'group': grp,           # BASIC / FRESH / NECCESARY (blank = spans multiple)
        'sectionId': sec,
        'moq': moq,
        'cadence': cad,
        'moqUnit': mu
    })

# ── Build products ────────────────────────────────────────────────────────
products = []
cat_counters = {}

for i, r in enumerate(rows):
    k = (r['group'], r['cat'])
    cd = CAT_DEF.get(k)
    if not cd: continue
    cid, dname, sec, moq, cad, mu, cpfx = cd

    cat_counters[cid] = cat_counters.get(cid, 0) + 1

    # Use existing code only — leave blank if not in source data
    code = r['code'] if r['code'] else ''

    unit = norm_unit(r['unit'])
    min_stock = moq   # use category MOQ as minimum

    products.append({
        'id':           f'p_{i+1}',
        'code':         code,
        'name':         title_case(r['name']),
        'group':        r['group'],          # BASIC / FRESH / NECCESARY
        'categoryId':   cid,
        'sectionId':    sec,
        'baseUnit':     unit,
        'packSize':     1,
        'packUnit':     'unit',
        'packToBase':   1,
        'currentStock': 100,
        'minStock':     min_stock,
        'unitPrice':    0,
        'freshItem':    cid in ('c_vgt','c_frt','c_dy','c_mt')
    })

# ── Verify ───────────────────────────────────────────────────────────────
print(f'Products: {len(products)}, Categories: {len(categories)}')
cat_ids = {c['id'] for c in categories}
orphans = [p for p in products if p['categoryId'] not in cat_ids]
no_code = [p for p in products if not p['code']]
print(f'Orphans: {len(orphans)}, No-code: {len(no_code)}')
for c in categories:
    cnt = sum(1 for p in products if p['categoryId'] == c['id'])
    print(f'  [{c["group"][:5]}] {c["id"]:8s} {c["name"]:35s} {cnt:3d} items')

# ── Assemble seed.js ──────────────────────────────────────────────────────
SEED_HEAD = '''// v0.7 — Exact category names + group field + all codes generated
// Source: BVY Inventory List Google Sheet

window.SEED_DATA = {
  sections: [
    { id: 'sec_dry',    name: 'Dry / Necessary Store',  code: 'NG',  inCharge: 'u4' },
    { id: 'sec_basic',  name: 'Basic / Rice Store',     code: 'BG',  inCharge: 'u3' },
    { id: 'sec_dal',    name: 'Dal Store',               code: 'DAL', inCharge: 'u6' },
    { id: 'sec_masala', name: 'Masala Store',            code: 'MS',  inCharge: 'u7' },
    { id: 'sec_fresh',  name: 'Fresh / Cold Store',      code: 'FG',  inCharge: 'u8' },
    { id: 'sec_meat',   name: 'Meat Store (Off-site)',   code: 'MT',  inCharge: 'u9' }
  ],

  users: [
    { id: 'u1',  name: 'BVO',                 rank: 'Capt',   role: 'super_admin',         designation: 'BVO',               email: 'bvo@navy.mil.in',       sections: ['*'] },
    { id: 'u2',  name: 'OICNG',              rank: 'Cdr',    role: 'central_coordinator', designation: 'OICNG',             email: 'oicng@navy.mil.in',     sections: ['*'] },
    { id: 'u3',  name: 'Logistics Officer',  rank: 'Lt Cdr', role: 'reviewer',            designation: 'Logistics Officer', email: 'logo@navy.mil.in',      sections: ['*'] },
    { id: 'u4',  name: 'Dry Store I/C',      rank: 'SSS',    role: 'inventory_manager',   designation: 'ICBG / Dry Store',  email: 'dry.ic@navy.mil.in',    sections: ['sec_dry'] },
    { id: 'u5',  name: 'OICBG',             rank: 'LtCdr',  role: 'reviewer',            designation: 'OICBG',             email: 'oicbg@navy.mil.in',     sections: ['*'] },
    { id: 'u6',  name: 'Dal Store I/C',      rank: 'SS',     role: 'inventory_manager',   designation: 'Dal Store I/C',     email: 'dal.ic@navy.mil.in',    sections: ['sec_dal'] },
    { id: 'u7',  name: 'Masala Store I/C',   rank: 'AVR',    role: 'inventory_manager',   designation: 'Masala Store I/C',  email: 'masala.ic@navy.mil.in', sections: ['sec_masala'] },
    { id: 'u8',  name: 'Fresh Store I/C',    rank: 'AVR',    role: 'inventory_manager',   designation: 'Fresh Store I/C',   email: 'fresh.ic@navy.mil.in',  sections: ['sec_fresh'] },
    { id: 'u9',  name: 'Meat Store I/C',     rank: 'AVR',    role: 'inventory_manager',   designation: 'Meat Store I/C',    email: 'meat.ic@navy.mil.in',   sections: ['sec_meat'] },
    { id: 'u10', name: 'Data Entry Operator', rank: 'SS',    role: 'data_entry',          designation: 'Central Hub Op',    email: 'dataop@navy.mil.in',    sections: ['*'] }
  ],

'''

SEED_TAIL = ''',

  ships: [
    { id: 's1', name: 'S1', code: 'S1', class: 'Frigate',             cof: 447 },
    { id: 's2', name: 'S2', code: 'S2', class: 'ASW Corvette',        cof: 410 },
    { id: 's3', name: 'S3', code: 'S3', class: 'Base / Shore Estab.', cof: 280 },
    { id: 's4', name: 'S4', code: 'S4', class: 'Hospital Ship',       cof: 195 },
    { id: 's5', name: 'S5', code: 'S5', class: 'Destroyer',           cof: 520 },
    { id: 's6', name: 'S6', code: 'S6', class: 'Patrol Vessel',       cof: 145 }
  ],

  suppliers: [
    { id: 'sp1', name: 'Trident Creation',  code: 'T0005K', gst: '27AAEPD8880H1ZN', address: 'Next to P&G Plaza, Cardinal Gracious Road, Mumbai - 400099', contact: 'sales@tridentcreation.in',  whatsapp: '+919876543210' },
    { id: 'sp2', name: 'Rupal Syndicates',  code: 'R0024B', gst: '27AAEPD8860H1ZA', address: '26/104, Shakti Krupa Shopping Centre, Ghatkopar (East), Mumbai - 400077', contact: 'rupalsyndicates@gmail.com', whatsapp: '+919876543220' }
  ],

  demands: [
    {
      id: 'd1', demandNo: '26R1067', date: '2026-05-13', dayOfWeek: 'Wed',
      shipId: 's1', status: 'pending', raisedBy: 'S1', sourceChannel: 'whatsapp',
      items: [
        { productId: 'p_1',  demandedQty: 100, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p_11', demandedQty: 50,  fulfilledQty: 0, substitutedFor: null, outcome: 'pending' }
      ]
    },
    {
      id: 'd2', demandNo: '26R1068', date: '2026-05-20', dayOfWeek: 'Wed',
      shipId: 's2', status: 'approved', raisedBy: 'S2', sourceChannel: 'email',
      items: [
        { productId: 'p_82',  demandedQty: 80, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p_136', demandedQty: 60, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' }
      ],
      poId: null
    }
  ],

  purchaseOrders: [],
  stockIn:        [],
  stockOut:       [],
  spoilage:       [],
  dispatch:       []
};
'''

out = SEED_HEAD
out += '  categories: ' + json.dumps(categories, indent=4) + ',\n\n'
out += '  products: ' + json.dumps(products, indent=4)
out += SEED_TAIL

with open('C:/FRM/Navy IMS/prototype/assets/js/seed.js', 'w', encoding='utf-8') as f:
    f.write(out)

print(f'\n✓ seed.js written — {len(products)} products, {len(categories)} categories')

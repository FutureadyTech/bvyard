// v0.2 — Sections, multi-unit, demand fulfilment tracking
// All data based on real source documents (BV Yard Mumbai, May 2026)

window.SEED_DATA = {
  // Inventory sections (physical store + functional team)
  sections: [
    { id: 'sec_dry',    name: 'Dry / Necessary Store', code: 'NG',  inCharge: 'u4', skuCount: 85 },
    { id: 'sec_basic',  name: 'Basic / Rice Store',    code: 'BG',  inCharge: 'u3' },
    { id: 'sec_dal',    name: 'Dal Store',              code: 'DAL', inCharge: 'u6' },
    { id: 'sec_masala', name: 'Masala Store',           code: 'MS',  inCharge: 'u7' },
    { id: 'sec_fresh',  name: 'Fresh / Cold Store',     code: 'FG',  inCharge: 'u8' },
    { id: 'sec_meat',   name: 'Meat Store (Off-site)',  code: 'MT',  inCharge: 'u9' }
  ],

  users: [
    { id: 'u1', name: 'Capt Ravindra Kumar', rank: 'Capt', role: 'super_admin', designation: 'BVO', email: 'r.kumar@navy.mil.in', sections: ['*'] },
    { id: 'u2', name: 'Cdr Pawan Kumar Ojha', rank: 'Cdr', role: 'central_coordinator', designation: 'OICNG', email: 'p.ojha@navy.mil.in', sections: ['*'] },
    { id: 'u3', name: 'Lt Cdr Mukil Hariharan', rank: 'Lt Cdr', role: 'reviewer', designation: 'Logistics Officer', email: 'm.hariharan@navy.mil.in', sections: ['*'] },
    { id: 'u4', name: 'Raj K Panjiyara', rank: 'SSS', role: 'inventory_manager', designation: 'ICBG / Dry Store', email: 'r.panjiyara@navy.mil.in', sections: ['sec_dry'] },
    { id: 'u5', name: 'Vinodh K Vijay', rank: 'LtCdr', role: 'reviewer', designation: 'OICBG', email: 'v.vijay@navy.mil.in', sections: ['*'] },
    { id: 'u6', name: 'Suresh G', rank: 'SS', role: 'inventory_manager', designation: 'Dal Store I/C', email: 's.suresh@navy.mil.in', sections: ['sec_dal'] },
    { id: 'u7', name: 'Aravind CH', rank: 'AVR', role: 'inventory_manager', designation: 'Masala Store I/C', email: 'aravind@navy.mil.in', sections: ['sec_masala'] },
    { id: 'u8', name: 'Raju K G', rank: 'AVR', role: 'inventory_manager', designation: 'Fresh Store I/C', email: 'raju.kg@navy.mil.in', sections: ['sec_fresh'] },
    { id: 'u9', name: 'Bibul Halder', rank: 'AVR', role: 'inventory_manager', designation: 'Basic Store I/C', email: 'b.halder@navy.mil.in', sections: ['sec_basic'] },
    { id: 'u10', name: 'Data Entry Op 1', rank: 'SS', role: 'data_entry', designation: 'Central Hub Op', email: 'op1@navy.mil.in', sections: ['*'] }
  ],

  // MOQ = Minimum Order Quantity, cadence = how often we order this category
  categories: [
    { id: 'c1', name: 'Cereals & Flour', sectionId: 'sec_basic', moq: 1000, cadence: 'quarterly', moqUnit: 'kg' },
    { id: 'c2', name: 'Pulses & Dal', sectionId: 'sec_dal', moq: 500, cadence: 'monthly', moqUnit: 'kg' },
    { id: 'c3', name: 'Spices & Masala', sectionId: 'sec_masala', moq: 100, cadence: 'monthly', moqUnit: 'kg' },
    { id: 'c4', name: 'Dry Fruits & Nuts', sectionId: 'sec_dry', moq: 200, cadence: 'monthly', moqUnit: 'kg' },
    { id: 'c5', name: 'Tinned & Preserved', sectionId: 'sec_dry', moq: 100, cadence: 'monthly', moqUnit: 'kg' },
    { id: 'c6', name: 'Beverages & Sweets', sectionId: 'sec_dry', moq: 100, cadence: 'monthly', moqUnit: 'kg' },
    { id: 'c7', name: 'Vegetables', sectionId: 'sec_fresh', moq: 50, cadence: 'daily', moqUnit: 'kg' },
    { id: 'c8', name: 'Fruits', sectionId: 'sec_fresh', moq: 50, cadence: 'daily', moqUnit: 'kg' },
    { id: 'c9', name: 'Dairy', sectionId: 'sec_fresh', moq: 5000, cadence: 'daily', moqUnit: 'Ltr' },
    { id: 'c10', name: 'Meat & Frozen', sectionId: 'sec_meat', moq: 200, cadence: 'weekly', moqUnit: 'kg' }
  ],

  // baseUnit = the unit we track stock in (always)
  // packSize × packUnit = how it physically arrives (e.g. 25 × bag of kg)
  // packToBase = how many baseUnit per pack (so packSize * packToBase = qty per pack)
  // Example: Atta arrives in 10kg packs → packSize:10, packUnit:'pkt', packToBase:10, baseUnit:'kg'
  products: [
    // Dry — Dry Fruits & Nuts
    { id: 'p1', code: 'CNVICT-NGFDAM102', name: 'Almonds (Fruit Dried)', categoryId: 'c4', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 1500, minStock: 500, unitPrice: 624.00 },
    { id: 'p2', code: 'CNVICT-NGFDCN030', name: 'Cashewnuts (Fruit Dried)', categoryId: 'c4', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 850, minStock: 500, unitPrice: 831.00 },
    { id: 'p3', code: 'CNVICT-NGFDPS101', name: 'Pista with Skin', categoryId: 'c4', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 180, minStock: 300, unitPrice: 1248.00 },
    { id: 'p4', code: 'CNVICT-NGFDRB032', name: 'Raisin Brown', categoryId: 'c4', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 1200, minStock: 400, unitPrice: 249.50 },

    // Dry — Tinned & Preserved
    { id: 'p5', code: 'CNVICT-NGCC083', name: 'Composite Chocolate', categoryId: 'c5', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 12, packUnit: 'box', packToBase: 1, currentStock: 163, minStock: 100, unitPrice: 230.00 },
    { id: 'p11', code: 'CNVICT-NGDRMT017', name: 'Milk TD (Tinned)', categoryId: 'c5', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 24, packUnit: 'box', packToBase: 1, currentStock: 140, minStock: 150, unitPrice: 60.00 },
    { id: 'p9', code: 'CNVICT-NGND091', name: 'Noodles', categoryId: 'c5', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 10, packUnit: 'box', packToBase: 1, currentStock: 115, minStock: 50, unitPrice: 95.00 },
    { id: 'p12', code: 'CNVICT-NGBM068', name: 'Millet Biscuit', categoryId: 'c5', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 12, packUnit: 'box', packToBase: 1, currentStock: 72, minStock: 80, unitPrice: 110.00 },

    // Dry — Beverages & Sweets
    { id: 'p6', code: 'CNVICT-NGHR068', name: 'Horlicks 500G', categoryId: 'c6', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 24, packUnit: 'box', packToBase: 12, currentStock: 216, minStock: 150, unitPrice: 220.00 },
    { id: 'p7', code: 'CNVICT-NGTEA053', name: 'Tea 1 KG', categoryId: 'c6', sectionId: 'sec_dry', baseUnit: 'kg', packSize: 20, packUnit: 'box', packToBase: 1, currentStock: 264, minStock: 200, unitPrice: 260.00 },
    { id: 'p8', code: 'CNVICT-NGORG042', name: 'Oil Refined', categoryId: 'c6', sectionId: 'sec_dry', baseUnit: 'Ltr', packSize: 15, packUnit: 'tin', packToBase: 15, currentStock: 1200, minStock: 500, unitPrice: 165.00 },
    { id: 'p10', code: 'CNVICT-NGFJMJ046', name: 'Mango Juice 200 ML', categoryId: 'c6', sectionId: 'sec_dry', baseUnit: 'Ltr', packSize: 30, packUnit: 'box', packToBase: 6, currentStock: 81, minStock: 100, unitPrice: 45.00 },

    // Basic — Cereals & Flour
    { id: 'p13', code: 'CNVICT-BGRCSAT043', name: 'Atta', categoryId: 'c1', sectionId: 'sec_basic', baseUnit: 'kg', packSize: 10, packUnit: 'pkt', packToBase: 10, currentStock: 1800, minStock: 600, unitPrice: 50.00 },
    { id: 'p14', code: 'CNVICT-BGRCSRI100', name: 'Rice (Basmati)', categoryId: 'c1', sectionId: 'sec_basic', baseUnit: 'kg', packSize: 50, packUnit: 'bag', packToBase: 50, currentStock: 2400, minStock: 800, unitPrice: 95.00 },
    { id: 'p15', code: 'CNVICT-BGRCSSU045', name: 'Sugar', categoryId: 'c1', sectionId: 'sec_basic', baseUnit: 'kg', packSize: 50, packUnit: 'bag', packToBase: 50, currentStock: 1600, minStock: 500, unitPrice: 48.00 },
    { id: 'p16', code: 'CNVICT-BGRCSSA060', name: 'Salt', categoryId: 'c1', sectionId: 'sec_basic', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 300, minStock: 150, unitPrice: 22.00 },

    // Dal — Pulses & Dal
    { id: 'p17', code: 'CNVICT-BGDLAD020', name: 'Dal Arhar', categoryId: 'c2', sectionId: 'sec_dal', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 30, minStock: 100, unitPrice: 150.00 },
    { id: 'p18', code: 'CNVICT-BGDLMD024', name: 'Dal Moong Dal Split', categoryId: 'c2', sectionId: 'sec_dal', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 90, minStock: 100, unitPrice: 130.00 },
    { id: 'p19', code: 'CNVICT-BGDLKC033', name: 'Kabuli Chana', categoryId: 'c2', sectionId: 'sec_dal', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 150, minStock: 80, unitPrice: 120.00 },
    { id: 'p20', code: 'CNVICT-BGSTSL066', name: 'Dal Masoor Whole', categoryId: 'c2', sectionId: 'sec_dal', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 30, minStock: 100, unitPrice: 110.00 },

    // Masala — Spices & Masala
    { id: 'p21', code: 'CNVICT-BGGMSMP010', name: 'Garam Masala (Premix)', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 5, packUnit: 'box', packToBase: 1, currentStock: 14, minStock: 20, unitPrice: 300.00 },
    { id: 'p22', code: 'CNVICT-BGGMAM002', name: 'Amchur Powder', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 5, packUnit: 'box', packToBase: 1, currentStock: 60, minStock: 30, unitPrice: 110.25 },
    { id: 'p23', code: 'CNVICT-BGGMMW010', name: 'Mustard Whole', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 700, minStock: 200, unitPrice: 83.37 },
    { id: 'p24', code: 'CNVICT-BGTIL095', name: 'Til (Sesame)', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 25, packUnit: 'bag', packToBase: 25, currentStock: 40, minStock: 60, unitPrice: 160.65 },
    { id: 'p25', code: 'CNVICT-BGGMTU022', name: 'Turmeric Powder', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 10, packUnit: 'box', packToBase: 1, currentStock: 120, minStock: 50, unitPrice: 165.00 },
    { id: 'p26', code: 'CNVICT-BGGMRS055', name: 'Rock Salt', categoryId: 'c3', sectionId: 'sec_masala', baseUnit: 'kg', packSize: 5, packUnit: 'box', packToBase: 1, currentStock: 50, minStock: 30, unitPrice: 35.00 },

    // Fresh — Vegetables (no DC, daily inward)
    { id: 'p27', code: 'CNVICT-FGVGOI088', name: 'Onion', categoryId: 'c7', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 50, packUnit: 'bag', packToBase: 50, currentStock: 394, minStock: 200, unitPrice: 32.00, freshItem: true },
    { id: 'p28', code: 'CNVICT-FGVGPO089', name: 'Potato', categoryId: 'c7', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 50, packUnit: 'bag', packToBase: 50, currentStock: 526, minStock: 300, unitPrice: 28.00, freshItem: true },
    { id: 'p29', code: 'CNVICT-FGVGTM090', name: 'Tomato', categoryId: 'c7', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 25, packUnit: 'crate', packToBase: 25, currentStock: 205, minStock: 100, unitPrice: 40.00, freshItem: true },
    { id: 'p30', code: 'CNVICT-FGVGCB091', name: 'Cabbage', categoryId: 'c7', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 25, packUnit: 'crate', packToBase: 25, currentStock: 250, minStock: 100, unitPrice: 25.00, freshItem: true },

    // Fresh — Fruits
    { id: 'p31', code: 'CNVICT-FGFRMG093', name: 'Mango', categoryId: 'c8', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 20, packUnit: 'crate', packToBase: 20, currentStock: 240, minStock: 150, unitPrice: 80.00, freshItem: true },
    { id: 'p32', code: 'CNVICT-FGFRWM094', name: 'Water Melon', categoryId: 'c8', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 1, packUnit: 'nos', packToBase: 1, currentStock: 300, minStock: 100, unitPrice: 18.00, freshItem: true },

    // Fresh — Dairy
    { id: 'p33', code: 'CNVICT-FGDYMK001', name: 'Milk (Full Cream)', categoryId: 'c9', sectionId: 'sec_fresh', baseUnit: 'Ltr', packSize: 1, packUnit: 'pkt', packToBase: 1, currentStock: 800, minStock: 300, unitPrice: 60.00, freshItem: true },
    { id: 'p34', code: 'CNVICT-FGDYCD002', name: 'Curd', categoryId: 'c9', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 1, packUnit: 'pkt', packToBase: 1, currentStock: 120, minStock: 80, unitPrice: 55.00, freshItem: true },
    { id: 'p35', code: 'CNVICT-FGDYBT003', name: 'Butter', categoryId: 'c9', sectionId: 'sec_fresh', baseUnit: 'kg', packSize: 1, packUnit: 'pkt', packToBase: 1, currentStock: 40, minStock: 30, unitPrice: 480.00, freshItem: true },
    { id: 'p36', code: 'CNVICT-FGDYEG004', name: 'Eggs', categoryId: 'c9', sectionId: 'sec_fresh', baseUnit: 'Nos', packSize: 30, packUnit: 'tray', packToBase: 30, currentStock: 900, minStock: 300, unitPrice: 7.50, freshItem: true },

    // Meat — Meat & Frozen
    { id: 'p37', code: 'CNVICT-MTCHKN001', name: 'Chicken (Frozen)', categoryId: 'c10', sectionId: 'sec_meat', baseUnit: 'kg', packSize: 10, packUnit: 'box', packToBase: 10, currentStock: 500, minStock: 200, unitPrice: 220.00 },
    { id: 'p38', code: 'CNVICT-MTMUTN002', name: 'Mutton', categoryId: 'c10', sectionId: 'sec_meat', baseUnit: 'kg', packSize: 10, packUnit: 'box', packToBase: 10, currentStock: 150, minStock: 100, unitPrice: 680.00 },
    { id: 'p39', code: 'CNVICT-MTFISH003', name: 'Fish (Frozen)', categoryId: 'c10', sectionId: 'sec_meat', baseUnit: 'kg', packSize: 10, packUnit: 'box', packToBase: 10, currentStock: 300, minStock: 150, unitPrice: 180.00 },
    { id: 'p40', code: 'CNVICT-MTPRKN004', name: 'Prawns (Frozen)', categoryId: 'c10', sectionId: 'sec_meat', baseUnit: 'kg', packSize: 5, packUnit: 'box', packToBase: 5, currentStock: 80, minStock: 50, unitPrice: 450.00 }
  ],

  ships: [
    { id: 's1', name: 'S1', code: 'S1', class: 'Frigate', cof: 447 },
    { id: 's2', name: 'S2', code: 'S2', class: 'ASW Corvette', cof: 410 },
    { id: 's3', name: 'S3', code: 'S3', class: 'Base / Shore Estab.', cof: 280 },
    { id: 's4', name: 'S4', code: 'S4', class: 'Hospital Ship', cof: 195 },
    { id: 's5', name: 'S5', code: 'S5', class: 'Destroyer', cof: 520 },
    { id: 's6', name: 'S6', code: 'S6', class: 'Patrol Vessel', cof: 145 }
  ],

  suppliers: [
    { id: 'sp1', name: 'Trident Creation', code: 'T0005K', gst: '27AAEPD8880H1ZN', address: 'Next to P&G Plaza, Cardinal Gracious Road, Mumbai Suburban, Mumbai - 400099, Maharashtra', contact: 'sales@tridentcreation.in', whatsapp: '+919876543210' },
    { id: 'sp2', name: 'Rupal Syndicates', code: 'R0024B', gst: '27AAEPD8860H1ZA', address: '26/104, Shakti Krupa Shopping Centre, Mundra Nagar, Ghatkopar (East), Mumbai - 400077, Maharashtra', contact: 'rupalsyndicates@gmail.com', whatsapp: '+919876543220' }
  ],

  // Each demand item has: demandedQty, fulfilledQty (computed), substitutedFor, outcome
  // outcome enum: 'pending' | 'exact' | 'short' | 'over' | 'absent' | 'substituted'
  // sourceChannel: 'print' | 'email' | 'whatsapp'
  // dayOfWeek auto-derived from date but stored for filtering
  demands: [
    {
      id: 'd1', demandNo: '26R1067', date: '2026-05-13', dayOfWeek: 'Wed',
      shipId: 's1', status: 'pending', raisedBy: 'S1', sourceChannel: 'whatsapp',
      items: [
        { productId: 'p3', demandedQty: 100, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p17', demandedQty: 200, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p20', demandedQty: 150, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' }
      ]
    },
    {
      id: 'd2', demandNo: '26R1068', date: '2026-05-15', dayOfWeek: 'Fri',
      shipId: 's2', status: 'partially_fulfilled', raisedBy: 'S2', sourceChannel: 'email',
      items: [
        { productId: 'p11', demandedQty: 150, fulfilledQty: 140, substitutedFor: null, outcome: 'short' },
        { productId: 'p12', demandedQty: 80, fulfilledQty: 72, substitutedFor: null, outcome: 'short' },
        { productId: 'p10', demandedQty: 100, fulfilledQty: 100, substitutedFor: null, outcome: 'exact' }
      ],
      poId: 'po1'
    },
    {
      id: 'd3', demandNo: '26R1069', date: '2026-05-19', dayOfWeek: 'Tue',
      shipId: 's3', status: 'pending', raisedBy: 'S3', sourceChannel: 'print',
      items: [
        { productId: 'p21', demandedQty: 25, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p24', demandedQty: 30, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' }
      ]
    },
    {
      id: 'd4', demandNo: '26R1070', date: '2026-05-20', dayOfWeek: 'Wed',
      shipId: 's4', status: 'pending', raisedBy: 'S4', sourceChannel: 'whatsapp',
      items: [
        { productId: 'p27', demandedQty: 100, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p28', demandedQty: 150, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' },
        { productId: 'p29', demandedQty: 50, fulfilledQty: 0, substitutedFor: null, outcome: 'pending' }
      ]
    }
  ],

  purchaseOrders: [
    {
      id: 'po1', poNo: '26BNVC089', date: '2026-05-16', supplierId: 'sp1', status: 'issued',
      demandId: 'd2', totalValue: 23000,
      items: [
        { productId: 'p11', qty: 150, rate: 60 },
        { productId: 'p12', qty: 80, rate: 110 },
        { productId: 'p10', qty: 100, rate: 45 }
      ]
    },
    {
      id: 'po2', poNo: '26BNVC090', date: '2026-05-19', supplierId: 'sp1', status: 'issued',
      demandId: null, totalValue: 5905000,
      items: [
        { productId: 'p1', qty: 2000, rate: 624 },
        { productId: 'p2', qty: 2000, rate: 831 },
        { productId: 'p3', qty: 2000, rate: 1248 },
        { productId: 'p4', qty: 2000, rate: 249.50 }
      ]
    }
  ],

  stockIn: [
    {
      id: 'si1', srvNo: '26BA9SE1901', date: '2026-05-19', poId: null, supplierId: 'sp2',
      items: [
        { productId: 'p22', qty: 60, batchNo: '16/05/26', expiry: '2027-04-15' },
        { productId: 'p23', qty: 700, batchNo: '16/05/26', expiry: '2026-12-15' },
        { productId: 'p24', qty: 40, batchNo: '16/05/26', expiry: '2026-12-15' }
      ],
      preparedBy: 'u4', approvedBy: 'u5'
    }
  ],

  stockOut: [
    {
      id: 'so1', voucherNo: '26BIB00895', date: '2026-05-20', shipId: 's2', status: 'completed',
      demandId: 'd2',
      items: [
        { productId: 'p11', qty: 140, batchNo: 'MAR 26', demandedQty: 150 },
        { productId: 'p12', qty: 72, batchNo: '28/04/26', demandedQty: 80 },
        { productId: 'p10', qty: 100, batchNo: 'MAR 26', demandedQty: 100 }
      ],
      preparedBy: 'u4', approvedBy: 'u5'
    },
    {
      id: 'so2', voucherNo: '26BIN00856', date: '2026-05-20', shipId: 's3', status: 'completed',
      demandId: null,
      items: [
        { productId: 'p12', qty: 72, batchNo: '28/04/26' },
        { productId: 'p7', qty: 264, batchNo: '15/04/27' },
        { productId: 'p8', qty: 163, batchNo: '25/03/26' }
      ],
      preparedBy: 'u4', approvedBy: 'u5'
    }
  ],

  spoilage: [
    {
      id: 'sp_seed1', date: '2026-05-18', productId: 'p29', qty: 12, reason: 'spoilage',
      notes: 'Tomato crate damaged in transit', recordedBy: 'u8'
    }
  ],

  dispatch: [
    {
      id: 'dp_seed1', stockOutId: 'so1', vehicleNo: 'MH03CV8631', driver: 'R. Patil',
      gateOutTime: '2026-05-20T11:30', gateInTime: '2026-05-20T18:45',
      destination: 'S2 — Dock 2'
    }
  ]
};

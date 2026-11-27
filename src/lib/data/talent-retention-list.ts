export interface TalentRetentionItem {
  no: number;
  nik?: string;
  name: string;
  golongan: string;
  title: string;
  directorate: string;
  division: string;
  department: string;
  supervisor: string;
  tier: "Tier 1" | "Tier 2";
}

export const TIER_1_TALENT_RETENTION: Omit<TalentRetentionItem, "tier">[] = [
  {
    "no": 1,
    "nik": "10000065",
    "name": "Fathur Rohman",
    "golongan": "6C",
    "title": "Marketing & Marine General Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Dwi Prasetyo Suseno (Approval)"
  },
  {
    "no": 2,
    "nik": "11000308",
    "name": "Feri Indrayana",
    "golongan": "6C",
    "title": "Operation HSE & Supp Rel Deputy Director",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    "department": "",
    "supervisor": "Arief Wiedhartono"
  },
  {
    "no": 3,
    "nik": "10000055",
    "name": "Arya Dhamar Nugraha",
    "golongan": "6B",
    "title": "Mine Plan & Technical Services GM",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 4,
    "nik": "10000071",
    "name": "Dudu Anwar Sanusi",
    "golongan": "6B",
    "title": "Mine Operation & Support General Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 5,
    "nik": "11001193",
    "name": "Joseph Mikharno",
    "golongan": "6B",
    "title": "Legal Operation General Manager",
    "directorate": "LEGAL DIRECTORATE",
    "division": "LEGAL MINING DIVISION",
    "department": "",
    "supervisor": "Sandy Indrawan"
  },
  {
    "no": 6,
    "nik": "11001161",
    "name": "Patricia Sheila Kristiady",
    "golongan": "6B",
    "title": "Corporate Legal & Commercial General Mgr",
    "directorate": "LEGAL DIRECTORATE",
    "division": "LEGAL MINING DIVISION",
    "department": "",
    "supervisor": "Sandy Indrawan"
  },
  {
    "no": 7,
    "nik": "11001796",
    "name": "Agus Dani Ariyanto",
    "golongan": "6A",
    "title": "Business Partner Head & HR Head BC",
    "directorate": "HRGS DIRECTORATE",
    "division": "HRGS BC DIVISION",
    "department": "",
    "supervisor": "Paulus Swasono Satyo Nugroho"
  },
  {
    "no": 8,
    "nik": "11000358",
    "name": "Cahyo Andrianto",
    "golongan": "6A",
    "title": "Operation Support & Relation GM",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION & SUPPORT RELATION DIV",
    "department": "",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 9,
    "nik": "11000372",
    "name": "Febriwiadi Djali",
    "golongan": "6A",
    "title": "System Compliance & Environment GM",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 10,
    "nik": "10000061",
    "name": "Hamdan",
    "golongan": "6A",
    "title": "Operation Support General Manager",
    "directorate": "MTL (PT Mutiara Tanjung Lestari)",
    "division": "OPERATIONS SUPPORT DIVISION",
    "department": "",
    "supervisor": "Arief Wiedhartono"
  },
  {
    "no": 11,
    "nik": "11001254",
    "name": "Jimmi Idris",
    "golongan": "6A",
    "title": "Occupational Health & Safety GM",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 12,
    "nik": "21000547",
    "name": "Yoyok Nurprasetiyo Hadi Pramono",
    "golongan": "6A",
    "title": "License & Corp Communication General Mgr",
    "directorate": "LEGAL DIRECTORATE",
    "division": "LICENSE & CORP COMMUNICATION DIVISION",
    "department": "",
    "supervisor": "Edy Santoso"
  },
  {
    "no": 13,
    "nik": "11000310",
    "name": "Arif Widya Susanto",
    "golongan": "5D",
    "title": "System & Mining Technology Act GM",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM & MINING TECHNOLOGY DIVISION",
    "department": "MINING TECHNOLOGY DEPARTMENT",
    "supervisor": "Feri Indrayana"
  },
  {
    "no": 14,
    "nik": "11000992",
    "name": "Felix Gianmeta Hardi",
    "golongan": "5D",
    "title": "GMO Ops & Project Improvement Sr Manager",
    "directorate": "GMO SSU",
    "division": "GMO COMMERCIAL & OPS IMPROVEMENT DIV",
    "department": "GMO OPS & PROJECT IMPROVEMENT DEPARTMENT",
    "supervisor": "Leong Chee Keen"
  },
  {
    "no": 15,
    "nik": "11001519",
    "name": "Maurys Irwan",
    "golongan": "5D",
    "title": "Technical Services Senior Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "",
    "supervisor": "Arya Dhamar Nugraha"
  },
  {
    "no": 16,
    "nik": "11000641",
    "name": "Oka Muttakin",
    "golongan": "5D",
    "title": "Marine Support & PQSC Sr Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Fathur Rohman"
  },
  {
    "no": 17,
    "nik": "11000488",
    "name": "Rori Surya Perdana",
    "golongan": "5D",
    "title": "Marketing Research & Coal Dev Sr Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Fathur Rohman"
  },
  {
    "no": 18,
    "nik": "11000433",
    "name": "Arintoko Saputro",
    "golongan": "5C",
    "title": "Mine Operation Senior Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "",
    "supervisor": "Dudu Anwar Sanusi"
  },
  {
    "no": 19,
    "nik": "11000605",
    "name": "Hendra Yusrizal",
    "golongan": "5C",
    "title": "Marine Operation Sr Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Fathur Rohman"
  },
  {
    "no": 20,
    "nik": "11001325",
    "name": "Rahmantha Purba Anggana",
    "golongan": "5C",
    "title": "Senior Manager Safety & Health Sub Divis",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "",
    "supervisor": "Jimmi Idris"
  },
  {
    "no": 21,
    "nik": "11000414",
    "name": "Sutami Sitorus",
    "golongan": "5C",
    "title": "Mine Planning Senior Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "",
    "supervisor": "Arya Dhamar Nugraha"
  },
  {
    "no": 22,
    "nik": "11000472",
    "name": "Tomy Indarto",
    "golongan": "5C",
    "title": "HR Industrial & People Senior Manager",
    "directorate": "HRGS DIRECTORATE",
    "division": "HRGS BC DIVISION",
    "department": "HR OPERATIONS DEPARTMENT",
    "supervisor": "Agus Dani Ariyanto"
  },
  {
    "no": 23,
    "nik": "11000769",
    "name": "Alex Prabudi",
    "golongan": "5B",
    "title": "Short Term Mine Plan Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SHORT TERM MINE PLAN DEPARTMENT",
    "supervisor": "Sutami Sitorus"
  },
  {
    "no": 24,
    "nik": "11000305",
    "name": "Andi Zulkarnain",
    "golongan": "5B",
    "title": "Permit & Operation Compliance Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "OPERATIONS COMPLIANCE DEPARTMENT",
    "supervisor": "Febriwiadi Djali"
  },
  {
    "no": 25,
    "nik": "11000987",
    "name": "Dian Permana Putra",
    "golongan": "5B",
    "title": "Gurimbang Mine Operation Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "GURIMBANG MINE OPERATION DEPARTMENT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 26,
    "nik": "11000354",
    "name": "Erri Jumalis Salam",
    "golongan": "5B",
    "title": "Mid Term Mine Plan Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Sutami Sitorus"
  },
  {
    "no": 27,
    "nik": "11000401",
    "name": "Lukman Hakim",
    "golongan": "5B",
    "title": "Geotechnic & Hydrology Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Maurys Irwan"
  },
  {
    "no": 28,
    "nik": "11000543",
    "name": "Mando Godli . H. Sirait",
    "golongan": "5B",
    "title": "BMO 1 Mine Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BMO AREA 1 DEPARTMENT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 29,
    "nik": "11000317",
    "name": "Nanang Nur Cahyadi",
    "golongan": "5B",
    "title": "Sambarata Mine Operation Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "SAMBARATA MINE OPERATION DEPARTMENT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 30,
    "nik": "11000939",
    "name": "Ongky Elisman",
    "golongan": "5B",
    "title": "HSE Certification & Training Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION-HSE COMPETENCY SUBDIVISION",
    "department": "HSE CERTIFICATION & TRAINING DEPARTMENT",
    "supervisor": "Febriwiadi Djali"
  },
  {
    "no": 31,
    "nik": "11000725",
    "name": "Rayhan Fajusha",
    "golongan": "5B",
    "title": "Mine Dev & Production Control Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MINE DEV & PRODUCTION CONTROL DEPT",
    "supervisor": "Sutami Sitorus"
  },
  {
    "no": 32,
    "nik": "11001136",
    "name": "Reza Ichsani",
    "golongan": "5B",
    "title": "Tax Advisor General Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "FINANCIAL REPORTING & ACC. DIVISION",
    "department": "",
    "supervisor": "Monika Dhyana Zakaria"
  },
  {
    "no": 33,
    "nik": "11000425",
    "name": "Robbi Darman",
    "golongan": "5B",
    "title": "Binungan Mine Operation Area 3 Mgr",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 3 DEPT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 34,
    "nik": "11000429",
    "name": "Andi Herlisa",
    "golongan": "5A",
    "title": "Geology & Exploration Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Maurys Irwan"
  },
  {
    "no": 35,
    "nik": "11000407",
    "name": "Budi Santoso",
    "golongan": "5A",
    "title": "Environment Department Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SURVEY & GEOSPATIAL INFO. DEPT",
    "supervisor": "Maurys Irwan"
  },
  {
    "no": 36,
    "nik": "10001704",
    "name": "Dedy Kustiono",
    "golongan": "5A",
    "title": "Timber License Manager",
    "directorate": "LEGAL DIRECTORATE",
    "division": "LICENSE & CORP COMMUNICATION DIVISION",
    "department": "TIMBER LICENSE DEPARTMENT",
    "supervisor": "Yoyok Nurprasetiyo Hadi Pramono"
  },
  {
    "no": 37,
    "nik": "11000673",
    "name": "Ignatius Punto Prabowo",
    "golongan": "5A",
    "title": "Security Manager Operational",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION & SUPPORT RELATION DIV",
    "department": "SECURITY DEPARTMENT",
    "supervisor": "Cahyo Andrianto"
  },
  {
    "no": 38,
    "nik": "11001020",
    "name": "Anjas Prio Prakoso",
    "golongan": "4F",
    "title": "Mid Term Mine Plan Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Erri Jumalis Salam"
  },
  {
    "no": 39,
    "nik": "11000509",
    "name": "Azwar Fanani",
    "golongan": "4F",
    "title": "Senior Manager Safety & Health Sub Divis",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 40,
    "nik": "11001584",
    "name": "Indra Nur Sidiq",
    "golongan": "4F",
    "title": "OHS Data Control Eval & Report Act Mngr",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "OHS DATA CONTROL EVA & REPORTING DEPT",
    "supervisor": "Rahmantha Purba Anggana"
  },
  {
    "no": 41,
    "nik": "11001591",
    "name": "Muhammad Adi Prasojo",
    "golongan": "4F",
    "title": "Geotechnical Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 42,
    "nik": "11001330",
    "name": "Pandu Zea Ardiansyah",
    "golongan": "4F",
    "title": "Mining Operation Senior Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Arintoko Saputro"
  },
  {
    "no": 43,
    "nik": "11000430",
    "name": "Prasetya Wirawan",
    "golongan": "4F",
    "title": "Blasting Operation Sr Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "",
    "supervisor": "Dudu Anwar Sanusi"
  },
  {
    "no": 44,
    "nik": "11001592",
    "name": "Ridho Ilham Mury Nanda",
    "golongan": "4F",
    "title": "System Innovation & Risk Mngmnt Act Mgr",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 45,
    "nik": "11000579",
    "name": "Sindu Umboro",
    "golongan": "4F",
    "title": "Survey & Geospatial Info. Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 46,
    "nik": "11001334",
    "name": "Ardyan Febrianto",
    "golongan": "4E",
    "title": "Mid Term Mine Plan Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Erri Jumalis Salam"
  },
  {
    "no": 47,
    "nik": "11001327",
    "name": "Okky Warman",
    "golongan": "4E",
    "title": "Downstream Project Senior Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MINE DEV & PRODUCTION CONTROL DEPT",
    "supervisor": "Rayhan Fajusha"
  },
  {
    "no": 48,
    "nik": "11001451",
    "name": "Saeful Aziz",
    "golongan": "4E",
    "title": "Downstream Project Senior Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MINE DEV & PRODUCTION CONTROL DEPT",
    "supervisor": "Rayhan Fajusha"
  },
  {
    "no": 49,
    "nik": "11000257",
    "name": "Sudrajat",
    "golongan": "4E",
    "title": "Blasting Permit Sr Specialist",
    "directorate": "LEGAL DIRECTORATE",
    "division": "LICENSE & CORP COMMUNICATION DIVISION",
    "department": "Berau License Department",
    "supervisor": "Suryono"
  },
  {
    "no": 50,
    "nik": "11001622",
    "name": "Hugo Sindhunata",
    "golongan": "4C",
    "title": "Geotechnical Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  }
];

export const TIER_2_TALENT_RETENTION: Omit<TalentRetentionItem, "tier">[] = [
  {
    "no": 51,
    "nik": "10000063",
    "name": "Yatemo Hudi",
    "golongan": "6B",
    "title": "Fin Planning & Analyst General Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "FINANCIAL PLANNING & ANALYSIS DIVISION",
    "department": "",
    "supervisor": "Bambang Heruawan Haliman"
  },
  {
    "no": 52,
    "nik": "11000830",
    "name": "Haris Wiyono",
    "golongan": "6A",
    "title": "Internal Audit GM",
    "directorate": "LEGAL DIRECTORATE",
    "division": "INTERNAL AUDIT DIVISION",
    "department": "",
    "supervisor": "Edy Santoso"
  },
  {
    "no": 53,
    "nik": "11001404",
    "name": "Hendrianto",
    "golongan": "6A",
    "title": "Participative  & IT Audit Sub Div. Head",
    "directorate": "LEGAL DIRECTORATE",
    "division": "INTERNAL AUDIT DIVISION",
    "department": "PARTICIPATIVE & IT AUDIT DEPARTMENT",
    "supervisor": "Haris Wiyono"
  },
  {
    "no": 54,
    "nik": "11000587",
    "name": "Henry Parsaulian Sidi Soambaton Siregar",
    "golongan": "6A",
    "title": "Financial Controlling Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "FINANCIAL REPORTING & ACC. DIVISION",
    "department": "",
    "supervisor": "Monika Dhyana Zakaria"
  },
  {
    "no": 55,
    "nik": "11001399",
    "name": "Tina Melinda",
    "golongan": "6A",
    "title": "Business Development IIRC",
    "directorate": "HRGS DIRECTORATE",
    "division": "PEOPLE STRATEGIC",
    "department": "ITSB (IIRC)",
    "supervisor": "Yuni Lasti Faulinda"
  },
  {
    "no": 56,
    "nik": "11000356",
    "name": "Idam Faisal Rahman",
    "golongan": "5D",
    "title": "Tax Division General Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "TAX,CUSTOMS & GOV. LIABILITIES OPS DIV",
    "department": "",
    "supervisor": "Bambang Heruawan Haliman"
  },
  {
    "no": 57,
    "nik": "11000364",
    "name": "Reza Hidayat",
    "golongan": "5D",
    "title": "Cash Management Sr Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "TREASURY DIVISION",
    "department": "CASH MANAGEMENT DEPARTMENT",
    "supervisor": "Monika Dhyana Zakaria"
  },
  {
    "no": 58,
    "nik": "11000326",
    "name": "Supandri Yaman",
    "golongan": "5D",
    "title": "Marketing & Sales Support Sr Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Fathur Rohman"
  },
  {
    "no": 59,
    "nik": "11000861",
    "name": "Zaldi Nugroho",
    "golongan": "5D",
    "title": "Banking & Trade Finance Sr Manager",
    "directorate": "FINANCE DIRECTORATE",
    "division": "TREASURY DIVISION",
    "department": "BANKING & TRADE FINANCE DEPARTMENT",
    "supervisor": "Monika Dhyana Zakaria"
  },
  {
    "no": 60,
    "nik": "11000319",
    "name": "Aditya Irawan",
    "golongan": "5C",
    "title": "OD & TM Sr Manager",
    "directorate": "HRGS DIRECTORATE",
    "division": "HRGS MTL DIVISION",
    "department": "HR OPERATIONS DEPARTMENT",
    "supervisor": "Agus Dani Ariyanto"
  },
  {
    "no": 61,
    "nik": "11000378",
    "name": "Agus Setiawan Wahyu Wibowo",
    "golongan": "5C",
    "title": "Area 1 Marketing & Sales Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "AREA 3 MARKETING & SALES DEPARTMENT",
    "supervisor": "Rori Surya Perdana"
  },
  {
    "no": 62,
    "nik": "11000708",
    "name": "Alfons Igo Hadiputranto Bunga Naen",
    "golongan": "5C",
    "title": "GMO Sr. Contracts Mgmnt Manager",
    "directorate": "GMO SSU",
    "division": "GMO COMMERCIAL & OPS IMPROVEMENT DIV",
    "department": "GMO CONTRACTS MGMT (NON MINING) DEPT",
    "supervisor": "Felix Gianmeta Hardi"
  },
  {
    "no": 63,
    "nik": "11000464",
    "name": "Apribowo Rossiyanto",
    "golongan": "5C",
    "title": "Environment, Mine Closure & DAS Sr Mgr",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "",
    "supervisor": "Febriwiadi Djali"
  },
  {
    "no": 64,
    "nik": "11000591",
    "name": "Luhut Martahi Tumbur Hasiholan Lumban Raja",
    "golongan": "5C",
    "title": "K3L Audit Sr. Manager",
    "directorate": "LEGAL DIRECTORATE",
    "division": "INTERNAL AUDIT DIVISION",
    "department": "K3L AUDIT DEPARTMENT",
    "supervisor": "Haris Wiyono"
  },
  {
    "no": 65,
    "nik": "11000624",
    "name": "Andi Henry Achmad",
    "golongan": "5B",
    "title": "ER & Safety Services Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "ER & SAFETY SERVICES DEPARTMENT",
    "supervisor": "Jimmi Idris"
  },
  {
    "no": 66,
    "nik": "11000397",
    "name": "Faisal Rachman",
    "golongan": "5B",
    "title": "Marketing & Sales Support Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "MARKETING SUPPORT DEPARTMENT",
    "supervisor": "Supandri Yaman"
  },
  {
    "no": 67,
    "nik": "11000661",
    "name": "Hifzil Kirmi",
    "golongan": "5B",
    "title": "Env Strategic &Sustainability Manager",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "QUALITY & RISK MANAGEMENT SYSTEM DEPT",
    "supervisor": "Febriwiadi Djali"
  },
  {
    "no": 68,
    "nik": "11000588",
    "name": "Sandy Santosa",
    "golongan": "5B",
    "title": "Shipping Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "SHIPPING DEPARTMENT (PJK3L MARINE)",
    "supervisor": "Hendra Yusrizal"
  },
  {
    "no": 69,
    "nik": "11000320",
    "name": "Yayat Ruhiyat",
    "golongan": "5B",
    "title": "Area 2 Marketing & Sales Manager",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "AREA 2 MARKETING & SALES DEPARTMENT",
    "supervisor": "Rori Surya Perdana"
  },
  {
    "no": 70,
    "nik": "11000839",
    "name": "Evietha Damayanthie",
    "golongan": "5A",
    "title": "General Services Manager",
    "directorate": "HRGS DIRECTORATE",
    "division": "HRGS BC DIVISION",
    "department": "GENERAL SERVICES DEPARTMENT",
    "supervisor": "Agus Dani Ariyanto"
  },
  {
    "no": 71,
    "nik": "11000852",
    "name": "Ezra Boron",
    "golongan": "5A",
    "title": "Ops & Financial Audit Manager",
    "directorate": "LEGAL DIRECTORATE",
    "division": "INTERNAL AUDIT DIVISION",
    "department": "OPERATIONAL & FINANCIAL AUDIT DEPARTMENT",
    "supervisor": "Haris Wiyono"
  },
  {
    "no": 72,
    "nik": "11001570",
    "name": "Abdullah Eli",
    "golongan": "4F",
    "title": "Data and AI Engineering Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    "department": "MINING TECHNOLOGY DEPARTMENT",
    "supervisor": "Arif Widya Susanto"
  },
  {
    "no": 73,
    "nik": "11000960",
    "name": "Ade Manjalo Sihombing",
    "golongan": "4F",
    "title": "Mining Section Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Azwar Fanani"
  },
  {
    "no": 74,
    "nik": "11000646",
    "name": "Arief Hudiantoro",
    "golongan": "4F",
    "title": "SMO Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "SAMBARATA MINE OPERATION DEPARTMENT",
    "supervisor": "Nanang Nur Cahyadi"
  },
  {
    "no": 75,
    "nik": "11000510",
    "name": "Bambang Haryanto",
    "golongan": "4F",
    "title": "BMO 2 Environment Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Saridi"
  },
  {
    "no": 76,
    "nik": "11000636",
    "name": "Budiansyah",
    "golongan": "4F",
    "title": "Permit & Commisioning Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "OPERATIONS COMPLIANCE DEPARTMENT",
    "supervisor": "Andi Zulkarnain"
  },
  {
    "no": 77,
    "nik": "11000362",
    "name": "Christine Anggraini",
    "golongan": "4F",
    "title": "Transport, HO & Exploration Safety Supt",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 78,
    "nik": "11001589",
    "name": "Davi Aditya Tantra",
    "golongan": "4F",
    "title": "Safety Investigation & Risk Ctrl Expert",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 79,
    "nik": "11000783",
    "name": "Fajar Hermawan",
    "golongan": "4F",
    "title": "Marketing Research Manager (Act)",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "",
    "supervisor": "Rori Surya Perdana"
  },
  {
    "no": 80,
    "nik": "11000618",
    "name": "Ida Wayan Supriharta",
    "golongan": "4F",
    "title": "Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 3 DEPT",
    "supervisor": "Robbi Darman"
  },
  {
    "no": 81,
    "nik": "11000576",
    "name": "Iqbal Bastimi",
    "golongan": "4F",
    "title": "Gurimbang Mining Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "GURIMBANG MINE OPERATION DEPARTMENT",
    "supervisor": "Dian Permana Putra"
  },
  {
    "no": 82,
    "nik": "11000355",
    "name": "Iwan Widiadmoko Igasurant",
    "golongan": "4F",
    "title": "Environment Sustainability Superintenden",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Saridi"
  },
  {
    "no": 83,
    "nik": "11000390",
    "name": "Reza Hermawan",
    "golongan": "4F",
    "title": "Community Base Development Manager (Act)",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION & SUPPORT RELATION DIV",
    "department": "COMMUNITY BASE DEVELOPMENT DEPARTMENT",
    "supervisor": "Cahyo Andrianto"
  },
  {
    "no": 84,
    "nik": "11000392",
    "name": "Sigit Kurniawan",
    "golongan": "4F",
    "title": "CBD Program P&C Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION & SUPPORT RELATION DIV",
    "department": "COMMUNITY BASE DEVELOPMENT DEPARTMENT",
    "supervisor": "Reza Hermawan"
  },
  {
    "no": 85,
    "nik": "11001304",
    "name": "Tegar Eka Perdana Adiarsa",
    "golongan": "4F",
    "title": "Environment Strategic Plan & Eval Supt",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "QUALITY & RISK MANAGEMENT SYSTEM DEPT",
    "supervisor": "Hifzil Kirmi"
  },
  {
    "no": 86,
    "nik": "11001031",
    "name": "Tommy Yulian",
    "golongan": "4F",
    "title": "SMO B1 Mining Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "SAMBARATA MINE OPERATION DEPARTMENT",
    "supervisor": "Nanang Nur Cahyadi"
  },
  {
    "no": 87,
    "nik": "11000408",
    "name": "Tri Daryono Agustinus",
    "golongan": "4F",
    "title": "Parapatan Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BMO AREA 1 DEPARTMENT",
    "supervisor": "Mando Godli . H. Sirait"
  },
  {
    "no": 88,
    "nik": "11000404",
    "name": "Wahyudi",
    "golongan": "4F",
    "title": "BMO 2 Blok 7 Safety Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 89,
    "nik": "11000772",
    "name": "Yudhi Kristian",
    "golongan": "4F",
    "title": "LMO Environment Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Saridi"
  },
  {
    "no": 90,
    "nik": "11000826",
    "name": "Andi Nugroho",
    "golongan": "4E",
    "title": "Hydrology Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 91,
    "nik": "11001237",
    "name": "Ardilla Firmana",
    "golongan": "4E",
    "title": "Mine Survey Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SURVEY & GEOSPATIAL INFO. DEPT",
    "supervisor": "Budi Santoso"
  },
  {
    "no": 92,
    "nik": "11001769",
    "name": "Dani Venansus Paul",
    "golongan": "4E",
    "title": "Senior Geotech Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 93,
    "nik": "11001582",
    "name": "Dhehave Riaviandhi",
    "golongan": "4E",
    "title": "Safety Superintendent SMO",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 94,
    "nik": "11001643",
    "name": "Dori Apriman Duha",
    "golongan": "4E",
    "title": "Short Term Mine Plan Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SHORT TERM MINE PLAN DEPARTMENT",
    "supervisor": "Alex Prabudi"
  },
  {
    "no": 95,
    "nik": "11001453",
    "name": "Dwi Al Aji Suseno",
    "golongan": "4E",
    "title": "Mining Technology Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "QUALITY & RISK MANAGEMENT SYSTEM DEPT",
    "supervisor": "Hifzil Kirmi"
  },
  {
    "no": 96,
    "nik": "11001365",
    "name": "Franky R. Kodoatie",
    "golongan": "4E",
    "title": "HSE Training Operation Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "HSE CERTIFICATION & TRAINING DEPARTMENT",
    "supervisor": "Ongky Elisman"
  },
  {
    "no": 97,
    "nik": "11000850",
    "name": "Hanafi",
    "golongan": "4E",
    "title": "Hydrology Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 98,
    "nik": "11000720",
    "name": "Ikhsan Setiawan",
    "golongan": "4E",
    "title": "Mid Term Mine Plan Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Erri Jumalis Salam"
  },
  {
    "no": 99,
    "nik": "11001601",
    "name": "Irwan Hermawan",
    "golongan": "4E",
    "title": "People Data & Permit Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "HSE CERTIFICATION & TRAINING DEPARTMENT",
    "supervisor": "Ongky Elisman"
  },
  {
    "no": 100,
    "nik": "11001235",
    "name": "Muhammad Agus Rizan",
    "golongan": "4E",
    "title": "BMO Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Pandu Zea Ardiansyah"
  },
  {
    "no": 101,
    "nik": "11000744",
    "name": "Muhammad Endriantho",
    "golongan": "4E",
    "title": "Mid Term Mine Plan Sr. Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Erri Jumalis Salam"
  },
  {
    "no": 102,
    "nik": "11000650",
    "name": "Muhammad Masyhuri",
    "golongan": "4E",
    "title": "Management Support Kakao Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "",
    "supervisor": "Febriwiadi Djali"
  },
  {
    "no": 103,
    "nik": "11000928",
    "name": "Paian Mhm Siregar",
    "golongan": "4E",
    "title": "Parapatan Safety Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 104,
    "nik": "11001234",
    "name": "Rahma Fitrian",
    "golongan": "4E",
    "title": "Environment Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Saridi"
  },
  {
    "no": 105,
    "nik": "11000996",
    "name": "Rudini",
    "golongan": "4E",
    "title": "Strategic Communication Superintendent",
    "directorate": "",
    "division": "",
    "department": "",
    "supervisor": ""
  },
  {
    "no": 106,
    "nik": "11000651",
    "name": "Sutrisno",
    "golongan": "4E",
    "title": "DAS Rehabilitation Project Supt.",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "DAS REHABILITATION PROJECT DEPARTMENT",
    "supervisor": "Apribowo Rossiyanto"
  },
  {
    "no": 107,
    "nik": "11000985",
    "name": "Syamsul Bahri",
    "golongan": "4E",
    "title": "Geotechnic Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 108,
    "nik": "11000131",
    "name": "Yoga Wisnu Broto",
    "golongan": "4E",
    "title": "Industrial Relation Superintendent",
    "directorate": "HRGS DIRECTORATE",
    "division": "HRGS BC DIVISION",
    "department": "HR OPERATIONS DEPARTMENT",
    "supervisor": "Tomy Indarto"
  },
  {
    "no": 109,
    "nik": "11000351",
    "name": "Yoki Dwi Asmoro",
    "golongan": "4E",
    "title": "Resources Sr Geologist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Andi Herlisa"
  },
  {
    "no": 110,
    "nik": "11001594",
    "name": "Abdul Aziz",
    "golongan": "4D",
    "title": "Mid Term Mine Plan Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MID TERM MINE PLAN DEPARTMENT",
    "supervisor": "Erri Jumalis Salam"
  },
  {
    "no": 111,
    "nik": "11001571",
    "name": "Abi Nubli Abadi",
    "golongan": "4D",
    "title": "System Architect & Solution",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    "department": "MINING TECHNOLOGY DEPARTMENT",
    "supervisor": "Abdullah Eli"
  },
  {
    "no": 112,
    "nik": "11001180",
    "name": "Aldo Brilianto",
    "golongan": "4D",
    "title": "Senior Pit Geologist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Andi Herlisa"
  },
  {
    "no": 113,
    "nik": "11001598",
    "name": "Andhika Indra Subroto",
    "golongan": "4D",
    "title": "B9 Mining Section Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Pandu Zea Ardiansyah"
  },
  {
    "no": 114,
    "nik": "11001259",
    "name": "Danang Widitomo",
    "golongan": "4D",
    "title": "Project Survey Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SURVEY & GEOSPATIAL INFO. DEPT",
    "supervisor": "Budi Santoso"
  },
  {
    "no": 115,
    "nik": "11001185",
    "name": "Dwijo Sampurno",
    "golongan": "4D",
    "title": "Senior Pit Geologist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Andi Herlisa"
  },
  {
    "no": 116,
    "nik": "11001599",
    "name": "Eksan Yuliyanto",
    "golongan": "4D",
    "title": "Short Term Mine Plan Sr Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SHORT TERM MINE PLAN DEPARTMENT",
    "supervisor": "Alex Prabudi"
  },
  {
    "no": 117,
    "nik": "11001512",
    "name": "Evanda Eko Putra Marris",
    "golongan": "4D",
    "title": "Pit Senior Geologist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Andi Herlisa"
  },
  {
    "no": 118,
    "nik": "11000721",
    "name": "Japriusman",
    "golongan": "4D",
    "title": "GMO Selatan Mining Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "GURIMBANG MINE OPERATION DEPARTMENT",
    "supervisor": "Dian Permana Putra"
  },
  {
    "no": 119,
    "nik": "11000400",
    "name": "Mauli Dedi Abdiyanto",
    "golongan": "4D",
    "title": "Senior Pit Geologist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOLOGY & EXPLORATION DEPARTMENT",
    "supervisor": "Andi Herlisa"
  },
  {
    "no": 120,
    "nik": "11001187",
    "name": "Reza Eka Putra",
    "golongan": "4D",
    "title": "Short Term Mine Plan Senior Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SHORT TERM MINE PLAN DEPARTMENT",
    "supervisor": "Alex Prabudi"
  },
  {
    "no": 121,
    "nik": "11001457",
    "name": "Rifki Azizar Ilmiadi",
    "golongan": "4D",
    "title": "SMO Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "SAMBARATA MINE OPERATION DEPARTMENT",
    "supervisor": "Tommy Yulian"
  },
  {
    "no": 122,
    "nik": "11001467",
    "name": "Riza Rahmah Angelia",
    "golongan": "4D",
    "title": "Data and AI Engineering Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    "department": "MINING TECHNOLOGY DEPARTMENT",
    "supervisor": "Arif Widya Susanto"
  },
  {
    "no": 123,
    "nik": "11001459",
    "name": "Slavito Shan Ranti",
    "golongan": "4D",
    "title": "Mine Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 3 DEPT",
    "supervisor": "Ida Wayan Supriharta"
  },
  {
    "no": 124,
    "nik": "11001585",
    "name": "Taufik Akbar Legowo",
    "golongan": "4D",
    "title": "Data & Reporting Senior Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "OHS DATA CONTROL EVA & REPORTING DEPT",
    "supervisor": "Indra Nur Sidiq"
  },
  {
    "no": 125,
    "nik": "11000970",
    "name": "Trias Wibowo",
    "golongan": "4D",
    "title": "Transhipment Superintendent",
    "directorate": "MARKETING DIRECTORATE",
    "division": "MARKETING & MARINE DIVISION",
    "department": "SHIPPING DEPARTMENT (PJK3L MARINE)",
    "supervisor": "Sandy Santosa"
  },
  {
    "no": 126,
    "nik": "11001063",
    "name": "Yadi Haryadi",
    "golongan": "4D",
    "title": "LMO Safety Superintendent",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "SAFETY OPERATIONS DEPARTMENT",
    "supervisor": "Salahuddin Al Rasyid"
  },
  {
    "no": 127,
    "nik": "11001636",
    "name": "Yoki Sepwanto Rajagukguk",
    "golongan": "4D",
    "title": "Remote Survey Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SURVEY & GEOSPATIAL INFO. DEPT",
    "supervisor": "Budi Santoso"
  },
  {
    "no": 128,
    "nik": "11001583",
    "name": "Dita Amalia",
    "golongan": "4C",
    "title": "Environment Technical Services Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "MINE CLOSURE DEPARTMENT",
    "supervisor": "Apribowo Rossiyanto"
  },
  {
    "no": 129,
    "nik": "11001505",
    "name": "Herman Maraden",
    "golongan": "4C",
    "title": "Geospatial Technology Dev. Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SURVEY & GEOSPATIAL INFO. DEPT",
    "supervisor": "Budi Santoso"
  },
  {
    "no": 130,
    "nik": "11001602",
    "name": "Mohamad Ihsan Priambodo",
    "golongan": "4C",
    "title": "Mine Supervisor B",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "SAMBARATA MINE OPERATION DEPARTMENT",
    "supervisor": "Tommy Yulian"
  },
  {
    "no": 131,
    "nik": "11001771",
    "name": "Muhammad Alam Satria",
    "golongan": "4C",
    "title": "Geotech Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 132,
    "nik": "11001794",
    "name": "Pascalia Vinca Alvando",
    "golongan": "4C",
    "title": "Hydrology Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 133,
    "nik": "11001382",
    "name": "Rusadi Apriansyah",
    "golongan": "4C",
    "title": "Blasting Engineering",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BMO AREA 1 DEPARTMENT",
    "supervisor": "Tri Daryono Agustinus"
  },
  {
    "no": 134,
    "nik": "11001276",
    "name": "Senda Banne Ringgi",
    "golongan": "4C",
    "title": "Compliance Specialist GMO",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "OPERATIONS COMPLIANCE DEPARTMENT",
    "supervisor": "Andi Zulkarnain"
  },
  {
    "no": 135,
    "nik": "11001323",
    "name": "Subangkit Munsyiri",
    "golongan": "4C",
    "title": "Short Term Mine Plan Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "SHORT TERM MINE PLAN DEPARTMENT",
    "supervisor": "Alex Prabudi"
  },
  {
    "no": 136,
    "nik": "11001607",
    "name": "Yazid Luthfil Khaliq",
    "golongan": "4C",
    "title": "Mine Supervisor BMO 3",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 3 DEPT",
    "supervisor": "Ida Wayan Supriharta"
  },
  {
    "no": 137,
    "nik": "11001784",
    "name": "Alifya Salsadila",
    "golongan": "4B",
    "title": "Env Evaluator & Project Improv Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Iwan Widiadmoko Igasurant"
  },
  {
    "no": 138,
    "nik": "11000903",
    "name": "Andi Muammar Asir",
    "golongan": "4B",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Azwar Fanani"
  },
  {
    "no": 139,
    "nik": "11001773",
    "name": "Andre Santoso Sam",
    "golongan": "4B",
    "title": "Operation Support & Relation Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPERATION & SUPPORT RELATION DIV",
    "department": "",
    "supervisor": "Cahyo Andrianto"
  },
  {
    "no": 140,
    "nik": "11001629",
    "name": "Angkasa Wira Jati",
    "golongan": "4B",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BMO AREA 1 DEPARTMENT",
    "supervisor": "Tri Daryono Agustinus"
  },
  {
    "no": 141,
    "nik": "11001779",
    "name": "Cahyaningtyas Rindhu Murdowati",
    "golongan": "4B",
    "title": "Data & Mining Technology Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OPR HSE & SUPPORT RELATION DEPUTY DIR",
    "department": "MINING TECHNOLOGY DEPARTMENT",
    "supervisor": "Abdullah Eli"
  },
  {
    "no": 142,
    "nik": "11001624",
    "name": "Fadhilla Akbar",
    "golongan": "4B",
    "title": "Business Intelligence & Production Contr",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "MINE DEV & PRODUCTION CONTROL DEPT",
    "supervisor": "Rayhan Fajusha"
  },
  {
    "no": 143,
    "nik": "11001623",
    "name": "Firmandi Nuswantoro",
    "golongan": "4B",
    "title": "Geotechnical Engineer",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE PLANNING & TECH. SERVICES DIVISION",
    "department": "GEOTECHNIC & HYDROLOGY DEPT",
    "supervisor": "Lukman Hakim"
  },
  {
    "no": 144,
    "nik": "11000332",
    "name": "Gatot Hernanto",
    "golongan": "4B",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Ade Manjalo Sihombing"
  },
  {
    "no": 145,
    "nik": "11001626",
    "name": "Henry Harianto",
    "golongan": "4B",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "GURIMBANG MINE OPERATION DEPARTMENT",
    "supervisor": "Japriusman"
  },
  {
    "no": 146,
    "nik": "11001619",
    "name": "M. Affan Mahfudz",
    "golongan": "4B",
    "title": "Safety Evaluator",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "OHS DATA CONTROL EVA & REPORTING DEPT",
    "supervisor": "Indra Nur Sidiq"
  },
  {
    "no": 147,
    "nik": "11001620",
    "name": "Mohamad Firhan Maulana",
    "golongan": "4B",
    "title": "Data & Reporting Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "OCCUPATIONAL HEALTH & SAFETY DIVISION",
    "department": "OHS DATA CONTROL EVA & REPORTING DEPT",
    "supervisor": "Indra Nur Sidiq"
  },
  {
    "no": 148,
    "nik": "11001635",
    "name": "Rafli Permana Putra",
    "golongan": "4B",
    "title": "Standar & Regulation Compl Specialist",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "QUALITY & RISK MANAGEMENT SYSTEM DEPT",
    "supervisor": "Tegar Eka Perdana Adiarsa"
  },
  {
    "no": 149,
    "nik": "11001630",
    "name": "Yosua Fedrik Nababan",
    "golongan": "4B",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Azwar Fanani"
  },
  {
    "no": 150,
    "nik": "11001625",
    "name": "Yuzar Chairil Firmansyah",
    "golongan": "4B",
    "title": "Mine Supervisor B8",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Muhammad Agus Rizan"
  },
  {
    "no": 151,
    "nik": "11001798",
    "name": "Agung Limowa",
    "golongan": "4A",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Muhammad Agus Rizan"
  },
  {
    "no": 152,
    "nik": "11001120",
    "name": "Budi Hermawan",
    "golongan": "4A",
    "title": "LMO Environment Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "SYSTEM COMPLIANCE & ENVIRONMENT DIVISON",
    "department": "ENVIRONMENT DEPARTMENT",
    "supervisor": "Rahma Fitrian"
  },
  {
    "no": 153,
    "nik": "11001802",
    "name": "Endrico Franki Hamonangan",
    "golongan": "4A",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "LATI MINE OPERATION DEPARTMENT",
    "supervisor": "Azwar Fanani"
  },
  {
    "no": 154,
    "nik": "11001799",
    "name": "Halilintar Dixffin",
    "golongan": "4A",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BMO AREA 1 DEPARTMENT",
    "supervisor": "Tri Daryono Agustinus"
  },
  {
    "no": 155,
    "nik": "11001801",
    "name": "Mahardhika Depi Putra",
    "golongan": "4A",
    "title": "Mine Supervisor",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "GURIMBANG MINE OPERATION DEPARTMENT",
    "supervisor": "Iqbal Bastimi"
  },
  {
    "no": 156,
    "nik": "11001632",
    "name": "Rafi Muhammad Fashli",
    "golongan": "4A",
    "title": "Mine Supervisor B9",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 2 DEPT",
    "supervisor": "Andhika Indra Subroto"
  },
  {
    "no": 157,
    "nik": "11000582",
    "name": "Usman Fauzi",
    "golongan": "4A",
    "title": "Mine Supervisor BMO 3",
    "directorate": "OPERATION & HSE DIRECTORATE",
    "division": "MINE OPERATION & SUPPORT DIVISION",
    "department": "BINUNGAN MINE OPERATION AREA 3 DEPT",
    "supervisor": "Ida Wayan Supriharta"
  }
];

export const ALL_TALENT_RETENTION: TalentRetentionItem[] = [
  ...TIER_1_TALENT_RETENTION.map((item) => ({ ...item, tier: "Tier 1" as const })),
  ...TIER_2_TALENT_RETENTION.map((item) => ({ ...item, tier: "Tier 2" as const })),
];

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const TALENT_NORMALIZED_SET = new Set(ALL_TALENT_RETENTION.map((item) => normalizeName(item.name)));
const TALENT_NIK_SET = new Set(ALL_TALENT_RETENTION.map((item) => item.nik).filter(Boolean) as string[]);

export function isTalentRetentionName(name?: string | null): boolean {
  if (!name) return false;
  const norm = normalizeName(name);
  if (norm.length < 3) return false;
  if (TALENT_NORMALIZED_SET.has(norm)) return true;
  for (const talentNorm of TALENT_NORMALIZED_SET) {
    if (talentNorm.length > 4 && (norm.includes(talentNorm) || talentNorm.includes(norm))) {
      return true;
    }
  }
  return false;
}

export function isTalentRetentionNik(nik?: string | null): boolean {
  if (!nik) return false;
  const clean = nik.trim();
  return TALENT_NIK_SET.has(clean);
}

export function isTalentRetention(employee?: { nik?: string | null; name?: string | null } | null): boolean {
  if (!employee) return false;
  if (employee.nik && isTalentRetentionNik(employee.nik)) return true;
  if (employee.name && isTalentRetentionName(employee.name)) return true;
  return false;
}

export function getTalentRetentionInfo(identifier?: string | null): TalentRetentionItem | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim();
  // Check NIK first
  const byNik = ALL_TALENT_RETENTION.find((item) => item.nik === clean);
  if (byNik) return byNik;

  // Check name
  const norm = normalizeName(identifier);
  return ALL_TALENT_RETENTION.find((item) => {
    const itemNorm = normalizeName(item.name);
    return itemNorm === norm || (itemNorm.length > 4 && (norm.includes(itemNorm) || itemNorm.includes(norm)));
  });
}

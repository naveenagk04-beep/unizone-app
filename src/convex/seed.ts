import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./lib";
import type { Doc, Id } from "./_generated/dataModel";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function iso(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function days(offset = 0) {
  return Date.now() + offset * 86_400_000;
}

const SUBJECT_SEED = [
  {
    code: "CS501",
    name: "Database Management Systems",
    units: [
      "Relational model & ER design",
      "SQL & query processing",
      "Normalisation & transactions",
      "Indexing & storage",
      "NoSQL & distributed data",
    ],
    faculty: "Dr. Ananya Rao",
    color: "#6366f1",
  },
  {
    code: "CS502",
    name: "Operating Systems",
    units: [
      "Processes & scheduling",
      "Synchronisation & deadlocks",
      "Memory management",
      "File systems",
      "Virtualisation",
    ],
    faculty: "Prof. Vikram Menon",
    color: "#8b5cf6",
  },
  {
    code: "CS503",
    name: "Data Structures & Algorithms",
    units: [
      "Arrays, lists & stacks",
      "Trees & heaps",
      "Graphs",
      "Sorting & searching",
      "Dynamic programming",
    ],
    faculty: "Dr. Sneha Iyer",
    color: "#0ea5e9",
  },
  {
    code: "CS504",
    name: "Computer Networks",
    units: [
      "Network layers",
      "TCP/IP in depth",
      "Routing algorithms",
      "Application protocols",
      "Network security basics",
    ],
    faculty: "Prof. Rahul Deshmukh",
    color: "#14b8a6",
  },
  {
    code: "CS505",
    name: "Artificial Intelligence",
    units: [
      "Search & heuristics",
      "Knowledge representation",
      "Machine learning basics",
      "Neural networks",
      "AI ethics & applications",
    ],
    faculty: "Dr. Meera Krishnan",
    color: "#f59e0b",
  },
];

const DEMO_STUDENTS = [
  { name: "Priya Sharma", registerNumber: "22CSE041", year: 3, section: "A" },
  { name: "Arjun Nair", registerNumber: "22CSE017", year: 3, section: "A" },
  { name: "Meera Pillai", registerNumber: "22CSE063", year: 3, section: "A" },
  { name: "Karthik Reddy", registerNumber: "22CSE029", year: 3, section: "A" },
  { name: "Ishita Bose", registerNumber: "22CSE008", year: 2, section: "B" },
  { name: "Rohan Gupta", registerNumber: "22CSE077", year: 2, section: "B" },
];

async function seedInstitution(ctx: MutationCtx) {
  const now = Date.now();

  for (const d of [
    { name: "Computer Science & Engineering", code: "CSE", hod: "Dr. Ananya Rao", facultyCount: 24, studentCount: 480 },
    { name: "Electronics & Communication", code: "ECE", hod: "Dr. S. Balaji", facultyCount: 18, studentCount: 360 },
    { name: "Mechanical Engineering", code: "MECH", hod: "Dr. Farah Khan", facultyCount: 20, studentCount: 320 },
    { name: "Business Administration", code: "MBA", hod: "Dr. Ritu Malhotra", facultyCount: 12, studentCount: 180 },
  ]) {
    await ctx.db.insert("departments", d);
  }

  for (const s of SUBJECT_SEED) {
    await ctx.db.insert("subjects", {
      code: s.code,
      name: s.name,
      department: "CSE",
      semester: 5,
      credits: 4,
      faculty: s.faculty,
      units: s.units,
      color: s.color,
    });
  }

  const slots = [
    ["08:45", "09:40"],
    ["09:45", "10:40"],
    ["11:00", "11:55"],
    ["12:00", "12:55"],
    ["14:00", "14:55"],
  ];
  const grid = [
    ["Database Management Systems", "Operating Systems", "Data Structures & Algorithms", "Computer Networks", "Artificial Intelligence"],
    ["Computer Networks", "Database Management Systems", "Operating Systems", "Artificial Intelligence", "Data Structures & Algorithms"],
    ["Data Structures & Algorithms", "Artificial Intelligence", "Database Management Systems", "Operating Systems", "Computer Networks"],
    ["Operating Systems", "Data Structures & Algorithms", "Computer Networks", "Database Management Systems", "Artificial Intelligence"],
    ["Artificial Intelligence", "Computer Networks", "Data Structures & Algorithms", "Operating Systems", "Database Management Systems"],
  ];
  const rooms = ["C-201", "C-204", "Lab 3", "C-201", "C-110"];
  for (let day = 1; day <= 5; day++) {
    for (let slot = 0; slot < 5; slot++) {
      await ctx.db.insert("timetableSlots", {
        day,
        start: slots[slot][0],
        end: slots[slot][1],
        subject: grid[day - 1][slot],
        room: rooms[slot],
        department: "CSE",
        year: 3,
        section: "A",
        faculty: SUBJECT_SEED.find((s) => s.name === grid[day - 1][slot])?.faculty ?? "Faculty",
      });
    }
  }

  const assignmentSeed = [
    {
      title: "Normalise the campus library schema",
      description:
        "Take the given unnormalised relation for library loans and bring it to 3NF. Show every step from 1NF, list functional dependencies, and explain the trade-offs of your decomposition.",
      subject: "Database Management Systems",
      dueAt: days(2),
      points: 20,
    },
    {
      title: "CPU scheduling simulator",
      description:
        "Implement FCFS, SJF and Round Robin for the same process set. Compare average waiting time and turnaround time with a short written analysis.",
      subject: "Operating Systems",
      dueAt: days(5),
      points: 25,
    },
    {
      title: "Graph traversal lab record",
      description:
        "Complete the BFS and DFS lab, attach your output for the given graph, and derive the time complexity for both traversals.",
      subject: "Data Structures & Algorithms",
      dueAt: days(8),
      points: 15,
    },
    {
      title: "Subnetting worksheet",
      description:
        "Solve all 12 subnetting problems for the given IPv4 blocks. Show the network address, broadcast, and usable host range for each.",
      subject: "Computer Networks",
      dueAt: days(11),
      points: 10,
    },
  ];
  const assignmentIds: Id<"assignments">[] = [];
  for (const a of assignmentSeed) {
    const id = await ctx.db.insert("assignments", {
      ...a,
      department: "CSE",
      year: 3,
      section: "A",
      authorName: "Dr. Ananya Rao",
      createdAt: now - 3 * 86_400_000,
    });
    assignmentIds.push(id);
  }

  for (const e of [
    { subject: "Database Management Systems", date: days(9), startTime: "09:30", room: "Exam Hall 1", type: "Internal Assessment II" },
    { subject: "Operating Systems", date: days(12), startTime: "09:30", room: "Exam Hall 2", type: "Internal Assessment II" },
    { subject: "Computer Networks", date: days(16), startTime: "14:00", room: "Exam Hall 1", type: "Internal Assessment II" },
  ]) {
    await ctx.db.insert("exams", { ...e, department: "CSE", year: 3 });
  }

  const announcements = [
    {
      title: "Semester 5 internal assessment schedule published",
      body: "The IA-II timetable for all CSE third-year sections is now available under Academics → Exams. Hall tickets will be issued by your class advisor 48 hours before the first paper.",
      audience: "department",
      pinned: true,
    },
    {
      title: "TechnoVerse 2026 registrations are open",
      body: "Our annual technical symposium returns on 12 December. Hackathon, paper presentation and robotics tracks are open for registration. Register from the Events module.",
      audience: "college",
      pinned: true,
    },
    {
      title: "Library extends weekend hours",
      body: "The central library will remain open from 9:00 AM to 7:00 PM on Saturdays until the end of the semester. Reference copies of all IA-II textbooks are available at the help desk.",
      audience: "college",
      pinned: false,
    },
    {
      title: "Class advisor review slots — Section A",
      body: "Faculty review slots for OD and leave requests are 4:00–5:00 PM on weekdays. Please attach supporting documents before submitting so the queue moves faster.",
      audience: "section",
      pinned: false,
    },
  ];
  for (let i = 0; i < announcements.length; i++) {
    await ctx.db.insert("announcements", {
      ...announcements[i],
      department: "CSE",
      authorName: i === 0 ? "Dr. Ananya Rao" : "Office of Student Affairs",
      authorRole: i === 0 ? "faculty" : "admin",
      createdAt: now - i * 86_400_000 - 3_600_000,
    });
  }

  const resources = [
    {
      title: "DBMS — Complete Unit Notes",
      author: "Dr. Ananya Rao",
      type: "Notes",
      subject: "Database Management Systems",
      unit: "Unit 1–5",
      access: "public" as const,
      pages: 84,
      tags: ["database", "sql", "normalisation"],
      description: "Full course notes covering ER modelling, relational algebra, SQL, normalisation, transactions and indexing.",
      content:
        "A relational database stores data in tables with rows and columns. The entity relationship model captures entities, their attributes and the relationships between them before tables are created. Normalisation removes redundancy through 1NF, 2NF and 3NF. Transactions follow ACID properties so that a failed operation does not leave partial data. Indexes speed up read queries by trading extra storage and slightly slower writes.",
    },
    {
      title: "Operating Systems — Process & Memory Notes",
      author: "Prof. Vikram Menon",
      type: "Notes",
      subject: "Operating Systems",
      unit: "Unit 1–3",
      access: "public" as const,
      pages: 72,
      tags: ["processes", "deadlock", "memory"],
      description: "Concise, exam-oriented notes on processes, scheduling, synchronisation, deadlock handling and memory management.",
      content:
        "A process is a program in execution with its own address space. The CPU scheduler selects a ready process using algorithms such as FCFS, SJF or Round Robin. A deadlock occurs when four conditions hold at once: mutual exclusion, hold and wait, no preemption and circular wait. Paging divides memory into fixed-size frames so that a process can be stored in non-contiguous memory.",
    },
    {
      title: "DSA — Patterns for Problem Solving",
      author: "Dr. Sneha Iyer",
      type: "Notes",
      subject: "Data Structures & Algorithms",
      unit: "Unit 2–5",
      access: "department" as const,
      pages: 96,
      tags: ["graphs", "dp", "trees"],
      description: "Pattern-driven revision with worked examples on trees, graphs, sliding window and dynamic programming.",
      content:
        "Breadth-first search explores a graph level by level and uses a queue. Depth-first search follows one path as far as possible before backtracking and is naturally recursive. A binary search tree keeps the left subtree smaller and the right subtree larger than the node. Dynamic programming solves overlapping subproblems once and reuses the stored answer, for example in shortest path and knapsack problems.",
    },
    {
      title: "Computer Networks — TCP/IP Handbook",
      author: "Prof. Rahul Deshmukh",
      type: "Notes",
      subject: "Computer Networks",
      unit: "Unit 1–4",
      access: "public" as const,
      pages: 64,
      tags: ["tcp", "routing", "subnetting"],
      description: "A practical handbook on the layered model, IP addressing, TCP flow control and routing.",
      content:
        "The TCP/IP model has four layers: link, internet, transport and application. IP addresses identify interfaces while ports identify services on a host. TCP is connection oriented and guarantees ordered delivery using sequence numbers and acknowledgements. Congestion control adjusts the sending rate with slow start and additive increase. Routing chooses the next hop using protocols such as OSPF and BGP.",
    },
    {
      title: "AI — Search, Learning and Neural Networks",
      author: "Dr. Meera Krishnan",
      type: "Notes",
      subject: "Artificial Intelligence",
      unit: "Unit 1–5",
      access: "public" as const,
      pages: 78,
      tags: ["search", "ml", "neural networks"],
      description: "From uninformed search to regression, classification and neural network fundamentals.",
      content:
        "Uninformed search strategies explore the state space without extra knowledge, while heuristic search such as A* estimates the remaining cost. Supervised learning trains a model on labelled examples by minimising a loss function. A neural network stacks weighted layers with non-linear activation functions and learns gradients through backpropagation. Bias in training data can be amplified by a model, so evaluation and transparency matter.",
    },
    {
      title: "DBMS Previous Year Papers (2019–2025)",
      author: "Central Library",
      type: "Question paper",
      subject: "Database Management Systems",
      unit: "All units",
      access: "public" as const,
      pages: 48,
      tags: ["pyq", "exam"],
      description: "Past internal and end-semester papers with marking schemes.",
      content:
        "Frequently asked questions include ER diagram design for a given scenario, conversion to relational schema, writing SQL joins and explaining ACID properties. Normalisation questions usually ask for the highest normal form with justification. Indexing questions compare B-tree and hash indexing.",
    },
    {
      title: "Operating Systems — 7 Semester Papers",
      author: "Central Library",
      type: "Question paper",
      subject: "Operating Systems",
      unit: "All units",
      access: "public" as const,
      pages: 56,
      tags: ["pyq", "exam"],
      description: "Seven years of university question papers, arranged by unit.",
      content:
        "Recurring questions ask students to compute average waiting time for scheduling algorithms, detect deadlock from a resource allocation graph, compare paging with segmentation and explain page replacement policies with Belady's anomaly.",
    },
    {
      title: "Graph Algorithms — Recorded Lecture Series",
      author: "Dr. Sneha Iyer",
      type: "Video",
      subject: "Data Structures & Algorithms",
      unit: "Unit 3",
      access: "department" as const,
      pages: 0,
      tags: ["video", "graphs"],
      description: "Six recorded lectures with whiteboard walkthroughs for BFS, DFS, Dijkstra and topological sort.",
      content:
        "Dijkstra's algorithm finds shortest paths from a source in graphs with non-negative weights using a priority queue. Topological sorting orders a directed acyclic graph so that every edge points forward, which is used for dependency scheduling.",
    },
    {
      title: "Machine Learning Foundations — Reference Book",
      author: "Mitchell & Rao",
      type: "Book",
      subject: "Artificial Intelligence",
      unit: "Unit 3–4",
      access: "restricted" as const,
      pages: 312,
      tags: ["ml", "reference"],
      description: "Reference reading for the ML unit. Available to CSE faculty and registered AI elective students.",
      content:
        "Decision trees split data using an impurity measure such as information gain. Evaluation should use a held-out test set and report precision and recall, not accuracy alone, when classes are imbalanced.",
    },
    {
      title: "Semester 5 Syllabus — CSE",
      author: "Academic Office",
      type: "Syllabus",
      subject: "All subjects",
      unit: "All units",
      access: "public" as const,
      pages: 12,
      tags: ["syllabus", "outcomes"],
      description: "Official semester 5 syllabus with course outcomes and reference lists.",
      content:
        "Course outcomes are mapped to programme outcomes across five subjects. Each subject has five units with a 20 percent internal assessment component and a 80 percent end-semester examination.",
    },
    {
      title: "Computer Networks — Lab Manual",
      author: "Prof. Rahul Deshmukh",
      type: "Lab manual",
      subject: "Computer Networks",
      unit: "Practical",
      access: "department" as const,
      pages: 40,
      tags: ["lab", "packet tracer"],
      description: "Wireshark and Cisco Packet Tracer exercises with expected outputs.",
      content:
        "Lab exercises cover packet capture with Wireshark, static routing configuration, VLAN setup and a simple client-server socket program in Python.",
    },
    {
      title: "Placement Prep — DSA Sheet (Faculty Edition)",
      author: "Training & Placement Cell",
      type: "Reference",
      subject: "Data Structures & Algorithms",
      unit: "All units",
      access: "restricted" as const,
      pages: 28,
      tags: ["placement", "dsa"],
      description: "Curated interview problem set maintained by the placement cell.",
      content:
        "The sheet groups problems into arrays, strings, linked lists, trees, graphs and dynamic programming, with a target of 120 problems before the placement season.",
    },
  ];
  const resourceIds: Id<"libraryResources">[] = [];
  for (const r of resources) {
    const id = await ctx.db.insert("libraryResources", {
      ...r,
      department: "CSE",
      year: 2026,
    });
    resourceIds.push(id);
  }

  for (const c of [
    { name: "Masala Dosa", price: 60, category: "South Indian", description: "Crisp dosa with potato masala, sambar and chutney.", prepMinutes: 8, veg: true, bestseller: true },
    { name: "Veg Biryani", price: 110, category: "Main course", description: "Basmati rice with seasonal vegetables and raita.", prepMinutes: 12, veg: true, bestseller: true },
    { name: "Paneer Wrap", price: 95, category: "Snacks", description: "Grilled paneer, mint mayo and crunchy slaw.", prepMinutes: 7, veg: true, bestseller: false },
    { name: "Chicken Biryani", price: 140, category: "Main course", description: "Slow-cooked chicken dum biryani with salan.", prepMinutes: 14, veg: false, bestseller: true },
    { name: "Cold Coffee", price: 55, category: "Beverages", description: "Blended coffee with milk and a chocolate drizzle.", prepMinutes: 4, veg: true, bestseller: true },
    { name: "Filter Coffee", price: 25, category: "Beverages", description: "Fresh South Indian filter coffee.", prepMinutes: 2, veg: true, bestseller: false },
    { name: "Samosa (2 pcs)", price: 30, category: "Snacks", description: "Hot samosas with tamarind chutney.", prepMinutes: 3, veg: true, bestseller: false },
    { name: "Fruit Bowl", price: 70, category: "Healthy", description: "Seasonal fruit with lime and chaat masala.", prepMinutes: 4, veg: true, bestseller: false },
    { name: "Grilled Sandwich", price: 65, category: "Snacks", description: "Triple-layer sandwich with cheese and veggies.", prepMinutes: 6, veg: true, bestseller: false },
    { name: "Lemon Iced Tea", price: 40, category: "Beverages", description: "Freshly brewed iced tea with lemon.", prepMinutes: 3, veg: true, bestseller: false },
  ]) {
    await ctx.db.insert("canteenItems", { ...c, available: true });
  }

  const events = [
    {
      title: "TechnoVerse 2026 — Annual Tech Symposium",
      type: "Symposium",
      description:
        "Two days of hackathons, paper presentations, robotics and design sprints with industry mentors and a ₹1,00,000 prize pool.",
      venue: "Main Auditorium & Innovation Lab",
      startAt: days(26),
      endAt: days(27),
      fee: 250,
      capacity: 400,
      coordinatorName: "Aditya Menon",
      tags: ["Hackathon", "Papers", "Robotics"],
      theme: "indigo",
    },
    {
      title: "Full-Stack with React & Convex Workshop",
      type: "Workshop",
      description:
        "Hands-on session building a real-time campus app. Bring a laptop; we provide the starter repo and lunch.",
      venue: "CSE Seminar Hall",
      startAt: days(6),
      endAt: days(6),
      fee: 0,
      capacity: 90,
      coordinatorName: "Nandini Rao",
      tags: ["React", "Web dev"],
      theme: "violet",
    },
    {
      title: "Rhythm Nights — Cultural Fest",
      type: "Cultural",
      description:
        "Music, dance and drama across three stages, closing with the campus band showcase.",
      venue: "Open Air Theatre",
      startAt: days(40),
      endAt: days(41),
      fee: 150,
      capacity: 600,
      coordinatorName: "Sara Thomas",
      tags: ["Music", "Dance"],
      theme: "amber",
    },
    {
      title: "CodeSprint — 12 Hour Hackathon",
      type: "Competition",
      description:
        "Build for campus life in 12 hours. Teams of 4, themed problem statements revealed at kickoff.",
      venue: "Innovation Lab",
      startAt: days(14),
      endAt: days(15),
      fee: 100,
      capacity: 120,
      coordinatorName: "Aditya Menon",
      tags: ["Hackathon", "Team"],
      theme: "cyan",
    },
    {
      title: "Placement Readiness Bootcamp",
      type: "Workshop",
      description:
        "Resume clinic, mock group discussions and technical interview drills with the placement cell.",
      venue: "Placement Centre",
      startAt: days(20),
      endAt: days(21),
      fee: 0,
      capacity: 150,
      coordinatorName: "Training & Placement Cell",
      tags: ["Placement", "Career"],
      theme: "emerald",
    },
  ];
  const eventIds: Id<"events">[] = [];
  for (const e of events) {
    const id = await ctx.db.insert("events", {
      ...e,
      department: "CSE",
      registrationOpen: true,
    });
    eventIds.push(id);
  }

  for (const i of [
    { type: "found" as const, title: "Black Sony headphones", category: "Electronics", description: "Found near the second-floor reading room. Black over-ear headphones in a grey pouch.", location: "Central Library, 2nd floor", date: iso(-1), emoji: "🎧" },
    { type: "lost" as const, title: "Blue water bottle with stickers", category: "Personal item", description: "Blue Milton bottle covered in laptop stickers. Last seen after the DBMS lab.", location: "C-204", date: iso(-2), emoji: "🧴" },
    { type: "found" as const, title: "Student ID card — R. Gupta", category: "ID card", description: "ID card found outside the canteen. Name partially visible, kept at the security desk.", location: "Canteen entrance", date: iso(0), emoji: "🪪" },
    { type: "lost" as const, title: "Scientific calculator", category: "Electronics", description: "Casio FX-991 with a small crack on the back cover, name written inside.", location: "Exam Hall 2", date: iso(-4), emoji: "🧮" },
  ]) {
    await ctx.db.insert("lostFound", {
      ...i,
      reporterId: await ensureDemoStudent(ctx, 0),
      reporterName: "Priya Sharma",
      contact: "priya.sharma@campus.edu · +91 98765 43210",
      status: "open",
      createdAt: now - 86_400_000,
    });
  }

  for (const o of [
    { title: "Frontend Developer Intern", org: "Zeta Labs", type: "Internship", location: "Bengaluru · Hybrid", stipend: "₹25,000 / month", verified: true, description: "Work on a design system used by 40+ product teams. React, TypeScript and an eye for detail.", tags: ["React", "TypeScript"] },
    { title: "Data Analyst Intern", org: "Northstar Analytics", type: "Internship", location: "Remote", stipend: "₹18,000 / month", verified: true, description: "SQL, dashboards and experiment analysis with the growth team.", tags: ["SQL", "Analytics"] },
    { title: "Smart India Hackathon — Campus Team", org: "Innovation Cell", type: "Hackathon", location: "On campus", stipend: "Prize pool ₹2L", verified: true, description: "Looking for two backend developers and a designer for the SIH internal shortlist.", tags: ["Team", "Hackathon"] },
    { title: "UI/UX Design Fellowship", org: "Kaleidoscope Studio", type: "Fellowship", location: "Remote", stipend: "Stipend + credits", verified: false, description: "Six-week portfolio fellowship with weekly critiques. Unverified listing — verify independently.", tags: ["Design", "Portfolio"] },
    { title: "Open Source Contributor Program", org: "Campus Devs Collective", type: "Program", location: "Remote", stipend: "Unpaid · Certificate", verified: true, description: "Mentored contributions to campus open-source projects, with weekly code reviews.", tags: ["Open source", "Mentorship"] },
  ]) {
    await ctx.db.insert("opportunities", { ...o, link: "https://example.edu/opportunities" });
  }

  const demoIds: Id<"users">[] = [];
  for (let i = 0; i < DEMO_STUDENTS.length; i++) {
    demoIds.push(await ensureDemoStudent(ctx, i));
  }

  for (let i = 0; i < demoIds.length; i++) {
    const s = DEMO_STUDENTS[i];
    await ctx.db.insert("publicProfiles", {
      userId: demoIds[i],
      displayName: s.name,
      department: "CSE",
      year: s.year,
      skills: [
        ["React", "UI design", "Figma"],
        ["Python", "Machine learning", "Pandas"],
        ["Technical writing", "Public speaking"],
        ["Java", "Spring Boot", "SQL"],
        ["C++", "Competitive programming"],
        ["Product design", "Illustration"],
      ][i] ?? ["Problem solving"],
      interests: [
        ["Hackathons", "Design systems"],
        ["AI research", "Chess"],
        ["Debate", "Campus radio"],
        ["Backend systems", "Cricket"],
        ["Algorithms", "Running"],
        ["Art", "Photography"],
      ][i] ?? ["Campus life"],
      lookingFor: i % 2 === 0 ? ["Study buddy", "Hackathon team"] : ["Project collaborator", "Skill exchange"],
      visibility: "public",
      bio: [
        "Third-year CSE student who loves turning messy ideas into clean interfaces. Looking for a team for CodeSprint.",
        "Interested in applied ML and always up for a whiteboard session on algorithms.",
        "Writes for the campus magazine and hosts the weekly tech podcast.",
        "Full-stack learner, currently deep in distributed systems. Open to project collaborations.",
        "Competitive programmer exploring graph problems and system design.",
        "Design student-at-heart, building a campus art collective one poster at a time.",
      ][i] ?? "Campus student at UniZone.",
    });
  }

  for (const p of [
    { name: "Open Source Society", body: "Weekly contributions sessions every Thursday, 5 PM at Innovation Lab. Beginners welcome — bring a laptop.", community: "Communities", title: "Open Source Society — weekly meetup", author: "Priya Sharma", tags: ["Open source", "Weekly"] },
    { name: "Campus run club", body: "5K run around the lake every Saturday at 6:30 AM. We end with breakfast at the canteen.", community: "Interest groups", title: "Looking for running buddies 🏃", author: "Karthik Reddy", tags: ["Fitness", "Weekend"] },
    { name: "Hackathon team", body: "Need one backend dev and one designer for CodeSprint. We have a campus mobility idea and a rough prototype.", community: "Teams", title: "CodeSprint team — 2 spots left", author: "Meera Pillai", tags: ["Hackathon", "Team"] },
    { name: "Study circle", body: "Starting a DBMS + OS revision circle before IA-II. Two hours on Tuesdays and Fridays in the library discussion room.", community: "Study buddies", title: "DBMS & OS revision circle", author: "Arjun Nair", tags: ["DBMS", "OS"] },
  ]) {
    await ctx.db.insert("communityPosts", {
      community: p.community,
      authorId: demoIds[0],
      authorName: p.author,
      title: p.title,
      body: p.body,
      tags: p.tags,
      createdAt: now - Math.random() * 5 * 86_400_000,
    });
  }

  for (const p of [
    { name: "OD — Default (faculty → HOD)", type: "od" as const, steps: ["faculty", "hod"], finalStepIndex: 1, attendanceEffect: true, active: true },
    { name: "Leave — Short (up to 2 days)", type: "leave" as const, steps: ["faculty"], finalStepIndex: 0, maxDays: 2, attendanceEffect: false, active: true },
    { name: "Leave — Extended (3+ days)", type: "leave" as const, steps: ["faculty", "hod"], finalStepIndex: 1, attendanceEffect: false, active: true },
  ]) {
    await ctx.db.insert("approvalPolicies", p);
  }

  await ctx.db.insert("settings", { key: "attendanceEffect", value: "true" });
  await ctx.db.insert("settings", { key: "aiQuota", value: "30" });
  await ctx.db.insert("settings", { key: "institution", value: "Vidyanova Institute of Technology" });
  await ctx.db.insert("counters", { name: "order", value: 40 });
  await ctx.db.insert("counters", { name: "reference", value: 1099 });

  // demonstrative requests across the approval chain
  const reqSeed = [
    {
      student: 0, type: "od" as const, category: "hackathon",
      title: "National Hackathon Finals — IIT Bombay",
      organizer: "IIT Bombay · Techfest", venue: "Mumbai",
      startDate: iso(3), endDate: iso(4), reason: "Selected as a finalist in the national hackathon. Team of four representing the CSE department.",
      status: "under_faculty_review", currentRole: "faculty" as const, finalStep: false,
      history: [
        { status: "submitted", actorName: "Priya Sharma", actorRole: "student", at: now - 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 86_400_000 + 2000 },
      ],
      documentName: "techfest-invitation.pdf",
    },
    {
      student: 1, type: "leave" as const, category: "medical",
      title: "Medical leave — viral fever",
      startDate: iso(1), endDate: iso(2), reason: "Doctor advised two days of rest. Medical certificate attached.",
      status: "under_faculty_review", currentRole: "faculty" as const, finalStep: true,
      history: [
        { status: "submitted", actorName: "Arjun Nair", actorRole: "student", at: now - 43_200_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 43_200_000 + 2000 },
      ],
      documentName: "medical-certificate.pdf",
    },
    {
      student: 2, type: "od" as const, category: "symposium",
      title: "Paper presentation — IEEE Student Symposium",
      organizer: "IEEE Bangalore Section", venue: "Christ University, Bengaluru",
      startDate: iso(7), endDate: iso(7), reason: "Presenting our paper on retrieval-augmented campus assistants. Selected after abstract review.",
      status: "forwarded_to_hod", currentRole: "hod" as const, finalStep: true,
      history: [
        { status: "submitted", actorName: "Meera Pillai", actorRole: "student", at: now - 3 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 3 * 86_400_000 + 2000 },
        { status: "forwarded_to_hod", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "Abstract and invitation verified. Recommended for HOD approval.", at: now - 2 * 86_400_000 },
      ],
      documentName: "ieee-symposium-invite.pdf",
    },
    {
      student: 3, type: "leave" as const, category: "family",
      title: "Family function — extended leave",
      startDate: iso(10), endDate: iso(12), reason: "Sister's wedding at native place. Requesting three days including travel.",
      status: "forwarded_to_hod", currentRole: "hod" as const, finalStep: false,
      history: [
        { status: "submitted", actorName: "Karthik Reddy", actorRole: "student", at: now - 4 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 4 * 86_400_000 + 2000 },
        { status: "forwarded_to_hod", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "Leave exceeds two days; forwarding as per policy.", at: now - 3 * 86_400_000 },
      ],
    },
    {
      student: 0, type: "od" as const, category: "sports",
      title: "Inter-college basketball tournament",
      organizer: "State University Sports Board", venue: "State Sports Complex",
      startDate: iso(-18), endDate: iso(-17), reason: "Representing the college basketball team in the state-level tournament.",
      status: "approved", currentRole: "none" as const, finalStep: true,
      history: [
        { status: "submitted", actorName: "Priya Sharma", actorRole: "student", at: now - 22 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 22 * 86_400_000 + 2000 },
        { status: "forwarded_to_hod", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "Team selection letter verified.", at: now - 21 * 86_400_000 },
        { status: "approved", actorName: "Dr. Ananya Rao", actorRole: "hod", remarks: "Approved. Attendance to be credited as OD per policy.", at: now - 20 * 86_400_000 },
      ],
    },
    {
      student: 1, type: "od" as const, category: "workshop",
      title: "Robotics workshop — external venue",
      organizer: "Robotics Club, City College", venue: "City College",
      startDate: iso(-8), endDate: iso(-8), reason: "Attending a robotics workshop relevant to the minor project.",
      status: "rejected", currentRole: "none" as const, finalStep: true,
      history: [
        { status: "submitted", actorName: "Arjun Nair", actorRole: "student", at: now - 11 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 11 * 86_400_000 + 2000 },
        { status: "rejected", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "No invitation letter was attached and the date clashes with the IA-II schedule.", at: now - 10 * 86_400_000 },
      ],
    },
    {
      student: 2, type: "leave" as const, category: "personal",
      title: "Personal leave — documentation missing",
      startDate: iso(-2), endDate: iso(-2), reason: "Needed a day for personal work.",
      status: "returned", currentRole: "none" as const, finalStep: true,
      history: [
        { status: "submitted", actorName: "Meera Pillai", actorRole: "student", at: now - 5 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 5 * 86_400_000 + 2000 },
        { status: "returned", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "Please add a short note from your guardian, then resubmit.", at: now - 4 * 86_400_000 },
      ],
    },
  ];

  let ref = 1041;
  for (const r of reqSeed) {
    const student = DEMO_STUDENTS[r.student];
    await ctx.db.insert("requests", {
      refNo: `${r.type === "od" ? "OD" : "LV"}-2026-${String(ref++).padStart(6, "0")}`,
      type: r.type,
      category: r.category,
      userId: demoIds[r.student],
      userName: student.name,
      registerNumber: student.registerNumber,
      department: "CSE",
      year: student.year,
      section: student.section,
      title: r.title,
      organizer: "organizer" in r ? r.organizer : undefined,
      venue: "venue" in r ? r.venue : undefined,
      startDate: r.startDate,
      endDate: r.endDate,
      halfDay: false,
      reason: r.reason,
      documentName: "documentName" in r ? r.documentName : undefined,
      status: r.status,
      currentRole: r.currentRole,
      finalStep: r.finalStep,
      attendanceEffect: true,
      history: r.history,
      createdAt: r.history[0].at,
      updatedAt: r.history[r.history.length - 1].at,
    });
  }

  for (const o of [
    { student: 0, status: "ready" as const, token: 38, total: 170, items: [{ name: "Veg Biryani", qty: 1, price: 110 }, { name: "Masala Dosa", qty: 1, price: 60 }] },
    { student: 3, status: "preparing" as const, token: 39, total: 145, items: [{ name: "Chicken Biryani", qty: 1, price: 140 }] },
    { student: 1, status: "preparing" as const, token: 40, total: 110, items: [{ name: "Paneer Wrap", qty: 1, price: 95 }] },
  ]) {
    await ctx.db.insert("orders", {
      userId: demoIds[o.student],
      userName: DEMO_STUDENTS[o.student].name,
      items: o.items,
      amount: o.total,
      tokenNo: o.token,
      status: o.status,
      paymentStatus: "paid",
      paymentProvider: "Simulated",
      idempotencyKey: `seed-${o.token}`,
      createdAt: now - (41 - o.token) * 60_000,
      updatedAt: now - 60_000,
    });
  }

  for (let i = 0; i < 4; i++) {
    await ctx.db.insert("eventRegistrations", {
      eventId: eventIds[i % eventIds.length],
      userId: demoIds[i],
      userName: DEMO_STUDENTS[i].name,
      status: "registered",
      createdAt: now - i * 3_600_000,
    });
  }
  await ctx.db.insert("eventRegistrations", {
    eventId: eventIds[0],
    userId: demoIds[4],
    userName: DEMO_STUDENTS[4].name,
    status: "registered",
    createdAt: now - 7_200_000,
  });

  for (const a of [
    { name: "Dr. Ananya Rao", role: "faculty", action: "Forwarded OD request OD-2026-001042 to HOD", target: "requests/OD-2026-001042" },
    { name: "Dr. Ananya Rao", role: "hod", action: "Approved OD request OD-2026-001044", target: "requests/OD-2026-001044" },
    { name: "Admin Console", role: "admin", action: "Updated leave approval policy to 2-day faculty threshold", target: "approvalPolicies/leave-short" },
    { name: "Canteen Desk", role: "canteen_staff", action: "Marked order token #38 ready", target: "orders/token-38" },
  ]) {
    await ctx.db.insert("auditLogs", {
      actorId: demoIds[0],
      actorName: a.name,
      actorRole: a.role,
      action: a.action,
      target: a.target,
      at: now - Math.floor(Math.random() * 6) * 86_400_000,
    });
  }
}

async function ensureDemoStudent(ctx: MutationCtx, index: number): Promise<Id<"users">> {
  const info = DEMO_STUDENTS[index];
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", `${info.registerNumber.toLowerCase()}@campus.edu`))
    .unique();
  if (existing) return existing._id;
  return await ctx.db.insert("users", {
    name: info.name,
    email: `${info.registerNumber.toLowerCase()}@campus.edu`,
    role: "student",
    department: "CSE",
    departmentId: "CSE",
    registerNumber: info.registerNumber,
    year: info.year,
    section: info.section,
    status: "active",
    demo: true,
    bio: "Demo student at Vidyanova Institute of Technology.",
  });
}

async function seedUserData(ctx: MutationCtx, user: Doc<"users">, userName: string) {
  const now = Date.now();
  const isStudent = user.role === "student";
  const name = userName;

  if (isStudent) {
    for (const [i, s] of SUBJECT_SEED.entries()) {
      for (let d = 1; d <= 12; d++) {
        const absent = (i === 2 && d === 4) || (i === 4 && d === 9);
        const od = i === 0 && d === 6;
        await ctx.db.insert("attendance", {
          userId: user._id,
          subject: s.name,
          date: iso(-d * 2),
          status: absent ? "absent" : od ? "od" : "present",
          source: od ? "od" : "manual",
        });
      }
      await ctx.db.insert("marks", {
        userId: user._id,
        subject: s.name,
        internal: [24, 21, 26, 19, 23][i] ?? 22,
        maxInternal: 30,
        practical: [18, 17, 20, 16, 19][i] ?? 18,
        grade: ["A+", "A", "A+", "B+", "A"][i] ?? "A",
      });
    }

    const assignments = await ctx.db.query("assignments").take(4);
    for (const [i, a] of assignments.entries()) {
      if (i > 1) break;
      await ctx.db.insert("submissions", {
        assignmentId: a._id,
        userId: user._id,
        userName: name,
        content:
          i === 0
            ? "Attached my 3NF decomposition with the functional dependency closure. Each relation now has a candidate key and no transitive dependency."
            : "Simulator source and comparison table attached. Round Robin with quantum 4 performed best on average waiting time for this process set.",
        submittedAt: now - (i + 1) * 86_400_000,
        status: i === 0 ? "graded" : "submitted",
        grade: i === 0 ? 18 : undefined,
        feedback: i === 0 ? "Clean decomposition and a good justification. Watch the wording on partial dependencies." : undefined,
      });
    }

    await ctx.db.insert("requests", {
      refNo: "OD-2026-001020",
      type: "od",
      category: "representation",
      userId: user._id,
      userName: name,
      registerNumber: user.registerNumber ?? "22CSE000",
      department: user.department ?? "CSE",
      year: user.year ?? 3,
      section: user.section ?? "A",
      title: "College representation — inter-college debate",
      organizer: "City College Debating Society",
      venue: "City College Auditorium",
      startDate: iso(-12),
      endDate: iso(-12),
      halfDay: false,
      reason: "Selected to represent the college at the inter-college debate finals.",
      documentName: "debate-invitation.pdf",
      status: "approved",
      currentRole: "none",
      finalStep: true,
      attendanceEffect: true,
      history: [
        { status: "submitted", actorName: name, actorRole: "student", at: now - 15 * 86_400_000 },
        { status: "under_faculty_review", actorName: "System", actorRole: "system", at: now - 15 * 86_400_000 + 2000 },
        { status: "forwarded_to_hod", actorName: "Dr. Ananya Rao", actorRole: "faculty", remarks: "Invitation verified.", at: now - 14 * 86_400_000 },
        { status: "approved", actorName: "Dr. Ananya Rao", actorRole: "hod", remarks: "Approved for OD. Best of luck.", at: now - 13 * 86_400_000 },
      ],
      createdAt: now - 15 * 86_400_000,
      updatedAt: now - 13 * 86_400_000,
    });

    await ctx.db.insert("studyPlans", {
      userId: user._id,
      subject: "Database Management Systems",
      examDate: days(9),
      hoursPerDay: 2,
      status: "active",
      createdAt: now - 2 * 86_400_000,
      topics: [
        { id: uid(), title: "Relational model & ER design", unit: "Unit 1", minutes: 50, scheduledDate: iso(-1), done: true },
        { id: uid(), title: "SQL & query processing", unit: "Unit 2", minutes: 60, scheduledDate: iso(0), done: false },
        { id: uid(), title: "Normalisation & transactions", unit: "Unit 3", minutes: 60, scheduledDate: iso(1), done: false },
        { id: uid(), title: "Indexing & storage", unit: "Unit 4", minutes: 45, scheduledDate: iso(2), done: false },
        { id: uid(), title: "NoSQL & distributed data", unit: "Unit 5", minutes: 45, scheduledDate: iso(3), done: false },
        { id: uid(), title: "Full revision + PYQ set 1", unit: "Revision", minutes: 70, scheduledDate: iso(6), done: false },
      ],
    });
  }

  await ctx.db.insert("tasks", { userId: user._id, title: isStudent ? "Submit DBMS normalisation assignment" : "Review pending OD requests", priority: "high", done: false, subject: isStudent ? "Database Management Systems" : undefined, dueAt: days(1), createdAt: now });
  await ctx.db.insert("tasks", { userId: user._id, title: "Revise OS deadlock notes", priority: "medium", done: false, subject: isStudent ? "Operating Systems" : undefined, dueAt: days(3), createdAt: now });
  await ctx.db.insert("tasks", { userId: user._id, title: "Register for the React workshop", priority: "medium", done: true, createdAt: now - 86_400_000 });
  await ctx.db.insert("tasks", { userId: user._id, title: "Print the lab record", priority: "low", done: false, createdAt: now });

  await ctx.db.insert("notes", {
    userId: user._id,
    title: "DBMS — transaction quick notes",
    body: "ACID: Atomicity, Consistency, Isolation, Durability.\n\nSchedules:\n• Serializable schedule → equivalent to some serial order.\n• Conflict serializable → no conflicting operations in a cycle.\n\nRevision trick: draw the precedence graph before answering any schedule question.",
    subject: "Database Management Systems",
    pinned: true,
    createdAt: now - 2 * 86_400_000,
    updatedAt: now - 86_400_000,
  });
  await ctx.db.insert("notes", {
    userId: user._id,
    title: "CodeSprint idea — campus mobility",
    body: "Problem: shuttle timings are invisible.\nIdea: live shuttle board with crowd levels and a simple ETA model.\nNext: ask the transport office for route data, sketch 3 screens.",
    subject: "Project",
    pinned: false,
    createdAt: now - 4 * 86_400_000,
    updatedAt: now - 3 * 86_400_000,
  });

  await ctx.db.insert("goals", { userId: user._id, title: "Weekly focused study hours", target: 12, progress: 7, unit: "hours", createdAt: now });
  await ctx.db.insert("goals", { userId: user._id, title: "Complete DBMS PYQ set", target: 5, progress: 2, unit: "papers", createdAt: now });

  const habitSeed = [
    { name: "Morning revision", emoji: "🌅", targetPerWeek: 5 },
    { name: "Read 20 pages", emoji: "📖", targetPerWeek: 4 },
    { name: "Workout", emoji: "🏋️", targetPerWeek: 3 },
  ];
  for (const h of habitSeed) {
    const hid = await ctx.db.insert("habits", { ...h, userId: user._id, createdAt: now });
    for (const offset of [0, -1, -3, -4]) {
      if (Math.random() > 0.35) {
        await ctx.db.insert("habitLogs", { userId: user._id, habitId: hid, date: iso(offset) });
      }
    }
  }

  for (const [i, s] of [
    { minutes: 50, subject: "Database Management Systems" },
    { minutes: 25, subject: "Operating Systems" },
    { minutes: 50, subject: "Data Structures & Algorithms" },
    { minutes: 25, subject: "Computer Networks" },
    { minutes: 50, subject: "Database Management Systems" },
    { minutes: 75, subject: "Artificial Intelligence" },
  ].entries()) {
    await ctx.db.insert("focusSessions", {
      userId: user._id,
      minutes: s.minutes,
      startedAt: now - (i + 1) * 86_400_000,
      endedAt: now - (i + 1) * 86_400_000 + s.minutes * 60_000,
      subject: s.subject,
      status: "completed",
      kind: "pomodoro",
    });
  }

  await ctx.db.insert("workspaceEvents", { userId: user._id, title: "Project review with mentor", date: iso(2), time: "15:00", kind: "personal", createdAt: now });
  await ctx.db.insert("workspaceEvents", { userId: user._id, title: "Call home", date: iso(4), time: "19:30", kind: "personal", createdAt: now });

  if (user.role === "student" || !user.role) {
    await ctx.db.insert("publicProfiles", {
      userId: user._id,
      displayName: name,
      department: user.department ?? "CSE",
      year: user.year ?? 3,
      skills: ["React", "TypeScript", "UI design"],
      interests: ["Hackathons", "Product design", "Campus radio"],
      lookingFor: ["Study buddy", "Hackathon team"],
      visibility: "public",
      bio: "CSE student building campus tools. Looking for a team for CodeSprint and a DBMS revision buddy.",
    });
  }

  for (const n of [
    { title: "Your OD request was approved", body: "OD-2026-001048 for the inter-college debate has been approved by the HOD. The permission letter is available in Requests.", kind: "request", link: "/requests" },
    { title: "DBMS assignment due in 2 days", body: "Normalise the campus library schema — 20 points. Submit before Friday, 11:59 PM.", kind: "academic", link: "/academics" },
    { title: "TechnoVerse 2026 registrations are open", body: "Annual tech symposium on 12 December. Hackathon teams of up to 4 can register now.", kind: "event", link: "/events" },
    { title: "Canteen token #38 is ready", body: "Your order (Veg Biryani, Masala Dosa) is ready at the pickup counter.", kind: "canteen", link: "/canteen" },
  ]) {
    await ctx.db.insert("notifications", {
      userId: user._id,
      ...n,
      read: n.kind === "request",
      createdAt: now - Math.floor(Math.random() * 3) * 3_600_000,
    });
  }
}

export const ensureSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const institution = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "institution"))
      .unique();
    if (!institution) {
      await seedInstitution(ctx);
      await ctx.db.insert("meta", { key: "institution", value: "seeded" });
    }
    const userMeta = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", `user:${user._id}`))
      .unique();
    if (!userMeta) {
      await seedUserData(ctx, user, user.name ?? user.email?.split("@")[0] ?? "Campus member");
      await ctx.db.insert("meta", { key: `user:${user._id}`, value: "seeded" });
    }
    return null;
  },
});

